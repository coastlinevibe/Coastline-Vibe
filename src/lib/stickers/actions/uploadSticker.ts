'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { StickerSection } from '../sticker-client';
import { revalidatePath } from 'next/cache';

export default async function uploadSticker(
  file: File,
  label: string,
  communityId: string,
  category: string,
  section: StickerSection,
  tags: string[] = []
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
      return { success: false, error: 'You must be logged in to upload stickers' };
    }

    // Check if user is admin for this community
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, community_id')
      .eq('id', session.user.id)
      .single();

    if (!profileData || profileData.role !== 'community admin' || profileData.community_id !== communityId) {
      return { success: false, error: 'You must be a community admin to upload stickers' };
    }

    // Get community slug for the storage path
    const { data: communityData, error: communityError } = await supabase
      .from('communities')
      .select('slug')
      .eq('id', communityId)
      .single();

    if (communityError || !communityData) {
      return { 
        success: false, 
        error: `Community not found: ${communityError?.message || 'No data returned'}` 
      };
    }

    const communitySlug = communityData.slug;
    
    // Convert file from FormData to Buffer for storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Clean up filename
    const fileExt = file.name.split('.').pop() || 'png';
    const cleanName = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `${cleanName}.${fileExt}`;
    
    // Create path using the agreed structure: [communitySlug]/[category]/[section]/[filename].png
    const filePath = `${communitySlug}/${category}/${section.toLowerCase()}/${fileName}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('reactions')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      return { success: false, error: `Upload error: ${uploadError.message}` };
    }
    
    // Create sticker record
    const { data: sticker, error: insertError } = await supabase
      .from('stickers')
      .insert({
        label,
        src: filePath,
        category,
        section: section.toLowerCase(),
        community_id: communityId,
        is_approved: true,  // Auto-approve for admin uploads
        submitted_by: session.user.id,
        tags
      })
      .select()
      .single();
    
    if (insertError) {
      return { success: false, error: `Database error: ${insertError.message}` };
    }

    // Revalidate the stickers page to show the new sticker
    revalidatePath(`/community/${communityId}/admin/stickers`);
    
    return { success: true, sticker };
  } catch (error: any) {
    console.error('Error in uploadSticker server action:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred while uploading the sticker' 
    };
  }
} 