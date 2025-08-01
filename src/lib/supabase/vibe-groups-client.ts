// Vibe Groups Client
import { Database } from '@/types/supabase';
import { createBrowserClient } from '@supabase/ssr';
import {
  CreateVibeGroupParams,
  MemberRole,
  MemberStatus,
  SendMessageParams,
  UpdateMemberParams,
  VibeGroup,
  VibeGroupMember,
  VibeGroupMessage,
  VibeGroupPin,
  VibeGroupWithDetails
} from '@/types/vibe-groups';
import { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';

export class VibeGroupsClient {
  private supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  private messageSubscriptions: Map<string, RealtimeChannel> = new Map();
  private groupSubscriptions: Map<string, RealtimeChannel> = new Map();

  // Groups CRUD Operations
  
  /**
   * Get all vibe groups for a community
   */
  async getGroups(communityId: string): Promise<{ data: VibeGroup[] | null; error: PostgrestError | null }> {
    return this.supabase
      .from('vibe_groups')
      .select(`
        *,
        captain:profiles!captain_id(id, username, avatar_url),
        member_count:vibe_groups_members(count)
      `)
      .eq('community_id', communityId)
      .eq('is_active', true);
  }

  /**
   * Get a single vibe group with details
   */
  async getGroupDetails(groupId: string): Promise<{ data: VibeGroupWithDetails | null; error: PostgrestError | null }> {
    const { data, error } = await this.supabase
      .from('vibe_groups')
      .select(`
        *,
        captain:profiles!captain_id(*),
        members:vibe_groups_members(
          *,
          user:profiles(*)
        ),
        pins:vibe_groups_pins(
          *,
          message:vibe_groups_messages(*),
          user:profiles!pinned_by(*)
        ),
        custom_emojis:vibe_groups_emoji(
          *,
          creator:profiles!created_by(*)
        ),
        upgrades:vibe_groups_upgrades(*)
      `)
      .eq('id', groupId)
      .eq('is_active', true)
      .single();
    
    return { data, error };
  }

  /**
   * Create a new vibe group
   */
  async createGroup(params: CreateVibeGroupParams): Promise<{ data: VibeGroup | null; error: PostgrestError | null }> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError || !userData.user) {
      return { data: null, error: { message: 'User not authenticated', details: '', hint: '', code: '403' } as PostgrestError };
    }

    // Create the group
    const { data, error } = await this.supabase
      .from('vibe_groups')
      .insert({
        name: params.name,
        description: params.description || null,
        visibility: params.visibility,
        captain_id: userData.user.id,
        community_id: params.community_id,
        icon_url: params.icon_url || null,
        upgrade_level: 0,
        is_active: true
      })
      .select()
      .single();

    if (error || !data) {
      return { data: null, error };
    }

    // Add creator as captain
    const { error: memberError } = await this.supabase
      .from('vibe_groups_members')
      .insert({
        group_id: data.id,
        user_id: userData.user.id,
        role: 'captain' as MemberRole,
        status: 'active' as MemberStatus
      });

    if (memberError) {
      // If member creation fails, return the error but don't delete the group
      return { data, error: memberError };
    }

    return { data, error: null };
  }
} 