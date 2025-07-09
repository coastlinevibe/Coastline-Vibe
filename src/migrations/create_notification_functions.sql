-- Create function for executing raw SQL (for admins/service role only)
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION exec_sql FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql TO service_role;

-- Create direct function for creating notifications
CREATE OR REPLACE FUNCTION create_notification_direct(
  user_id_param UUID,
  actor_user_id_param UUID,
  community_id_param UUID,
  type_param TEXT,
  target_entity_type_param TEXT,
  target_entity_id_param TEXT,
  content_snippet_param TEXT
)
RETURNS JSON AS $$
DECLARE
  notification_id UUID;
  created_notification JSON;
BEGIN
  -- Don't create notification if the actor is the same as the recipient
  IF actor_user_id_param = user_id_param THEN
    RETURN NULL;
  END IF;

  -- Make sure the notifications table exists first
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
  ) THEN
    -- Create the table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.notifications (
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
    
    GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
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
  SELECT row_to_json(n)
  INTO created_notification
  FROM public.notifications n
  WHERE n.id = notification_id;

  RETURN created_notification;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION create_notification_direct TO authenticated;

-- Direct functions for specific notification types
CREATE OR REPLACE FUNCTION create_post_like_notification_direct(
  post_owner_id_param UUID,
  actor_user_id_param UUID,
  post_id_param TEXT,
  community_id_param UUID,
  actor_username_param TEXT
)
RETURNS JSON AS $$
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

CREATE OR REPLACE FUNCTION create_comment_notification_direct(
  post_owner_id_param UUID,
  actor_user_id_param UUID,
  post_id_param TEXT,
  community_id_param UUID,
  actor_username_param TEXT
)
RETURNS JSON AS $$
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