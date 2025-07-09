'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sticker, StickerClient, StickerSection } from '../sticker-client';
import { useToast } from '@/components/ui/use-toast';

interface StickerGridProps {
  communityId: string;
  initialStickers?: Sticker[];
  onSelect?: (sticker: Sticker) => void;
  selectable?: boolean;
  section?: StickerSection;
  category?: string;
}

export default function StickerGrid({
  communityId,
  initialStickers,
  onSelect,
  selectable = false,
  section,
  category,
}: StickerGridProps) {
  const [stickers, setStickers] = useState<Sticker[]>(initialStickers || []);
  const [selectedStickers, setSelectedStickers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(!initialStickers);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const stickerClient = new StickerClient();

  // Load stickers if not provided initially
  useEffect(() => {
    if (!initialStickers) {
      loadStickers();
    }
  }, []);

  async function loadStickers() {
    setIsLoading(true);
    setError(null);
    try {
      const options: { section?: StickerSection; category?: string } = {};
      if (section) options.section = section;
      if (category) options.category = category;
      
      const fetchedStickers = await stickerClient.getStickers(communityId, options);
      setStickers(fetchedStickers);
    } catch (e: any) {
      setError(e.message || 'Failed to load stickers');
      toast({
        title: 'Error',
        description: 'Failed to load stickers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(sticker: Sticker) {
    try {
      const result = await stickerClient.deleteSticker(sticker.id);
      if (result.success) {
        setStickers(stickers.filter(s => s.id !== sticker.id));
        toast({
          title: 'Success',
          description: 'Sticker deleted successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to delete sticker',
        variant: 'destructive',
      });
    }
  }

  function handleSelect(sticker: Sticker) {
    if (!selectable) return;
    
    if (onSelect) {
      onSelect(sticker);
    } else {
      const newSelectedStickers = new Set(selectedStickers);
      if (selectedStickers.has(sticker.id)) {
        newSelectedStickers.delete(sticker.id);
      } else {
        newSelectedStickers.add(sticker.id);
      }
      setSelectedStickers(newSelectedStickers);
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="w-full aspect-square bg-gray-200 rounded-md animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Button onClick={loadStickers} className="mt-2">Retry</Button>
      </div>
    );
  }

  if (stickers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No stickers found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-6 gap-4">
      {stickers.map((sticker) => (
        <div 
          key={sticker.id} 
          className={`flex flex-col items-center p-2 border rounded-md ${
            selectedStickers.has(sticker.id) ? 'border-blue-500 bg-blue-50' : ''
          } ${selectable ? 'cursor-pointer' : ''}`}
          onClick={() => handleSelect(sticker)}
        >
          <div className="w-full aspect-square bg-gray-100 rounded-md flex items-center justify-center mb-2 overflow-hidden">
            {sticker.src ? (
              <Image
                src={stickerClient.getStickerUrl(sticker.src)}
                alt={sticker.label}
                width={80}
                height={80}
                className="object-contain"
              />
            ) : (
              <div className="text-3xl">🖼️</div>
            )}
          </div>
          <span className="text-sm font-medium truncate w-full text-center">
            {sticker.label}
          </span>
          
          {!selectable && (
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  // Edit functionality would go here
                }}
              >
                ✏️
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 w-7 p-0" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(sticker);
                }}
              >
                🗑️
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 