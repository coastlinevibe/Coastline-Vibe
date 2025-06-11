'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Video, AlertCircle } from 'lucide-react';

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void;
  onUploadComplete?: (url: string) => void;
  communityId: string;
  maxSizeMB?: number;
  initialPreviewUrl?: string;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ 
  onVideoSelect, 
  onUploadComplete, 
  communityId,
  maxSizeMB = 50,
  initialPreviewUrl,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null);

  useEffect(() => {
    setPreviewUrl(initialPreviewUrl || null);
  }, [initialPreviewUrl]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);

    if (fileRejections.length > 0) {
      const firstRejection = fileRejections[0];
      if (firstRejection.errors[0].code === 'file-too-large') {
        setError(`File is larger than ${maxSizeMB}MB`);
      } else {
        setError(firstRejection.errors[0].message);
      }
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      setUploading(true);
      setError(null);
      
      onVideoSelect(file);
      
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);

      setUploading(false);
    }
  }, [onVideoSelect, maxSizeMB]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] },
    multiple: false,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-500' : ''}`}
      >
        <input {...getInputProps()} />
        {previewUrl ? (
          <div className="relative">
            <video src={previewUrl} controls className="w-full h-auto rounded-lg" preload="metadata" />
          </div>
        ) : isDragActive ? (
          <p className="text-gray-500">Drop the video here...</p>
        ) : (
          <div className="text-center">
            <Video className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Drag & drop a video, or click to select</p>
            <p className="text-xs text-gray-400">MP4, MOV, AVI, MKV up to {maxSizeMB}MB</p>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 flex items-center text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{error}</span>
        </div>
      )}
      {uploading && <p className="mt-2 text-sm text-gray-600">Processing...</p>}
    </div>
  );
};

export default VideoUploader; 