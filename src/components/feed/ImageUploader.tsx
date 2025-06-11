'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Image, X, Upload, AlertCircle, Plus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
  onImagesUploaded: (imageUrls: string[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  initialFiles?: File[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesUploaded,
  onError,
  maxFiles = 5,
  maxSizeMB = 10,
  initialFiles = []
}) => {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialFiles.length > 0) {
      handleFiles(initialFiles);
    }
  }, [initialFiles]);

  const handleFiles = (files: File[]) => {
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Please select valid image files only');
      onError?.('Please select valid image files only');
      return;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      setError(`Some images exceed maximum allowed size (${maxSizeMB}MB)`);
      onError?.(`Some images exceed maximum allowed size (${maxSizeMB}MB)`);
      return;
    }

    if (selectedImages.length + files.length > maxFiles) {
      setError(`You can upload a maximum of ${maxFiles} images`);
      onError?.(`You can upload a maximum of ${maxFiles} images`);
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);
    setError(null);

    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  const onDrop = (acceptedFiles: File[]) => {
    handleFiles(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.gif', '.jpeg', '.jpg'] },
    maxSize: maxSizeMB * 1024 * 1024,
    maxFiles: maxFiles,
    disabled: isUploading || selectedImages.length >= maxFiles,
  });
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };
  
  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const uploadImages = async () => {
    if (selectedImages.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('feedpostimages')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });
        
        if (error) {
          throw new Error(`Error uploading image: ${error.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('feedpostimages')
          .getPublicUrl(filePath);
        
        uploadedUrls.push(publicUrl);
        
        setUploadProgress(Math.round(((i + 1) / selectedImages.length) * 100));
      }
      
      onImagesUploaded(uploadedUrls);
      
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedImages([]);
      setPreviewUrls([]);
      setUploadProgress(0);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err: any) {
      console.error('Error uploading images:', err);
      setError(err.message || 'An error occurred while uploading images');
      onError?.(err.message || 'An error occurred while uploading images');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      {previewUrls.length > 0 ? (
        <div className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <img 
                  src={url} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black bg-opacity-70 text-white p-1 rounded-full hover:bg-opacity-90"
                  disabled={isUploading}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            {selectedImages.length < maxFiles && (
              <div 
                {...getRootProps()}
                className={`border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center aspect-square cursor-pointer hover:bg-gray-50 ${isDragActive ? 'bg-blue-50 border-blue-400' : ''}`}
              >
                <input {...getInputProps()} />
                <Plus size={24} className="text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="mt-3 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {selectedImages.length} of {maxFiles} images selected
            </span>
            
            {!isUploading ? (
              <button
                type="button"
                onClick={uploadImages}
                className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 flex items-center"
                disabled={selectedImages.length === 0}
              >
                <Upload size={14} className="mr-1" />
                Upload All
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
      ) : (
        <div 
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 ${isDragActive ? 'bg-blue-50 border-blue-400' : 'border-gray-300'}`}
        >
          <input {...getInputProps()} />
          <Image className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-2 text-sm text-gray-600">
            <p className="font-medium text-blue-600 hover:text-blue-500">
              {isDragActive ? "Drop the images here ..." : "Upload images or drag and drop"}
            </p>
            <p className="text-xs mt-1">PNG, JPG, GIF up to {maxSizeMB}MB (max {maxFiles} files)</p>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        id="image-upload"
        name="images"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageSelect}
        disabled={isUploading || selectedImages.length >= maxFiles}
      />
      
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <AlertCircle size={14} className="mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 