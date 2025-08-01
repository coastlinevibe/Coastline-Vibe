-- Add ban_date column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_date TIMESTAMP WITH TIME ZONE;

-- Create an index for faster lookups of banned profiles by date
CREATE INDEX IF NOT EXISTS idx_profiles_ban_date ON public.profiles (ban_date) WHERE is_banned = true;

-- Create a function to permanently delete banned accounts after 10 days
CREATE OR REPLACE FUNCTION public.delete_expired_banned_accounts()
RETURNS void AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete accounts that have been banned for more than 10 days
  WITH deleted_users AS (
    DELETE FROM auth.users
    WHERE id IN (
      SELECT id FROM public.profiles 
      WHERE is_banned = true 
      AND ban_date IS NOT NULL 
      AND ban_date < (CURRENT_TIMESTAMP - INTERVAL '10 days')
    )
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted_users;
  
  RAISE NOTICE 'Deleted % accounts that were banned for more than 10 days', deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
