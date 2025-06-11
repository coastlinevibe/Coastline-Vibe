// Feed Reactions Client

import { Database } from '@/types/supabase';
import { createBrowserClient } from '@supabase/ssr';
import { PostgrestError } from '@supabase/supabase-js';

export type ReactionType = 'emoji' | 'custom_emoji' | 'sticker' | 'temporary';

export interface FeedPostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  reaction_id: string;
  created_at: string;
  expires_at: string | null;
  
  // Joined fields
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export class FeedReactionsClient {
  private supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  /**
   * Get reactions for a post
   */
  async getReactions(postId: string): Promise<{ data: FeedPostReaction[] | null; error: PostgrestError | null }> {
    return this.supabase
      .from('feed_post_reactions')
      .select(`
        *,
        user:profiles(id, username, avatar_url)
      `)
      .eq('post_id', postId);
  }

  /**
   * Add a reaction to a post
   */
  async addReaction(
    postId: string, 
    reactionType: ReactionType, 
    reactionId: string,
    expiresAt?: string
  ): Promise<{ error: PostgrestError | null }> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError || !userData.user) {
      return { error: { message: 'User not authenticated', details: '', hint: '', code: '403' } as PostgrestError };
    }

    const { error } = await this.supabase
      .from('feed_post_reactions')
      .insert({
        post_id: postId,
        user_id: userData.user.id,
        reaction_type: reactionType,
        reaction_id: reactionId,
        expires_at: expiresAt || null
      });
    
    return { error };
  }

  /**
   * Remove a reaction from a post
   */
  async removeReaction(postId: string, reactionType: ReactionType, reactionId: string): Promise<{ error: PostgrestError | null }> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError || !userData.user) {
      return { error: { message: 'User not authenticated', details: '', hint: '', code: '403' } as PostgrestError };
    }

    const { error } = await this.supabase
      .from('feed_post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userData.user.id)
      .eq('reaction_type', reactionType)
      .eq('reaction_id', reactionId);
    
    return { error };
  }

  /**
   * Check if current user has reacted with a specific reaction
   */
  async hasReacted(postId: string, reactionType: ReactionType, reactionId: string): Promise<{ hasReacted: boolean; error: PostgrestError | null }> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError || !userData.user) {
      return { hasReacted: false, error: { message: 'User not authenticated', details: '', hint: '', code: '403' } as PostgrestError };
    }

    const { data, error } = await this.supabase
      .from('feed_post_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userData.user.id)
      .eq('reaction_type', reactionType)
      .eq('reaction_id', reactionId)
      .maybeSingle();
    
    return { hasReacted: !!data, error };
  }
} 