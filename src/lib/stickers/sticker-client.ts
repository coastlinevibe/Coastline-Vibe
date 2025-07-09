import { createBrowserClient } from '@supabase/ssr';

export interface Sticker {
  id: string;
  label: string;
  src: string;
  category: string;
  section: string;
  community_id: string;
  is_approved: boolean;
  tags?: string[];
  created_at: string;
}

export interface StickerPack {
  id: string;
  name: string;
  description?: string;
  category: string;
  section?: string;
  community_id: string;
  created_at: string;
}

export type StickerSection = 'Feed' | 'Properties' | 'Market' | 'Directory' | 'Groups';

export class StickerClient {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get public bucket URL for constructing full sticker URLs
  private getBucketUrl(): string {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/reactions`;
  }

  // Convert relative path to full URL
  public getStickerUrl(relativePath: string): string {
    return `${this.getBucketUrl()}/${relativePath}`;
  }

  // Get all stickers for a community
  async getStickers(
    communityId: string, 
    options?: { 
      section?: StickerSection,
      category?: string,
      search?: string
    }
  ): Promise<Sticker[]> {
    let query = this.supabase
      .from('stickers')
      .select('*')
      .eq('community_id', communityId)
      .eq('is_approved', true);
    
    if (options?.section) {
      query = query.eq('section', options.section);
    }
    
    if (options?.category) {
      query = query.eq('category', options.category);
    }
    
    if (options?.search) {
      query = query.or(`label.ilike.%${options.search}%,tags.cs.{${options.search}}`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching stickers:', error);
      return [];
    }
    
    return data || [];
  }

  // Get all sticker packs for a community
  async getStickerPacks(communityId: string, section?: StickerSection): Promise<StickerPack[]> {
    let query = this.supabase
      .from('sticker_packs')
      .select('*')
      .eq('community_id', communityId);
    
    // If section is provided, filter by it
    if (section) {
      query = query.eq('section', section);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching sticker packs:', error);
      return [];
    }
    
    return data || [];
  }

  // Get stickers for a specific pack
  async getPackStickers(packId: string): Promise<Sticker[]> {
    const { data, error } = await this.supabase
      .from('sticker_pack_items')
      .select('stickers(*)')
      .eq('pack_id', packId);
    
    if (error) {
      console.error('Error fetching pack stickers:', error);
      return [];
    }
    
    // @ts-ignore - we know this shape exists
    return data.map(item => item.stickers) || [];
  }

  // Upload a sticker
  async uploadSticker(
    file: File,
    label: string,
    communityId: string,
    category: string,
    section: StickerSection,
    tags: string[] = []
  ): Promise<{ success: boolean; sticker?: Sticker; error?: string }> {
    try {
      // Get community slug for the storage path
      const { data: communityData, error: communityError } = await this.supabase
        .from('communities')
        .select('slug')
        .eq('id', communityId)
        .single();

      if (communityError || !communityData) {
        return { success: false, error: `Community not found: ${communityError?.message || 'No data returned'}` };
      }

      const communitySlug = communityData.slug;
      
      // Clean up filename
      const fileExt = file.name.split('.').pop() || 'png';
      const cleanName = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fileName = `${cleanName}.${fileExt}`;
      
      // Create path using the agreed structure: [communitySlug]/[category]/[section]/[filename].png
      const filePath = `${communitySlug}/${category}/${section}/${fileName}`;
      
      // Upload the file
      const { error: uploadError } = await this.supabase.storage
        .from('reactions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        return { success: false, error: `Upload error: ${uploadError.message}` };
      }
      
      // Create sticker record
      const { data: sticker, error: insertError } = await this.supabase
        .from('stickers')
        .insert({
          label,
          src: filePath,
          category,
          section,
          community_id: communityId,
          is_approved: true,  // Auto-approve for admin uploads
          tags
        })
        .select()
        .single();
      
      if (insertError) {
        return { success: false, error: `Database error: ${insertError.message}` };
      }
      
      return { success: true, sticker };
    } catch (error: any) {
      console.error('Error uploading sticker:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }

  // Create a new sticker pack
  async createStickerPack(
    name: string,
    communityId: string,
    category: string,
    description?: string,
    section?: StickerSection,
  ): Promise<{ success: boolean; packId?: string; error?: string }> {
    try {
      const { data: pack, error: packError } = await this.supabase
        .from('sticker_packs')
        .insert({
          name,
          description,
          category,
          section,
          community_id: communityId
        })
        .select()
        .single();
      
      if (packError) {
        return { success: false, error: `Error creating pack: ${packError.message}` };
      }
      
      return { success: true, packId: pack.id };
    } catch (error: any) {
      console.error('Error creating sticker pack:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }

  // Add stickers to a pack
  async addStickersToPack(
    packId: string, 
    stickerIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const items = stickerIds.map(stickerId => ({
        pack_id: packId,
        sticker_id: stickerId
      }));
      
      const { error } = await this.supabase
        .from('sticker_pack_items')
        .insert(items);
      
      if (error) {
        return { success: false, error: `Error adding stickers: ${error.message}` };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error adding stickers to pack:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }

  // Remove sticker from a pack
  async removeStickerFromPack(
    packId: string, 
    stickerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('sticker_pack_items')
        .delete()
        .eq('pack_id', packId)
        .eq('sticker_id', stickerId);
      
      if (error) {
        return { success: false, error: `Error removing sticker: ${error.message}` };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error removing sticker from pack:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }

  // Delete a sticker
  async deleteSticker(stickerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the sticker to find its storage path
      const { data: sticker, error: getError } = await this.supabase
        .from('stickers')
        .select('src')
        .eq('id', stickerId)
        .single();
        
      if (getError) {
        return { success: false, error: `Error fetching sticker: ${getError.message}` };
      }
      
      if (!sticker) {
        return { success: false, error: 'Sticker not found' };
      }
      
      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from('reactions')
        .remove([sticker.src]);
        
      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage delete fails
      }
      
      // Delete from database
      const { error: dbError } = await this.supabase
        .from('stickers')
        .delete()
        .eq('id', stickerId);
        
      if (dbError) {
        return { success: false, error: `Error deleting sticker: ${dbError.message}` };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting sticker:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }

  // Delete a sticker pack
  async deleteStickerPack(packId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('sticker_packs')
        .delete()
        .eq('id', packId);
        
      if (error) {
        return { success: false, error: `Error deleting sticker pack: ${error.message}` };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting sticker pack:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }
} 