-- Vibe Groups Database Migration

-- Main table for Vibe Groups
CREATE TABLE IF NOT EXISTS public.vibe_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private', 'secret')),
  captain_id UUID NOT NULL REFERENCES public.profiles(id),
  community_id UUID NOT NULL REFERENCES public.communities(id),
  icon_url TEXT,
  upgrade_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Group members table
CREATE TABLE IF NOT EXISTS public.vibe_groups_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.vibe_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL CHECK (role IN ('captain', 'lieutenant', 'crew')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('active', 'left', 'removed', 'banned')),
  nickname TEXT,
  UNIQUE (group_id, user_id)
);

-- Group messages table
CREATE TABLE IF NOT EXISTS public.vibe_groups_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.vibe_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'media', 'voice', 'system')),
  content TEXT,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  reply_to_id UUID REFERENCES public.vibe_groups_messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Media attachments table
CREATE TABLE IF NOT EXISTS public.vibe_groups_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.vibe_groups_messages(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'document', 'audio')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Voice notes table
CREATE TABLE IF NOT EXISTS public.vibe_groups_voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.vibe_groups_messages(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration INTEGER,
  transcription TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pinned messages table
CREATE TABLE IF NOT EXISTS public.vibe_groups_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.vibe_groups(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.vibe_groups_messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES public.profiles(id),
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (group_id, message_id)
);

-- Custom emoji table
CREATE TABLE IF NOT EXISTS public.vibe_groups_emoji (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.vibe_groups(id) ON DELETE CASCADE,
  emoji_code TEXT NOT NULL,
  emoji_url TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (group_id, emoji_code)
);

-- Sticker packs table
CREATE TABLE IF NOT EXISTS public.vibe_groups_sticker_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Stickers table
CREATE TABLE IF NOT EXISTS public.vibe_groups_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.vibe_groups_sticker_packs(id) ON DELETE CASCADE,
  sticker_url TEXT NOT NULL,
  sticker_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (pack_id, sticker_code)
);

-- Group sticker pack access table
CREATE TABLE IF NOT EXISTS public.vibe_groups_sticker_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.vibe_groups(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES public.vibe_groups_sticker_packs(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES public.profiles(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (group_id, pack_id)
);

-- Message reactions table
CREATE TABLE IF NOT EXISTS public.vibe_groups_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.vibe_groups_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('emoji', 'custom_emoji', 'sticker', 'temporary')),
  reaction_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (message_id, user_id, reaction_type, reaction_id)
);

-- Group upgrades table
CREATE TABLE IF NOT EXISTS public.vibe_groups_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.vibe_groups(id) ON DELETE CASCADE,
  upgrade_type TEXT NOT NULL,
  purchased_by UUID NOT NULL REFERENCES public.profiles(id),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- AI summaries table
CREATE TABLE IF NOT EXISTS public.vibe_groups_ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.vibe_groups(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  start_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  end_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  voice_url TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vibe_groups_community_id ON public.vibe_groups(community_id);
CREATE INDEX IF NOT EXISTS idx_vibe_groups_members_group_id ON public.vibe_groups_members(group_id);
CREATE INDEX IF NOT EXISTS idx_vibe_groups_members_user_id ON public.vibe_groups_members(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_groups_messages_group_id ON public.vibe_groups_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_vibe_groups_messages_sender_id ON public.vibe_groups_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_vibe_groups_messages_created_at ON public.vibe_groups_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_vibe_groups_media_message_id ON public.vibe_groups_media(message_id);
CREATE INDEX IF NOT EXISTS idx_vibe_groups_pins_group_id ON public.vibe_groups_pins(group_id);
CREATE INDEX IF NOT EXISTS idx_vibe_groups_reactions_message_id ON public.vibe_groups_reactions(message_id);

-- RLS Policies

-- Enable RLS
ALTER TABLE public.vibe_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_groups_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_groups_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_groups_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_groups_voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_groups_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_groups_emoji ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_groups_sticker_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_groups_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_groups_sticker_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_groups_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_groups_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_groups_ai_summaries ENABLE ROW LEVEL SECURITY;

-- Vibe Groups policies
CREATE POLICY "Public groups are viewable by everyone" ON public.vibe_groups
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Private groups are viewable by members" ON public.vibe_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vibe_groups_members
      WHERE group_id = public.vibe_groups.id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Groups can be created by authenticated users" ON public.vibe_groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Groups can be updated by captains" ON public.vibe_groups
  FOR UPDATE USING (captain_id = auth.uid());

-- Members policies
CREATE POLICY "Members can be viewed by group members" ON public.vibe_groups_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vibe_groups_members
      WHERE group_id = public.vibe_groups_members.group_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Members can be added by captains and lieutenants" ON public.vibe_groups_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vibe_groups_members
      WHERE group_id = public.vibe_groups_members.group_id
      AND user_id = auth.uid()
      AND role IN ('captain', 'lieutenant')
      AND status = 'active'
    )
  );

-- Messages policies
CREATE POLICY "Messages can be viewed by group members" ON public.vibe_groups_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vibe_groups_members
      WHERE group_id = public.vibe_groups_messages.group_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Messages can be created by group members" ON public.vibe_groups_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vibe_groups_members
      WHERE group_id = public.vibe_groups_messages.group_id
      AND user_id = auth.uid()
      AND status = 'active'
    ) AND sender_id = auth.uid()
  );

CREATE POLICY "Messages can be updated by their authors" ON public.vibe_groups_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Media policies
CREATE POLICY "Media can be viewed by group members" ON public.vibe_groups_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vibe_groups_messages m
      JOIN public.vibe_groups_members mem ON m.group_id = mem.group_id
      WHERE m.id = public.vibe_groups_media.message_id
      AND mem.user_id = auth.uid()
      AND mem.status = 'active'
    )
  );

-- Triggers for updated_at

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vibe_groups
CREATE TRIGGER update_vibe_groups_updated_at
BEFORE UPDATE ON public.vibe_groups
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger for vibe_groups_messages
CREATE TRIGGER update_vibe_groups_messages_updated_at
BEFORE UPDATE ON public.vibe_groups_messages
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add notifications integration
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS vibe_group_id UUID REFERENCES public.vibe_groups(id); 