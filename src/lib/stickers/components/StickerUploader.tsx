'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { StickerSection, StickerClient } from '../sticker-client';
import { useToast } from '@/components/ui/use-toast';
import FormSelect from './FormSelect';

interface StickerUploaderProps {
  communityId: string;
  section?: StickerSection;
  category?: string;
  packId?: string;
  onUploadComplete?: (stickers: any | any[]) => void;
  compact?: boolean;
  allowMultiple?: boolean;
}

interface StickerUploadItem {
  file: File;
  preview: string;
  label: string;
  uploading: boolean;
  error?: string;
}

export default function StickerUploader({
  communityId,
  section: defaultSection,
  category: defaultCategory = 'basic',
  packId,
  onUploadComplete,
  compact = false,
  allowMultiple = false
}: StickerUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [section, setSection] = useState<StickerSection>(defaultSection || 'Feed');
  const [category, setCategory] = useState(defaultCategory);
  const { toast } = useToast();
  const stickerClient = new StickerClient();
  
  // For single upload mode
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  
  // For multiple upload mode
  const [uploadItems, setUploadItems] = useState<StickerUploadItem[]>([]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    
    if (allowMultiple) {
      // Handle multiple files
      const newItems: StickerUploadItem[] = [];
      
      Array.from(event.target.files).forEach(file => {
        // Validate file size (1MB max)
        if (file.size > 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 1MB limit`,
            variant: "destructive"
          });
          return;
        }
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          
          // Generate a label from filename
          const baseName = file.name.split('.')[0].replace(/[-_]/g, ' ');
          const label = baseName.charAt(0).toUpperCase() + baseName.slice(1);
          
          // Add new upload item
          setUploadItems(prev => [
            ...prev,
            { file, preview, label, uploading: false }
          ]);
        };
        reader.readAsDataURL(file);
      });
      
      // Clear input value so the same file can be selected again
      event.target.value = '';
    } else {
      // Handle single file (original behavior)
      const selectedFile = event.target.files[0];
      
      // Validate file size (1MB max)
      if (selectedFile.size > 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 1MB",
          variant: "destructive"
        });
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
      
      setFile(selectedFile);
      
      // Suggest a label based on filename
      const baseName = selectedFile.name.split('.')[0].replace(/[-_]/g, ' ');
      setLabel(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
  };

  const handleLabelChange = (index: number, newLabel: string) => {
    setUploadItems(items => 
      items.map((item, i) => 
        i === index ? { ...item, label: newLabel } : item
      )
    );
  };

  const handleRemoveItem = (index: number) => {
    setUploadItems(items => items.filter((_, i) => i !== index));
  };

  const handleUploadMultiple = async () => {
    if (uploadItems.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image to upload",
        variant: "destructive"
      });
      return;
    }
    
    // Mark all as uploading
    setIsUploading(true);
    
    // Upload each file in sequence
    const uploadedStickers = [];
    const updatedItems = [...uploadItems];
    
    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      
      // Update status
      updatedItems[i] = { ...item, uploading: true };
      setUploadItems(updatedItems);
      
      try {
        const result = await stickerClient.uploadSticker(
          item.file,
          item.label || `Sticker ${i+1}`,
          communityId,
          category,
          section
        );
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        // If packId is provided, add the sticker to the pack
        if (packId && result.sticker) {
          await stickerClient.addStickersToPack(packId, [result.sticker.id]);
        }
        
        // Mark as successful
        updatedItems[i] = { ...updatedItems[i], uploading: false };
        uploadedStickers.push(result.sticker);
      } catch (error: any) {
        // Mark as failed
        updatedItems[i] = { 
          ...updatedItems[i], 
          uploading: false, 
          error: error.message || "Upload failed" 
        };
      }
      
      // Update UI
      setUploadItems(updatedItems);
    }
    
    // Show summary toast
    const successCount = uploadedStickers.length;
    const failCount = uploadItems.length - successCount;
    
    if (successCount > 0) {
      toast({
        title: "Upload complete",
        description: `${successCount} sticker${successCount > 1 ? 's' : ''} uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        variant: failCount > 0 ? "default" : "default"
      });
      
      // Clear successful items
      setUploadItems(items => items.filter(item => item.error));
      
      // Call completion callback if provided with the array of stickers
      if (onUploadComplete && uploadedStickers.length > 0) {
        onUploadComplete(uploadedStickers);
      }
    } else {
      toast({
        title: "Upload failed",
        description: "All sticker uploads failed",
        variant: "destructive"
      });
    }
    
    setIsUploading(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (allowMultiple) {
      await handleUploadMultiple();
      return;
    }
    
    // Original single upload logic
    if (!file || !label) {
      toast({
        title: "Missing fields",
        description: "Please provide a file and a name for your sticker",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const result = await stickerClient.uploadSticker(
        file,
        label,
        communityId,
        category,
        section
      );
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Upload successful",
        description: "Your sticker has been added to the library"
      });
      
      // If packId is provided, add the sticker to the pack
      if (packId && result.sticker) {
        await stickerClient.addStickersToPack(packId, [result.sticker.id]);
        toast({
          title: "Sticker added to pack",
          description: "The sticker has been added to the current pack"
        });
      }
      
      // Reset form
      setFile(null);
      setLabel('');
      setPreview(null);
      
      // Call completion callback if provided
      if (onUploadComplete && result.sticker) {
        onUploadComplete(result.sticker);
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            multiple={allowMultiple}
            required
          />
        </div>
        {!allowMultiple && (
          <div className="flex-1">
            <Input
              placeholder="Sticker name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isUploading}
              required
            />
          </div>
        )}
        <Button type="submit" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </form>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!allowMultiple ? (
            // Single upload UI
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file">Sticker Image</Label>
                <div className="flex flex-col items-center">
                  {preview ? (
                    <div className="mb-2 relative">
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="w-24 h-24 object-contain border rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreview(null);
                          setFile(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground mb-2">
                      <span className="text-3xl">+</span>
                    </div>
                  )}
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="max-w-52"
                    disabled={isUploading}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">PNG or JPG (max 1MB)</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="label">Sticker Name</Label>
                  <Input
                    id="label"
                    placeholder="E.g. Happy Face"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    disabled={isUploading}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category-select">Category</Label>
                  <FormSelect
                    name="category"
                    id="category-select"
                    defaultValue={category}
                    onChange={setCategory}
                    options={[
                      { value: "basic", label: "Basic" },
                      { value: "premium", label: "Premium" },
                      { value: "custom", label: "Custom" }
                    ]}
                  />
                </div>
                
                <div>
                  <Label htmlFor="section-select">Section</Label>
                  <FormSelect
                    name="section"
                    id="section-select"
                    defaultValue={section}
                    onChange={(value) => setSection(value as StickerSection)}
                    options={[
                      { value: "Feed", label: "Feed" },
                      { value: "Properties", label: "Properties" },
                      { value: "Market", label: "Market" },
                      { value: "Directory", label: "Directory" },
                      { value: "Groups", label: "Groups" }
                    ]}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Multiple upload UI
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="multi-file">Select Images</Label>
                  <p className="text-xs text-muted-foreground">PNG or JPG (max 1MB each)</p>
                </div>
                <Input
                  id="multi-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  multiple
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="multi-category">Category</Label>
                  <FormSelect
                    name="category"
                    id="multi-category"
                    defaultValue={category}
                    onChange={setCategory}
                    options={[
                      { value: "basic", label: "Basic" },
                      { value: "premium", label: "Premium" },
                      { value: "custom", label: "Custom" }
                    ]}
                  />
                </div>
                
                <div>
                  <Label htmlFor="multi-section">Section</Label>
                  <FormSelect
                    name="section"
                    id="multi-section"
                    defaultValue={section}
                    onChange={(value) => setSection(value as StickerSection)}
                    options={[
                      { value: "Feed", label: "Feed" },
                      { value: "Properties", label: "Properties" },
                      { value: "Market", label: "Market" },
                      { value: "Directory", label: "Directory" },
                      { value: "Groups", label: "Groups" }
                    ]}
                  />
                </div>
              </div>

              {uploadItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Images ({uploadItems.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {uploadItems.map((item, index) => (
                      <div 
                        key={index} 
                        className={`border rounded-md p-3 relative ${item.error ? 'border-red-500' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          <img 
                            src={item.preview} 
                            alt={item.label} 
                            className="w-16 h-16 object-contain bg-gray-50 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <Input
                              value={item.label}
                              onChange={(e) => handleLabelChange(index, e.target.value)}
                              disabled={isUploading || item.uploading}
                              className="mb-1"
                            />
                            <p className="text-xs truncate text-muted-foreground">
                              {(item.file.size / 1024).toFixed(0)} KB
                            </p>
                            {item.error && (
                              <p className="text-xs text-red-500 mt-1">
                                {item.error}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={isUploading}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                        {item.uploading && (
                          <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                            <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isUploading || (allowMultiple && uploadItems.length === 0)}
            >
              {isUploading 
                ? allowMultiple 
                  ? `Uploading (${uploadItems.filter(i => i.uploading).length}/${uploadItems.length})` 
                  : "Uploading..." 
                : `Upload ${allowMultiple ? uploadItems.length > 0 ? `${uploadItems.length} Sticker${uploadItems.length > 1 ? 's' : ''}` : 'Stickers' : 'Sticker'}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 