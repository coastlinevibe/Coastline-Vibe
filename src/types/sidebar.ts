export interface LeftSidebarProps {
  communityId: string;
  onHashtagSelect?: (hashtag: string) => void;
  onOpenCreator?: (type: 'poll' | 'ask' | 'announce' | 'event' | 'general' | 'group') => void;
}

export interface RightSidebarProps {
  communityId: string;
}

// Group types
export interface UserGroup {
  id: string;
  name: string;
  iconUrl?: string;
  visibility: 'public' | 'private' | 'secret';
  role: 'captain' | 'lieutenant' | 'crew';
  unreadCount: number;
}

// Notification types
export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'mention' | 'follow' | 'event' | 'system';
  actor_id: string;
  recipient_id: string;
  target_entity_id: string;
  content?: string;
  created_at: string;
  read_at?: string;
  actor?: {
    username: string;
    avatar_url?: string;
  };
  target_post?: {
    title?: string;
    content?: string;
  };
}

// Event types
export interface Event {
  id: string;
  title: string;
  description?: string;
  event_start_time: string;
  event_end_time?: string;
  location?: string;
  location_lat?: number;
  location_lng?: number;
  is_virtual: boolean;
  virtual_link?: string;
  event_rsvp_users?: string[];
}

// Community stats
export interface CommunityStats {
  postsThisWeek: number;
  activeGroups: number;
  newMembersToday: number;
}

// User profile suggestion
export interface SuggestedUser {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
}

// Group suggestion
export interface SuggestedGroup {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  visibility: 'public' | 'private' | 'secret';
  member_count: number;
}

// Sponsored content
export interface SponsoredContent {
  id: string;
  title: string;
  image?: string;
  description: string;
  type: 'business' | 'property' | 'marketplace' | 'event';
}

// Nearby activity
export interface NearbyActivity {
  id: string;
  title?: string;
  type: string;
  locationName?: string;
  distance: number;
  lat: number;
  lng: number;
} 