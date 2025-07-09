-- Add poll_post_id column to posts table if it doesn't exist
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS poll_post_id UUID REFERENCES public.posts(id) NULL;

-- Update the full_ban_user_and_delete_data function to handle the case when poll_post_id doesn't exist
CREATE OR REPLACE FUNCTION public.full_ban_user_and_delete_data(p_user_id UUID, p_reason TEXT)
RETURNS void AS $$
BEGIN
    -- Mark the user as banned
    UPDATE public.profiles
    SET is_banned = TRUE, ban_reason = p_reason
    WHERE id = p_user_id;
    
    -- Delete their posts (this might cascade to comments, etc. depending on your schema)
    DELETE FROM public.posts
    WHERE author_id = p_user_id;
    
    -- Delete their comments
    DELETE FROM public.comments
    WHERE author_id = p_user_id;
    
    -- Other cleanup as needed for your application
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 