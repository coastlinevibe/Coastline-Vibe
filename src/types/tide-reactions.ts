/**
 * Types for the ephemeral Tide Reactions system
 */

// Reaction types
export type TideReactionType = 'emoji' | 'animated' | 'static';

// A single reaction instance
export interface TideReaction {
  id: string;
  postId: string;
  userId: string;
  username: string;
  reactionCode: string;
  reactionType: TideReactionType;
  reactionUrl: string;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

// Definition of a reaction for the reaction pack
export interface TideReactionDefinition {
  code: string;
  name: string;
  type: TideReactionType;
  url: string;
}

// A collection of reactions
export interface TideReactionPack {
  id: string;
  name: string;
  reactions: TideReactionDefinition[];
}

// Coastal-themed reaction pack
export const COASTAL_REACTION_PACK: TideReactionPack = {
  id: 'coastal-pack',
  name: 'Coastal Vibes',
  reactions: [
    {
      code: 'wave',
      name: 'Making Waves',
      type: 'static',
      url: 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/wave.svg',
    },
    {
      code: 'beach-buddy',
      name: 'Beach Buddy',
      type: 'static',
      url: 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/beach-buddy.svg',
    },
    {
      code: 'lighthouse',
      name: 'Lighthouse',
      type: 'static',
      url: 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/lighthouse.svg',
    },
    {
      code: 'sunset',
      name: 'Sunset Vibes',
      type: 'static',
      url: 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/sunset.svg',
    },
    {
      code: 'sand-dollar',
      name: 'Sand Dollar',
      type: 'static',
      url: 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/sand-dollar.svg',
    },
  ],
};

// New Coastline reactions
export const COASTLINE_REACTION_PACK: TideReactionPack = {
  id: 'coastline-pack',
  name: 'Coastline Reactions',
  reactions: [
    {
      code: 'lol',
      name: 'LOL',
      type: 'static',
      url: 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/post%20reactions/lol.png',
    },
    {
      code: 'angry',
      name: 'Angry',
      type: 'static',
      url: 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/post%20reactions/angry.png',
    },
    {
      code: 'love',
      name: 'Love',
      type: 'static',
      url: 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/post%20reactions/love.png',
    },
    {
      code: 'like',
      name: 'Like',
      type: 'static',
      url: 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/post%20reactions/like.png',
    },
    {
      code: 'wow',
      name: 'Wow',
      type: 'static',
      url: 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/post%20reactions/wow.png',
    },
  ],
};

export interface TideReactionWithUser extends TideReaction {
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

// Client-side state types
export interface TideReactionState {
  reactions: Record<string, TideReactionWithUser[]>; // Keyed by post_id
  userReactions: Record<string, string[]>; // Keyed by post_id, values are reaction IDs
  isOnline: boolean;
  lastSyncTime: string | null;
} 