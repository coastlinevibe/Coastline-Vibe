"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const categories = ['Electronics', 'Sports', 'Furniture', 'Fashion'];
const conditions = ['New', 'Like New', 'Good', 'Used'];

// Demo data - in real app, this would come from an API
const demoItem = {
  id: '1',
  title: 'iPhone 13 Pro',
  price: '850',
  category: 'Electronics',
  condition: 'Like New',
  location: 'Miami',
  tags: 'phone, apple',
  description: 'Gently used iPhone 13 Pro, 128GB, Sierra Blue. No scratches, always in case. Includes original box and charger.',
  imageFiles: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80',
  ],
  videoUrl: '',
};

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MarketEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    price: string;
    category: string;
    condition: string;
    location: string;
    tags: string;
    imageFiles: (File | string)[];
    videoFile: File | null;
    videoPreview: string | null;
  }>({
    title: '',
    description: '',
    price: '',
    category: categories[0],
    condition: conditions[0],
    location: '',
    tags: '',
    imageFiles: [],
    videoFile: null,
    videoPreview: null,
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch from Supabase instead of localStorage
    const fetchItem = async () => {
      setLoading(true);
      setFetchError(null);
      const { data: item, error } = await supabase
        .from('market_items')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !item) {
        setFetchError('Item not found.');
        setLoading(false);
        return;
      }
      setFormData({
        title: item.title,
        description: item.description,
        price: item.price?.toString() || '',
        category: item.category,
        condition: item.condition,
        location: item.location,
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
        imageFiles: item.imagefiles || [],
        videoFile: null,
        videoPreview: item.videourl || null,
      });
      setImagePreviews(item.imagefiles || []);
      setLoading(false);
    };
    fetchItem();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length + imagePreviews.length > 5) {
      setUploadError('You can upload a maximum of 5 images');
      return;
    }
    setUploadError(null);
    const previews: string[] = [];
    for (let i = 0; i < files.length; i++) {
      previews.push(URL.createObjectURL(files[i]));
    }
    setImagePreviews((prev) => [...prev, ...previews]);
    setFormData((prev) => ({ ...prev, imageFiles: [...prev.imageFiles, ...Array.from(files)] }));
  };

  const handleRemoveImage = (idx: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    setFormData((prev) => ({ ...prev, imageFiles: prev.imageFiles.filter((_, i) => i !== idx) }));
  };

  const handleSetMainImage = (idx: number) => {
    setImagePreviews(prev => {
      if (idx === 0) return prev;
      const newArr = [...prev];
      const [main] = newArr.splice(idx, 1);
      newArr.unshift(main);
      return newArr;
    });
    setFormData(prev => {
      if (idx === 0) return prev;
      const newArr = [...prev.imageFiles];
      const [main] = newArr.splice(idx, 1);
      newArr.unshift(main);
      return { ...prev, imageFiles: newArr };
    });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, videoFile: file, videoPreview: URL.createObjectURL(file) }));
  };

  const handleRemoveVideo = () => {
    setFormData((prev) => ({ ...prev, videoFile: null, videoPreview: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError(null);
    setSubmitSuccess(null);
    try {
      // Update the item in Supabase
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        category: formData.category,
        condition: formData.condition,
        location: formData.location,
        tags: formData.tags.split(',').map((t: string) => t.trim()),
        imagefiles: imagePreviews, // use 'imagefiles' for Supabase
        videourl: formData.videoPreview || '',
      };
      const { error } = await supabase
        .from('market_items')
        .update(updateData)
        .eq('id', id);
      if (error) {
        setUploadError(error.message);
        setIsUploading(false);
        return;
      }
      setSubmitSuccess('Item updated!');
      setTimeout(() => {
        router.push(`/market/${id}`);
      }, 1200);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to update item.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-cyan-700">Loading...</div>;
  if (fetchError) return <div className="text-center py-12 text-red-500">{fetchError}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Edit Market Item</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-bold text-cyan-900 mb-2">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="e.g. iPhone 13 Pro" />
              </div>
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="Describe the item, features, and condition..." />
              </div>
              <div>
                <label className="block font-medium mb-1">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full border rounded pl-7 pr-2 py-1"
                    required
                    placeholder="USD"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full border rounded px-2 py-1">
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Condition</label>
                <select name="condition" value={formData.condition} onChange={handleChange} className="w-full border rounded px-2 py-1">
                  {conditions.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="e.g. Miami" />
              </div>
              <div>
                <label className="block font-medium mb-1">Tags <span className="text-xs text-gray-500">(comma separated)</span></label>
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="e.g. phone, apple" />
              </div>
            </div>
          </div>
          {/* Media Uploads */}
          <div>
            <h2 className="text-lg font-bold text-cyan-900 mb-2">Media</h2>
            {/* Image Upload */}
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDragOver ? 'border-cyan-400 bg-cyan-50' : 'border-cyan-200 bg-cyan-50'}`}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
              onDrop={e => {
                e.preventDefault();
                setIsDragOver(false);
                const files = e.dataTransfer.files;
                if (files && files.length) {
                  const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
                  handleImageChange(event);
                }
              }}
            >
              <label className="block font-medium mb-2">Item Images (max 5)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="market-image-upload"
              />
              <label htmlFor="market-image-upload" className="cursor-pointer inline-block px-4 py-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 transition mb-2">Select Images</label>
              <div className="text-xs text-gray-500 mb-2">Drag and drop or select up to 5 images</div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img src={src} alt="Preview" className="w-full h-20 object-cover rounded border" />
                    <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                    {idx !== 0 && (
                      <button type="button" onClick={() => handleSetMainImage(idx)} className="absolute bottom-1 left-1 bg-white/80 rounded-full p-1 text-yellow-500 border border-yellow-200 hover:bg-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity" title="Set as Main">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                      </button>
                    )}
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-yellow-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">Main</span>
                    )}
                  </div>
                ))}
              </div>
              {isUploading && <div className="text-xs text-cyan-600 mt-1">Uploading images...</div>}
              {uploadError && <div className="text-xs text-red-500 mt-1">{uploadError}</div>}
            </div>
            {/* Video Upload */}
            <div className="mt-6">
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDragOver ? 'border-cyan-400 bg-cyan-50' : 'border-cyan-200 bg-cyan-50'}`}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const files = e.dataTransfer.files;
                  if (files && files.length) {
                    const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
                    handleVideoChange(event);
                  }
                }}
              >
                <label className="block font-medium mb-2">Item Video (optional)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                  id="market-video-upload"
                />
                <label htmlFor="market-video-upload" className="cursor-pointer inline-block px-4 py-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 transition mb-2">Select Video</label>
                <div className="text-xs text-gray-500 mb-2">Drag and drop or select a video file</div>
                {formData.videoPreview && (
                  <div className="relative group">
                    <video src={formData.videoPreview} controls className="w-full h-40 object-cover rounded border" />
                    <button type="button" onClick={handleRemoveVideo} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Submission Feedback */}
          {submitSuccess && <div className="text-xs text-green-600 mt-1">{submitSuccess}</div>}
          <button type="submit" className="w-full py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition" disabled={isUploading}>Update Item</button>
        </form>
      </div>
    </div>
  );
} 