"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StickerSection } from '@/lib/stickers/sticker-client';
import { handleUploadSticker, handleCreateStickerPack } from '@/lib/stickers/actions/formActions';
import StickerGrid from '@/lib/stickers/components/StickerGrid';
import StickerPacks from '@/lib/stickers/components/StickerPacks';
import FormSelect from '@/lib/stickers/components/FormSelect';

export default function StickersAdminPage({ params }: { params: { communityId: string } }) {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Sticker Management</h1>
      
      <Tabs defaultValue="library" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="library">Sticker Library</TabsTrigger>
          <TabsTrigger value="packs">Sticker Packs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="library">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Sticker</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add new stickers to your community's library
                </p>
              </CardHeader>
              <CardContent>
                <StickerUploadForm communityId={params.communityId} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Sticker Library</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage all stickers available in your community
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-[120px]">
                    <FormSelect 
                      name="filter-category"
                      defaultValue="all"
                      options={[
                        { value: "all", label: "All Categories" },
                        { value: "basic", label: "Basic" },
                        { value: "premium", label: "Premium" },
                        { value: "custom", label: "Custom" }
                      ]}
                    />
                  </div>
                  <div className="w-[120px]">
                    <FormSelect 
                      name="filter-section"
                      defaultValue="all-sections"
                      options={[
                        { value: "all-sections", label: "All Sections" },
                        { value: "Feed", label: "Feed" },
                        { value: "Properties", label: "Properties" },
                        { value: "Market", label: "Market" },
                        { value: "Directory", label: "Directory" },
                        { value: "Groups", label: "Groups" }
                      ]}
                    />
                  </div>
                  <Input 
                    type="search" 
                    placeholder="Search stickers..." 
                    className="w-[200px]" 
                  />
                </div>
              </CardHeader>
              <CardContent>
                <StickerGrid communityId={params.communityId} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="packs">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Sticker Pack</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Group stickers into packs for easy access
                </p>
              </CardHeader>
              <CardContent>
                <StickerPackForm communityId={params.communityId} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Manage Packs</CardTitle>
                <p className="text-sm text-muted-foreground">
                  View and manage your sticker packs
                </p>
              </CardHeader>
              <CardContent>
                <StickerPacks communityId={params.communityId} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Sticker Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure how stickers work in your community
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="default-pack">Default Sticker Pack</Label>
                  <FormSelect 
                    name="default-pack"
                    id="default-pack"
                    defaultValue="basic"
                    options={[
                      { value: "basic", label: "Basic Reactions" },
                      { value: "premium", label: "Premium Set" },
                      { value: "custom", label: "Community Custom" }
                    ]}
                  />
                </div>
                
                <div>
                  <Label htmlFor="max-stickers">Maximum Stickers Per Post</Label>
                  <Input type="number" id="max-stickers" defaultValue="5" />
                </div>
                
                <div className="pt-4">
                  <Button>Save Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sticker Upload Form Component
function StickerUploadForm({ communityId }: { communityId: string }) {
  return (
    <form action={handleUploadSticker}>
      <input type="hidden" name="communityId" value={communityId} />
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="file">Sticker Image</Label>
          <Input id="file" name="file" type="file" accept="image/*" required />
          <p className="text-sm text-muted-foreground">PNG or JPG (max 1MB)</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="label">Sticker Name</Label>
          <Input id="label" name="label" placeholder="E.g. Happy Face" required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category-select">Category</Label>
          <FormSelect
            name="category"
            id="category-select"
            defaultValue="basic"
            options={[
              { value: "basic", label: "Basic" },
              { value: "premium", label: "Premium" },
              { value: "custom", label: "Custom" }
            ]}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="section-select">Section</Label>
          <FormSelect
            name="section"
            id="section-select"
            defaultValue="Feed"
            options={[
              { value: "Feed", label: "Feed" },
              { value: "Properties", label: "Properties" },
              { value: "Market", label: "Market" },
              { value: "Directory", label: "Directory" },
              { value: "Groups", label: "Groups" }
            ]}
          />
        </div>
        
        <div className="col-span-2 space-y-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input id="tags" name="tags" placeholder="happy, reaction, emoji" />
        </div>
        
        <div className="col-span-2">
          <Button type="submit" className="w-full">Upload Sticker</Button>
        </div>
      </div>
    </form>
  );
}

// Sticker Pack Form Component
function StickerPackForm({ communityId }: { communityId: string }) {
  return (
    <form action={handleCreateStickerPack}>
      <input type="hidden" name="communityId" value={communityId} />
      
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="name">Pack Name</Label>
          <Input id="name" name="name" placeholder="E.g. Basic Reactions" required />
        </div>
        
        <div className="col-span-2 space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description"
            name="description"
            placeholder="Describe what this pack contains" 
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="pack-category">Category</Label>
          <FormSelect
            name="category"
            id="pack-category"
            defaultValue="basic"
            options={[
              { value: "basic", label: "Basic" },
              { value: "premium", label: "Premium" },
              { value: "custom", label: "Custom" }
            ]}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="pack-section">Section</Label>
          <FormSelect
            name="section"
            id="pack-section"
            defaultValue="Feed"
            options={[
              { value: "Feed", label: "Feed" },
              { value: "Properties", label: "Properties" },
              { value: "Market", label: "Market" },
              { value: "Directory", label: "Directory" },
              { value: "Groups", label: "Groups" }
            ]}
          />
        </div>
        
        <div className="flex items-end">
          <Button type="submit" className="w-full">Create Pack</Button>
        </div>
      </div>
    </form>
  );
} 