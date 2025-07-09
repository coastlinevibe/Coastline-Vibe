-- Migration to fix notifications functionality
-- Copy and paste this entire file into the Supabase SQL Editor and run it

-- First check if the notifications table exists
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
  ) INTO table_exists;
  
  -- Create notifications table if it doesn't exist
  IF NOT table_exists THEN
    RAISE NOTICE 'Creating notifications table...';
    
    -- Create extension if it doesn't exist
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Create the table
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

    -- Create policy to allow users to update their own notifications
    CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);
    
    -- Create policy to allow users to delete their own notifications
    CREATE POLICY "Users can delete their own notifications" 
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

    -- Grant appropriate privileges
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO service_role;
    
    RAISE NOTICE 'Notifications table created successfully';
  ELSE
    RAISE NOTICE 'Notifications table already exists';
  END IF;
END $$;

-- Create or replace helper functions for notification creation

-- Function to ensure table exists
CREATE OR REPLACE FUNCTION ensure_notifications_table()
RETURNS BOOLEAN AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    -- Create the table
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

    -- Create policy to allow users to update their own notifications
    CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);
    
    -- Create policy to allow users to delete their own notifications
    CREATE POLICY "Users can delete their own notifications" 
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

    -- Grant appropriate privileges
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO service_role;
    
    RETURN TRUE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION ensure_notifications_table TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_notifications_table TO service_role;

-- Direct function for creating notifications
CREATE OR REPLACE FUNCTION create_notification_direct(
  user_id_param UUID,
  actor_user_id_param UUID,
  community_id_param UUID,
  type_param TEXT,
  target_entity_type_param TEXT,
  target_entity_id_param TEXT,
  content_snippet_param TEXT
)
RETURNS JSONB AS $$
DECLARE
  notification_id UUID;
  created_notification JSONB;
  table_exists BOOLEAN;
BEGIN
  -- Don't create notification if the actor is the same as the recipient
  IF actor_user_id_param = user_id_param THEN
    RETURN NULL;
  END IF;

  -- Ensure table exists
  PERFORM ensure_notifications_table();

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
    user_id_param,
    actor_user_id_param,
    community_id_param,
    type_param,
    target_entity_type_param,
    target_entity_id_param,
    content_snippet_param,
    FALSE
  )
  RETURNING id INTO notification_id;

  -- Get the full notification as JSON
  SELECT to_jsonb(n)
  INTO created_notification
  FROM public.notifications n
  WHERE n.id = notification_id;

  RETURN created_notification;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION create_notification_direct TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification_direct TO service_role;

-- Helper functions for specific notification types
CREATE OR REPLACE FUNCTION create_post_like_notification_direct(
  post_owner_id_param UUID,
  actor_user_id_param UUID,
  post_id_param TEXT,
  community_id_param UUID,
  actor_username_param TEXT
)
RETURNS JSONB AS $$
BEGIN
  RETURN create_notification_direct(
    post_owner_id_param,
    actor_user_id_param,
    community_id_param,
    'post_like',
    'posts',
    post_id_param,
    actor_username_param || ' liked your post.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION create_post_like_notification_direct TO authenticated;
GRANT EXECUTE ON FUNCTION create_post_like_notification_direct TO service_role;

CREATE OR REPLACE FUNCTION create_comment_notification_direct(
  post_owner_id_param UUID,
  actor_user_id_param UUID,
  post_id_param TEXT,
  community_id_param UUID,
  actor_username_param TEXT
)
RETURNS JSONB AS $$
BEGIN
  RETURN create_notification_direct(
    post_owner_id_param,
    actor_user_id_param,
    community_id_param,
    'comment',
    'posts',
    post_id_param,
    actor_username_param || ' commented on your post.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION create_comment_notification_direct TO authenticated;
GRANT EXECUTE ON FUNCTION create_comment_notification_direct TO service_role;

-- Add a message confirming successful execution
DO $$
BEGIN
  RAISE NOTICE 'Notification system successfully updated';
END $$; 