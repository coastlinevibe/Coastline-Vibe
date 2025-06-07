import { Database } from './supabase';
import { Profile } from './user';

// Visibility types
export type VibeGroupVisibility = 'public' | 'private' | 'secret';

// Role types
export type MemberRole = 'captain' | 'lieutenant' | 'crew';
export type MemberStatus = 'active' | 'left' | 'removed' | 'banned';

// Message types
export type MessageType = 'text' | 'media' | 'voice' | 'system';
export type MediaType = 'image' | 'video' | 'document' | 'audio';
export type ReactionType = 'emoji' | 'custom_emoji' | 'sticker' | 'temporary';

// Main Vibe Group type
export type VibeGroup = {
  id: string;
  name: string;
  description: string | null;
  visibility: VibeGroupVisibility;
  captain_id: string;
  community_id: string;
  icon_url: string | null;
  upgrade_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined fields (not in DB)
  captain?: Profile;
  member_count?: { count: number }[];
  current_user_role?: MemberRole;
};

// Extended group type with additional details
export type VibeGroupWithDetails = VibeGroup & {
  members?: VibeGroupMember[];
  pins?: VibeGroupPin[];
  custom_emojis?: VibeGroupEmoji[];
  upgrades?: VibeGroupUpgrade[];
};

// Group member
export type VibeGroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  last_read_at: string;
  status: MemberStatus;
  nickname: string | null;
  
  // Joined fields
  user?: Profile;
};

// Group message
export type VibeGroupMessage = {
  id: string;
  group_id: string;
  sender_id: string;
  message_type: MessageType;
  content: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  sender?: Profile;
  media?: VibeGroupMedia[];
  voice_note?: VibeGroupVoiceNote;
  reactions?: VibeGroupReaction[];
  reply_to?: VibeGroupMessage;
};

// Media attachment
export type VibeGroupMedia = {
  id: string;
  message_id: string;
  media_type: MediaType;
  file_url: string;
  thumbnail_url: string | null;
  file_name: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  created_at: string;
};

// Voice note
export type VibeGroupVoiceNote = {
  id: string;
  message_id: string;
  audio_url: string;
  duration: number | null;
  transcription: string | null;
  created_at: string;
};

// Pinned message
export type VibeGroupPin = {
  id: string;
  group_id: string;
  message_id: string;
  pinned_by: string;
  pinned_at: string;
  
  // Joined fields
  message?: VibeGroupMessage;
  user?: Profile;
};

// Custom emoji
export type VibeGroupEmoji = {
  id: string;
  group_id: string;
  emoji_code: string;
  emoji_url: string;
  created_by: string;
  created_at: string;
  
  // Joined fields
  creator?: Profile;
};

// Sticker pack
export type VibeGroupStickerPack = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_by: string;
  is_public: boolean;
  created_at: string;
  
  // Joined fields
  creator?: Profile;
  stickers?: VibeGroupSticker[];
};

// Sticker
export type VibeGroupSticker = {
  id: string;
  pack_id: string;
  sticker_url: string;
  sticker_code: string;
  created_at: string;
};

// Sticker pack access
export type VibeGroupStickerAccess = {
  id: string;
  group_id: string;
  pack_id: string;
  added_by: string;
  added_at: string;
  
  // Joined fields
  pack?: VibeGroupStickerPack;
  user?: Profile;
};

// Message reaction
export type VibeGroupReaction = {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: ReactionType;
  reaction_id: string;
  created_at: string;
  expires_at: string | null;
  
  // Joined fields
  user?: Profile;
};

// Group upgrade
export type VibeGroupUpgrade = {
  id: string;
  group_id: string;
  upgrade_type: string;
  purchased_by: string;
  purchased_at: string;
  expires_at: string | null;
  is_active: boolean;
  
  // Joined fields
  purchaser?: Profile;
};

// AI summary
export type VibeGroupAISummary = {
  id: string;
  group_id: string;
  summary_text: string;
  start_timestamp: string;
  end_timestamp: string;
  generated_at: string;
  voice_url: string | null;
};

// Create group parameters
export type CreateVibeGroupParams = {
  name: string;
  description?: string;
  visibility: VibeGroupVisibility;
  community_id: string;
  icon_url?: string;
};

// Send message parameters
export type SendMessageParams = {
  group_id: string;
  content: string;
  message_type: MessageType;
  reply_to_id?: string;
  media_files?: File[];
  voice_note?: {
    audio_blob: Blob;
    duration: number;
    transcription?: string;
  };
};

// Generate AI summary parameters
export type GenerateAISummaryParams = {
  group_id: string;
  start_time: string;
  end_time: string;
};

// Join group parameters
export type JoinGroupParams = {
  group_id: string;
  user_id: string;
  role?: MemberRole;
};

// Update member parameters
export type UpdateMemberParams = {
  group_id: string;
  user_id: string;
  role?: MemberRole;
  status?: MemberStatus;
  nickname?: string;
};

// Database types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']; 