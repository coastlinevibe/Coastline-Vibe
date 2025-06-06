'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUploader from './ImageUploader';
import VideoUploader from './VideoUploader';
import { Image, Video } from 'lucide-react';

interface MediaUploaderProps {
  onMediaSelected: (media: { images: string[], video: string | null }) => void;
  onError?: (error: string) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ 
  onMediaSelected,
  onError
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'video'>('images');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);

  const handleImagesUploaded = (imageUrls: string[]) => {
    setUploadedImages(imageUrls);
    onMediaSelected({ images: imageUrls, video: null });
  };

  const handleVideoUploaded = (videoUrl: string) => {
    setUploadedVideo(videoUrl);
    onMediaSelected({ images: [], video: videoUrl });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'images' | 'video');
    
    // Reset the other media type when switching tabs
    if (value === 'images') {
      setUploadedVideo(null);
    } else {
      setUploadedImages([]);
    }
    
    // Notify parent component about the change
    onMediaSelected({
      images: value === 'images' ? uploadedImages : [],
      video: value === 'video' ? uploadedVideo : null
    });
  };

  const handleError = (error: string) => {
    onError?.(error);
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="images" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image size={16} />
            <span>Images</span>
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video size={16} />
            <span>Video</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="images">
          <ImageUploader
            onImagesUploaded={handleImagesUploaded}
            onError={handleError}
            maxFiles={5}
            maxSizeMB={10}
          />
        </TabsContent>
        
        <TabsContent value="video">
          <VideoUploader
            onVideoUploaded={handleVideoUploaded}
            onError={handleError}
            maxSizeMB={50}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MediaUploader; 