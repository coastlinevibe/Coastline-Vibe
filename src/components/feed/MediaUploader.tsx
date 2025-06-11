'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import ImageUploader from './ImageUploader';
import VideoUploader from './VideoUploader';
import FileUploader from './FileUploader';
import { Image, Video, File as FileIcon } from 'lucide-react';

interface MediaUploaderProps {
  onMediaSelected: (media: { images: string[], video: string | null, files: string[] }) => void;
  onVideoSelected?: (file: File, previewUrl: string) => void;
  onVideoRemoved?: () => void;
  onError?: (error: string) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ 
  onMediaSelected,
  onVideoSelected,
  onVideoRemoved,
  onError
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'video' | 'files'>('images');
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      // Handle rejections (e.g., file too large, wrong type)
      const message = fileRejections[0].errors[0].message;
      onError?.(message);
      return;
    }

    // Set dropped files to be passed to the active uploader
    setDroppedFiles(acceptedFiles);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true, // We will use our own click handlers on the uploader components
    noKeyboard: true
  });

  const handleImagesUploaded = (imageUrls: string[]) => {
    onMediaSelected({ images: imageUrls, video: null, files: [] });
    setDroppedFiles([]);
  };

  const handleVideoUploaded = (videoUrl: string) => {
    onMediaSelected({ images: [], video: videoUrl, files: [] });
    setDroppedFiles([]);
  };

  const handleFilesUploaded = (fileUrls: string[]) => {
    onMediaSelected({ images: [], video: null, files: fileUrls });
    setDroppedFiles([]);
  };

  const handleError = (error: string) => {
    onError?.(error);
  };
  
  // Clear dropped files when tab changes
  useEffect(() => {
    setDroppedFiles([]);
  }, [activeTab]);

  return (
    <div {...getRootProps({ className: 'dropzone' })} 
         className={`w-full relative rounded-lg transition-colors ${isDragActive ? 'bg-blue-50' : 'bg-white'}`}>
      <input {...getInputProps()} />
      
      {isDragActive && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-75 flex items-center justify-center rounded-lg z-30 border-2 border-dashed border-blue-400">
          <p className="text-blue-700 font-bold text-xl">Drop files here</p>
        </div>
      )}
      
      {/* Custom Tab Navigation */}
      <div className="flex w-full border-b border-gray-200 mb-4 relative z-10">
        <div 
          className={`flex-1 cursor-pointer relative ${
            activeTab === 'images' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('images')}
        >
          <div className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium">
            <Image size={16} />
            <span>Images</span>
          </div>
        </div>
        <div 
          className={`flex-1 cursor-pointer relative ${
            activeTab === 'video' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('video')}
        >
          <div className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium">
            <Video size={16} />
            <span>Video</span>
          </div>
        </div>
        <div 
          className={`flex-1 cursor-pointer relative ${
            activeTab === 'files' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('files')}
        >
          <div className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium">
            <FileIcon size={16} />
            <span>Files</span>
          </div>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'images' && (
          <ImageUploader
            onImagesUploaded={handleImagesUploaded}
            onError={handleError}
            maxFiles={5}
            maxSizeMB={10}
            initialFiles={droppedFiles}
          />
        )}
        
        {activeTab === 'video' && (
          <VideoUploader
            onVideoUploaded={handleVideoUploaded}
            onVideoSelected={onVideoSelected}
            onVideoRemoved={onVideoRemoved}
            onError={handleError}
            maxSizeMB={50}
            initialFiles={droppedFiles}
          />
        )}

        {activeTab === 'files' && (
          <FileUploader
            onFilesUploaded={handleFilesUploaded}
            onError={handleError}
            maxFiles={3}
            maxSizeMB={10}
            initialFiles={droppedFiles}
          />
        )}
      </div>
    </div>
  );
};

export default MediaUploader; 