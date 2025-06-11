-- Feed Post Reactions Database Migration

-- Message reactions table
CREATE TABLE IF NOT EXISTS public.feed_post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('emoji', 'custom_emoji', 'sticker', 'temporary')),
  reaction_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (post_id, user_id, reaction_type, reaction_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feed_post_reactions_post_id ON public.feed_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_post_reactions_user_id ON public.feed_post_reactions(user_id);

-- Enable RLS
ALTER TABLE public.feed_post_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Reactions can be viewed by everyone" ON public.feed_post_reactions
  FOR SELECT USING (true);

CREATE POLICY "Reactions can be created by authenticated users" ON public.feed_post_reactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Reactions can be deleted by their authors" ON public.feed_post_reactions
  FOR DELETE USING (user_id = auth.uid()); 