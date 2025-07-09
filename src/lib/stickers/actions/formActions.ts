'use client';

import { StickerSection } from '../sticker-client';
import uploadSticker from './uploadSticker';
import createStickerPack from './createStickerPack';

/**
 * Client action for uploading a sticker (wrapper for the server action)
 */
export async function handleUploadSticker(formData: FormData): Promise<void> {
  const file = formData.get('file') as File;
  const label = formData.get('label') as string;
  const category = formData.get('category') as string;
  const section = formData.get('section') as StickerSection;
  const tags = formData.get('tags') as string;
  
  const communityId = formData.get('communityId') as string;
  
  const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
  
  await uploadSticker(file, label, communityId, category, section, tagArray);
  // Return void to satisfy the form action signature requirement
}

/**
 * Client action for creating a sticker pack (wrapper for the server action)
 */
export async function handleCreateStickerPack(formData: FormData): Promise<void> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const section = formData.get('section') as StickerSection;
  const communityId = formData.get('communityId') as string;
  
  await createStickerPack(name, communityId, category, description, section);
  // Return void to satisfy the form action signature requirement
} 