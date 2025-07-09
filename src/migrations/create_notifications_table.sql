-- Migration to create the notifications table and related functions

-- Create extension if it doesn't exist (needed for UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to create the notifications table
CREATE OR REPLACE FUNCTION create_notifications_table()
RETURNS void AS $$
BEGIN
  -- Create the notifications table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE TABLE public.notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      target_entity_type TEXT,
      target_entity_id TEXT,
      content_snippet TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Add RLS policies
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    -- Create policy to allow users to read only their own notifications
    CREATE POLICY "Users can read their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

    -- Create policy to allow authenticated users to create notifications
    CREATE POLICY "Authenticated users can create notifications" 
    ON public.notifications FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

    -- Create policy to allow users to update their own notifications (e.g., mark as read)
    CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

    -- Grant access to authenticated users
    GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  user_id UUID,
  actor_user_id UUID,
  community_id UUID,
  notification_type TEXT,
  target_entity_type TEXT,
  target_entity_id TEXT,
  content_snippet TEXT
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Don't create notification if the actor is the same as the recipient
  IF actor_user_id = user_id THEN
    RETURN NULL;
  END IF;

  -- Insert the notification
  INSERT INTO public.notifications (
    user_id,
    actor_user_id,
    community_id,
    type,
    target_entity_type,
    target_entity_id,
    content_snippet,
    is_read
  ) VALUES (
    user_id,
    actor_user_id,
    community_id,
    notification_type,
    target_entity_type,
    target_entity_id,
    content_snippet,
    FALSE
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a post like notification
CREATE OR REPLACE FUNCTION create_post_like_notification(
  post_owner_id UUID,
  actor_user_id UUID,
  post_id TEXT,
  community_id UUID,
  actor_username TEXT
) RETURNS UUID AS $$
BEGIN
  RETURN create_notification(
    post_owner_id,
    actor_user_id,
    community_id,
    'post_like',
    'posts',
    post_id,
    actor_username || ' liked your post.'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create a comment notification
CREATE OR REPLACE FUNCTION create_comment_notification(
  post_owner_id UUID,
  actor_user_id UUID,
  post_id TEXT,
  community_id UUID,
  actor_username TEXT
) RETURNS UUID AS $$
BEGIN
  RETURN create_notification(
    post_owner_id,
    actor_user_id,
    community_id,
    'comment',
    'posts',
    post_id,
    actor_username || ' commented on your post.'
  );
END;
$$ LANGUAGE plpgsql; 