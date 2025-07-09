-- Check if the uuid-ossp extension is available and create it if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(schema_name text, table_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = schema_name 
    AND table_name = table_name
  );
END;
$$ LANGUAGE plpgsql;

-- Create the notifications table if it doesn't exist
DO $$
BEGIN
  IF NOT (SELECT table_exists('public', 'notifications')) THEN
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

    -- Create policy to allow users to delete their own notifications
    CREATE POLICY "Users can delete their own notifications" 
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

    RAISE NOTICE 'Notifications table created successfully';
  ELSE
    RAISE NOTICE 'Notifications table already exists';
  END IF;

  -- Grant privileges on the notifications table
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO service_role;
END;
$$; 