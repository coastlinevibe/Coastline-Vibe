'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StickerClient, StickerPack, StickerSection } from '../sticker-client';
import { useToast } from '@/components/ui/use-toast';
import FormSelect from './FormSelect';

interface StickerPacksProps {
  communityId: string;
  initialPacks?: StickerPack[];
}

export default function StickerPacks({
  communityId,
  initialPacks,
}: StickerPacksProps) {
  const [packs, setPacks] = useState<StickerPack[]>(initialPacks || []);
  const [isLoading, setIsLoading] = useState(!initialPacks);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<StickerSection | 'all'>('all');
  const { toast } = useToast();
  
  const stickerClient = new StickerClient();

  // Load packs when filter changes
  useEffect(() => {
    loadPacks();
  }, [selectedSection]);

  async function loadPacks() {
    setIsLoading(true);
    setError(null);
    try {
      // If 'all' is selected, don't filter by section
      const section = selectedSection === 'all' ? undefined : selectedSection as StickerSection;
      const fetchedPacks = await stickerClient.getStickerPacks(communityId, section);
      
      // For each pack, also load the stickers to get thumbnails
      const packsWithThumbnails = await Promise.all(
        fetchedPacks.map(async (pack) => {
          try {
            const stickers = await stickerClient.getPackStickers(pack.id);
            return {
              ...pack,
              thumbnailUrl: stickers.length > 0 ? stickerClient.getStickerUrl(stickers[0].src) : null
            };
          } catch (e) {
            return {
              ...pack,
              thumbnailUrl: null
            };
          }
        })
      );
      
      setPacks(packsWithThumbnails);
    } catch (e: any) {
      setError(e.message || 'Failed to load sticker packs');
      toast({
        title: 'Error',
        description: 'Failed to load sticker packs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeletePack(packId: string) {
    try {
      const result = await stickerClient.deleteStickerPack(packId);
      if (result.success) {
        setPacks(packs.filter(p => p.id !== packId));
        toast({
          title: 'Success',
          description: 'Sticker pack deleted successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to delete sticker pack',
        variant: 'destructive',
      });
    }
  }

  // Section filter control
  const sectionFilter = (
    <div className="mb-4 w-48">
      <FormSelect
        name="filter-section"
        defaultValue="all"
        options={[
          { value: "all", label: "All Sections" },
          { value: "Feed", label: "Feed" },
          { value: "Properties", label: "Properties" },
          { value: "Market", label: "Market" },
          { value: "Directory", label: "Directory" },
          { value: "Groups", label: "Groups" }
        ]}
        onChange={(value) => setSelectedSection(value as StickerSection | 'all')}
      />
    </div>
  );

  if (isLoading) {
    return (
      <>
        {sectionFilter}
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="p-4 bg-gray-200 h-20" />
              <CardContent className="p-4 h-10 bg-gray-100" />
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {sectionFilter}
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <Button onClick={loadPacks} className="mt-2">Retry</Button>
        </div>
      </>
    );
  }

  if (packs.length === 0) {
    return (
      <>
        {sectionFilter}
        <div className="text-center py-8">
          <p className="text-muted-foreground">No sticker packs found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {selectedSection === 'all'
              ? 'Create a pack to organize your stickers'
              : `No sticker packs found for ${selectedSection} section`}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {sectionFilter}
      <div className="grid grid-cols-4 gap-4">
        {packs.map((pack) => (
          <Card key={pack.id} className="overflow-hidden">
            <div className="p-4 flex items-center justify-center bg-gray-50 h-32">
              {(pack as any).thumbnailUrl ? (
                <div className="w-20 h-20 relative">
                  <img
                    src={(pack as any).thumbnailUrl}
                    alt={`${pack.name} thumbnail`}
                    className="object-contain w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                  No stickers
                </div>
              )}
            </div>
            <CardHeader className="p-4 pt-2">
              <CardTitle className="text-lg">{pack.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {pack.description || `${pack.category} sticker pack`}
                {pack.section && ` (${pack.section})`}
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex justify-between">
                <Link href={`/community/${communityId}/admin/stickers/manage/${pack.id}`}>
                  <Button variant="outline" size="sm">Manage</Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-500"
                  onClick={() => handleDeletePack(pack.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
} 