'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { File as FileIcon, X, Upload, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onFilesUploaded: (fileUrls: string[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  allowedFileTypes?: string[];
  initialFiles?: File[];
  communityId: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesUploaded,
  onError,
  maxFiles = 3,
  maxSizeMB = 10,
  allowedFileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
  initialFiles = [],
  communityId
}) => {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialFiles.length > 0) {
      handleFiles(initialFiles);
    }
  }, [initialFiles]);

  const handleFiles = (files: File[]) => {
    const invalidFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      return !allowedFileTypes.includes(extension);
    });
    
    if (invalidFiles.length > 0) {
      setError(`Please select valid file types: ${allowedFileTypes.join(', ')}`);
      onError?.(`Please select valid file types: ${allowedFileTypes.join(', ')}`);
      return;
    }
    
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed maximum allowed size (${maxSizeMB}MB)`);
      onError?.(`Some files exceed maximum allowed size (${maxSizeMB}MB)`);
      return;
    }
    
    if (selectedFiles.length + files.length > maxFiles) {
      setError(`You can upload a maximum of ${maxFiles} files`);
      onError?.(`You can upload a maximum of ${maxFiles} files`);
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...files]);
    setError(null);
  };

  const onDrop = (acceptedFiles: File[]) => {
    handleFiles(acceptedFiles);
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxSizeMB * 1024 * 1024,
    maxFiles: maxFiles,
    disabled: isUploading || selectedFiles.length >= maxFiles,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };
  
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${communityId}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('feedpostfiles')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });
        
        if (error) {
          throw new Error(`Error uploading file: ${error.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('feedpostfiles')
          .getPublicUrl(filePath);
        
        uploadedUrls.push(publicUrl);
        
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }
      
      onFilesUploaded(uploadedUrls);
      
      setSelectedFiles([]);
      setUploadProgress(0);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while uploading files');
      onError?.(err.message || 'An error occurred while uploading files');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      {selectedFiles.length > 0 ? (
        <div className="mb-4">
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center space-x-2 overflow-hidden">
                  <FileIcon size={16} className="text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">({(file.size / (1024 * 1024)).toFixed(2)}MB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  disabled={isUploading}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-3 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {selectedFiles.length} of {maxFiles} files selected
            </span>
            
            {!isUploading ? (
              <button
                type="button"
                onClick={uploadFiles}
                className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 flex items-center"
                disabled={selectedFiles.length === 0}
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
          <FileIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-2 text-sm text-gray-600">
            <p className="font-medium text-blue-600 hover:text-blue-500">
              {isDragActive ? "Drop the files here ..." : "Upload documents or drag and drop"}
            </p>
            <p className="text-xs mt-1">
              {allowedFileTypes.join(', ').toUpperCase()} up to {maxSizeMB}MB (max {maxFiles} files)
            </p>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        id="file-upload"
        name="files"
        type="file"
        accept={allowedFileTypes.map(t => `.${t}`).join(',')}
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading || selectedFiles.length >= maxFiles}
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

export default FileUploader; 