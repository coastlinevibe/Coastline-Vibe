'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { StickerSection } from '../sticker-client';

export default async function createStickerPack(
  name: string,
  communityId: string,
  category: string,
  description?: string,
  section?: StickerSection
) {
  try {
    // Initialize Supabase server client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Verify current user is a community admin
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'You must be logged in to create sticker packs' };
    }

    // Check if user is admin for this community
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, community_id')
      .eq('id', session.user.id)
      .single();

    if (!profileData || profileData.role !== 'community admin' || profileData.community_id !== communityId) {
      return { success: false, error: 'You must be a community admin to create sticker packs' };
    }

    // Create sticker pack record
    const { data: pack, error: insertError } = await supabase
      .from('sticker_packs')
      .insert({
        name,
        description,
        category,
        section,
        community_id: communityId,
        created_by: session.user.id
      })
      .select()
      .single();
    
    if (insertError) {
      return { success: false, error: `Database error: ${insertError.message}` };
    }

    // Revalidate the stickers page to show the new pack
    revalidatePath(`/community/${communityId}/admin/stickers`);
    
    return { success: true, packId: pack.id };
  } catch (error: any) {
    console.error('Error in createStickerPack server action:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred while creating the sticker pack' 
    };
  }
} 