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
  const [showVideoHint, setShowVideoHint] = useState(true);

  // Hide the video hint after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowVideoHint(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleImagesUploaded = (imageUrls: string[]) => {
    console.log('Images uploaded:', imageUrls);
    setUploadedImages(imageUrls);
    onMediaSelected({ images: imageUrls, video: null });
  };

  const handleVideoUploaded = (videoUrl: string) => {
    console.log('Video uploaded:', videoUrl);
    setUploadedVideo(videoUrl);
    onMediaSelected({ images: [], video: videoUrl });
  };

  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value);
    setActiveTab(value as 'images' | 'video');
    
    // Reset the other media type when switching tabs
    if (value === 'images') {
      setUploadedVideo(null);
    } else {
      setUploadedImages([]);
    }
    
    // Notify parent component about the change
    const mediaToSend = {
      images: value === 'images' ? uploadedImages : [],
      video: value === 'video' ? uploadedVideo : null
    };
    
    console.log('Sending media to parent:', mediaToSend);
    onMediaSelected(mediaToSend);
  };

  const handleError = (error: string) => {
    onError?.(error);
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-sm text-gray-600">
        Select <strong>Video</strong> tab to upload videos or <strong>Images</strong> tab to upload images
      </div>
      {showVideoHint && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 flex items-center">
          <Video size={16} className="mr-2" />
          <span>Want to upload a video? Click the <strong>Video</strong> tab!</span>
        </div>
      )}
      <Tabs defaultValue="images" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100">
          <TabsTrigger 
            value="images" 
            className="flex items-center justify-center gap-2 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <Image size={16} />
            <span>Images</span>
          </TabsTrigger>
          <TabsTrigger 
            value="video" 
            className="flex items-center justify-center gap-2 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <Video size={16} />
            <span>Video</span>
            {activeTab !== 'video' && <span className="ml-1 text-xs text-blue-500 animate-pulse">Click to upload video</span>}
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