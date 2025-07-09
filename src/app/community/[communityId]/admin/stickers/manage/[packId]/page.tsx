'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StickerClient, StickerPack, Sticker } from '@/lib/stickers/sticker-client';
import StickerGrid from '@/lib/stickers/components/StickerGrid';
import StickerUploader from '@/lib/stickers/components/StickerUploader';
import FormSelect from '@/lib/stickers/components/FormSelect';
import { useToast } from '@/components/ui/use-toast';

export default function ManageStickerPackPage({ 
  params 
}: { 
  params: { communityId: string; packId: string } 
}) {
  const [pack, setPack] = useState<StickerPack | null>(null);
  const [packStickers, setPackStickers] = useState<Sticker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  });
  
  const { toast } = useToast();
  const router = useRouter();
  const stickerClient = new StickerClient();

  // Load pack and its stickers
  useEffect(() => {
    loadPackData();
  }, []);

  async function loadPackData() {
    setIsLoading(true);
    setError(null);
    try {
      // Get pack details
      const { data: packData, error: packError } = await fetch(
        `/api/sticker-packs/${params.packId}?communityId=${params.communityId}`
      ).then(res => res.json());

      if (packError || !packData) {
        throw new Error(packError?.message || 'Failed to load sticker pack');
      }

      setPack(packData);
      setFormData({
        name: packData.name,
        description: packData.description || '',
        category: packData.category
      });

      // Get stickers in this pack
      const stickers = await stickerClient.getPackStickers(params.packId);
      setPackStickers(stickers);
    } catch (e: any) {
      setError(e.message || 'An error occurred');
      toast({
        title: 'Error',
        description: e.message || 'Failed to load sticker pack data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdate() {
    try {
      // This would be a server action in a real implementation
      const response = await fetch(`/api/sticker-packs/${params.packId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          communityId: params.communityId
        }),
      });

      const { success, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to update pack');
      }
      
      // Update local state
      setPack({
        ...pack!,
        name: formData.name,
        description: formData.description,
        category: formData.category
      });
      
      setIsEditMode(false);
      
      toast({
        title: 'Success',
        description: 'Sticker pack updated successfully',
      });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to update sticker pack',
        variant: 'destructive',
      });
    }
  }

  async function handleRemoveSticker(sticker: Sticker) {
    try {
      const result = await stickerClient.removeStickerFromPack(sticker.id, params.packId);
      if (result.success) {
        setPackStickers(packStickers.filter(s => s.id !== sticker.id));
        toast({
          title: 'Success',
          description: 'Sticker removed from pack',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to remove sticker from pack',
        variant: 'destructive',
      });
    }
  }

  function handleNewStickerUploaded(sticker: Sticker | Sticker[]) {
    // Close uploader
    setShowUploader(false);
    
    // Add sticker(s) to the current pack stickers
    if (Array.isArray(sticker)) {
      setPackStickers([...packStickers, ...sticker]);
    } else {
      setPackStickers([...packStickers, sticker]);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-1/3 bg-gray-200 animate-pulse rounded mb-4"></div>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-1/4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-1/3 bg-gray-100 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-20 bg-gray-100 rounded"></div>
                <div className="h-40 bg-gray-100 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (error || !pack) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-red-500 mb-4">{error || 'Sticker pack not found'}</p>
        <Button onClick={() => router.push(`/community/${params.communityId}/admin/stickers`)}>
          Back to Stickers
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Sticker Pack</h1>
        <Button 
          onClick={() => router.push(`/community/${params.communityId}/admin/stickers`)}
          variant="outline"
        >
          Back to Stickers
        </Button>
        </div>
        
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pack Details</CardTitle>
              <Button 
                variant="outline" 
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? 'Cancel' : 'Edit'}
              </Button>
          </div>
          </CardHeader>
          <CardContent>
            {isEditMode ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Pack Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
          </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
            />
          </div>
          
                <div>
                  <Label htmlFor="category">Category</Label>
                  <FormSelect
                    id="category"
                    name="category"
                    defaultValue={formData.category}
                    onChange={(value: string) => setFormData({...formData, category: value})}
                    options={[
                      { value: "basic", label: "Basic" },
                      { value: "premium", label: "Premium" },
                      { value: "custom", label: "Custom" }
                    ]}
                      />
                    </div>
                
                <Button onClick={handleUpdate}>Save Changes</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Pack Name</h3>
                  <p>{pack.name}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p>{pack.description || 'No description'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Category</h3>
                  <p className="capitalize">{pack.category}</p>
                      </div>

                <div>
                  <h3 className="font-medium">Section</h3>
                  <p className="capitalize">{pack.section || 'All sections'}</p>
              </div>
            </div>
          )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Pack Stickers</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Stickers included in this pack
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowUploader(!showUploader)}
              >
                {showUploader ? 'Cancel' : 'Upload New Sticker'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showUploader && (
              <div className="mb-6">
                <StickerUploader 
                  communityId={params.communityId} 
                  packId={params.packId} 
                  section={pack.section as any}
                  category={pack.category}
                  onUploadComplete={handleNewStickerUploaded}
                  allowMultiple={true}
                />
            </div>
          )}
            
            {packStickers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No stickers in this pack</p>
                <p className="text-sm text-muted-foreground mt-2">Add stickers from the library below or upload a new one</p>
            </div>
          ) : (
              <div className="grid grid-cols-6 gap-4 mb-6">
                {packStickers.map((sticker) => (
                  <div 
                    key={sticker.id} 
                    className="flex flex-col items-center p-2 border rounded-md hover:border-primary transition-colors"
                  >
                    <div className="w-full aspect-square bg-gray-50 rounded-md flex items-center justify-center mb-2 overflow-hidden">
                      {sticker.src ? (
                        <img
                          src={stickerClient.getStickerUrl(sticker.src)}
                      alt={sticker.label} 
                      className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
                          }}
                    />
                      ) : (
                        <div className="text-3xl text-gray-400">🖼️</div>
                      )}
                  </div>
                    <span className="text-sm font-medium truncate w-full text-center">
                      {sticker.label}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 text-red-500 hover:bg-red-50"
                      onClick={() => handleRemoveSticker(sticker)}
                    >
                      Remove
                    </Button>
                </div>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 