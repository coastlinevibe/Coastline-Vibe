'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Video, X, Upload, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface VideoUploaderProps {
  onVideoUploaded: (videoUrl: string) => void;
  onError?: (error: string) => void;
  maxSizeMB?: number;
  initialFiles?: File[];
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ 
  onVideoUploaded, 
  onError,
  maxSizeMB = 50,
  initialFiles = []
}) => {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialFiles.length > 0) {
      handleFile(initialFiles[0]);
    }
  }, [initialFiles]);

  const handleFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      onError?.('Please select a valid video file');
      return;
    }
    
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Video size exceeds maximum allowed size (${maxSizeMB}MB)`);
      onError?.(`Video size exceeds maximum allowed size (${maxSizeMB}MB)`);
      return;
    }
    
    setSelectedVideo(file);
    setError(null);
    
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };
  
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.webm', '.mov', '.quicktime'] },
    multiple: false,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: isUploading || !!selectedVideo,
  });

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };
  
  const removeVideo = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedVideo(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const uploadVideo = async () => {
    if (!selectedVideo) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      const fileExt = selectedVideo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('feedpostvideos')
        .upload(filePath, selectedVideo, { cacheControl: '3600', upsert: false });
      
      if (error) {
        throw new Error(`Error uploading video: ${error.message}`);
      }
      
      setUploadProgress(100);
      
      const { data: { publicUrl } } = supabase.storage
        .from('feedpostvideos')
        .getPublicUrl(filePath);
      
      onVideoUploaded(publicUrl);
      removeVideo();
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while uploading the video');
      onError?.(err.message || 'An error occurred while uploading the video');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      {!selectedVideo ? (
        <div 
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors ${isDragActive ? 'bg-blue-50 border-blue-400' : 'border-blue-300'}`}
        >
          <input {...getInputProps()} />
          <Video className="mx-auto h-14 w-14 text-blue-500" />
          <div className="mt-3 text-sm text-gray-600">
            <p className="font-medium text-blue-600 hover:text-blue-500 text-lg">
              {isDragActive ? "Drop the video here..." : "Upload a video"}
            </p>
            <p className="text-xs mt-1">MP4, WebM or MOV up to {maxSizeMB}MB</p>
            <p className="mt-3 text-sm font-medium text-blue-600">Click here to select a video file or drag and drop</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden">
          <div className="relative">
            <video 
              src={previewUrl || undefined}
              className="w-full h-auto max-h-[300px] object-contain bg-black"
              controls
            />
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-1 rounded-full hover:bg-opacity-90"
              disabled={isUploading}
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-700 truncate max-w-[70%]">
              {selectedVideo.name} ({(selectedVideo.size / (1024 * 1024)).toFixed(2)}MB)
            </div>
            
            {!isUploading ? (
              <button
                type="button"
                onClick={uploadVideo}
                className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 flex items-center"
              >
                <Upload size={14} className="mr-1" />
                Upload
              </button>
            ) : (
              <span className="text-sm text-blue-600">{uploadProgress}%</span>
            )}
          </div>
          
          {isUploading && (
            <div className="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <AlertCircle size={14} className="mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default VideoUploader; 