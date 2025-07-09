-- Create stickers table
CREATE TABLE IF NOT EXISTS public.stickers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  src TEXT NOT NULL,
  category TEXT NOT NULL, -- 'basic', 'premium', 'custom'
  section TEXT NOT NULL, -- 'feed', 'groups', 'properties', 'market', 'directory'
  community_slug TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[]
);

-- Create sticker packs table
CREATE TABLE IF NOT EXISTS public.sticker_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  community_slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create sticker pack items table (junction table between packs and stickers)
CREATE TABLE IF NOT EXISTS public.sticker_pack_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id UUID NOT NULL REFERENCES public.sticker_packs(id) ON DELETE CASCADE,
  sticker_id UUID NOT NULL REFERENCES public.stickers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pack_id, sticker_id)
);

-- Add RLS policies for stickers table
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

-- Public can view approved stickers
CREATE POLICY "Public can view approved stickers" 
ON public.stickers FOR SELECT 
USING (is_approved = TRUE);

-- Users can manage their own submitted stickers
CREATE POLICY "Users can manage their own stickers" 
ON public.stickers FOR ALL 
USING (auth.uid() = submitted_by);

-- Community admins can manage all stickers within their community
CREATE POLICY "Community admins can manage all stickers" 
ON public.stickers FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'community admin'
    AND EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = profiles.community_id
      AND communities.slug = community_slug
    )
  )
);

-- Add RLS policies for sticker_packs table
ALTER TABLE public.sticker_packs ENABLE ROW LEVEL SECURITY;

-- Public can view all sticker packs
CREATE POLICY "Public can view sticker packs" 
ON public.sticker_packs FOR SELECT 
USING (TRUE);

-- Community admins can manage sticker packs within their community
CREATE POLICY "Community admins can manage sticker packs" 
ON public.sticker_packs FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'community admin'
    AND EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = profiles.community_id
      AND communities.slug = community_slug
    )
  )
);

-- Add RLS policies for sticker_pack_items table
ALTER TABLE public.sticker_pack_items ENABLE ROW LEVEL SECURITY;

-- Public can view all sticker pack items
CREATE POLICY "Public can view sticker pack items" 
ON public.sticker_pack_items FOR SELECT 
USING (TRUE);

-- Community admins can manage sticker pack items
CREATE POLICY "Community admins can manage sticker pack items" 
ON public.sticker_pack_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.sticker_packs
    WHERE sticker_packs.id = pack_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'community admin'
      AND EXISTS (
        SELECT 1 FROM public.communities
        WHERE communities.id = profiles.community_id
        AND communities.slug = sticker_packs.community_slug
      )
    )
  )
); 