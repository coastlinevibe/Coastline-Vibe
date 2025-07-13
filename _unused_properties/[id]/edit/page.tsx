"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const IMAGE_BUCKET = 'propertyimages';

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .single();
      if (error || !data) {
        setError('Property not found');
        setLoading(false);
        return;
      }
      setForm(data);
      setImagePreviews(data.imageFiles || []);
      setVideoPreview(data.videoUrl || null);
      setLoading(false);
    };
    fetchProperty();
    // eslint-disable-next-line
  }, [params.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if total images would exceed 10
    if (files.length + (form.imageFiles?.length || 0) > 10) {
      setSubmitError("You can upload a maximum of 10 images per property");
      return;
    }

    setNewImages(Array.from(files));
    setImagePreviews(Array.from(files).map(file => URL.createObjectURL(file)));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('Submitting form');
    console.log('params.id:', params.id);
    e.preventDefault();
    setSubmitError(null);
    setIsUploading(true);
    let imageUrls = form.imageFiles || [];
    let videoUrl = form.videoUrl;
    // If new images are selected, upload them and replace
    if (newImages.length > 0) {
      imageUrls = [];
      for (let file of newImages) {
        const filePath = `Miami/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) {
          setSubmitError(uploadError.message);
          setIsUploading(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage
          .from(IMAGE_BUCKET)
          .getPublicUrl(filePath);
        if (publicUrlData && publicUrlData.publicUrl) {
          imageUrls.push(publicUrlData.publicUrl);
        }
      }
    }
    if (videoFile) {
      const filePath = `Miami/${Date.now()}-${videoFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('propertyvideos')
        .upload(filePath, videoFile, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        setSubmitError(uploadError.message);
        setIsUploading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from('propertyvideos')
        .getPublicUrl(filePath);
      if (publicUrlData && publicUrlData.publicUrl) {
        videoUrl = publicUrlData.publicUrl;
      }
    }
    // Prepare update data
    const updateData = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      city: form.city,
      location: form.location,
      squarefeet: Number(form.squarefeet),
      propertyType: form.propertyType,
      listingType: form.listingType,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      isFurnished: form.isFurnished,
      hasParking: form.hasParking,
      isPetFriendly: form.isPetFriendly,
      imageFiles: imageUrls,
      videoUrl: videoUrl || null,
      listed_by: form.listed_by,
    };
    console.log('Update data:', updateData);
    const { data, error: updateError } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', params.id);
    console.log('Update response:', data);
    console.log('Update error:', updateError);
    if (updateError) {
      setSubmitError(updateError.message);
      setIsUploading(false);
      return;
    }
    console.log('Update success');
    setIsUploading(false);
    router.push('/properties');
  };

  const handleSetMainImage = (idx: number) => {
    setImagePreviews(prev => {
      if (idx === 0) return prev;
      const newArr = [...prev];
      const [main] = newArr.splice(idx, 1);
      newArr.unshift(main);
      return newArr;
    });
    setForm((prev: any) => {
      if (idx === 0) return prev;
      const newArr = [...prev.imageFiles];
      const [main] = newArr.splice(idx, 1);
      newArr.unshift(main);
      return { ...prev, imageFiles: newArr };
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-cyan-700">Loading...</div>;
  if (error || !form) return <div className="min-h-screen flex items-center justify-center text-red-600">{error || 'Property not found.'}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <a
            href="/properties"
            className="inline-block px-4 py-2 rounded bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition"
          >
            ← Back to Listings
          </a>
        </div>
        <h1 className="text-2xl font-bold mb-4">Edit Property</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-bold text-cyan-900 mb-2">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Title</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="e.g. Lake-View 2 Bedroom Apartment" />
              </div>
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="Describe the property, features, and highlights..." />
              </div>
              <div>
                <label className="block font-medium mb-1">I am the: <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-l border font-semibold ${form.listed_by === 'owner' ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-cyan-700'}`}
                    onClick={() => setForm((prev: any) => ({ ...prev, listed_by: 'owner' }))}
                    aria-pressed={form.listed_by === 'owner'}
                  >
                    Owner
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-r border font-semibold ${form.listed_by === 'agent' ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-cyan-700'}`}
                    onClick={() => setForm((prev: any) => ({ ...prev, listed_by: 'agent' }))}
                    aria-pressed={form.listed_by === 'agent'}
                  >
                    Agent
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    className="w-full border rounded pl-7 pr-2 py-1"
                    required
                    placeholder={form.listingType === 'Rent' ? 'USD per month' : 'USD (one-time)'}
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">City</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="e.g. Hanoi" />
              </div>
              <div>
                <label className="block font-medium mb-1">Location</label>
                <input type="text" name="location" value={form.location} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="Neighborhood or Address" />
              </div>
              <div>
                <label className="block font-medium mb-1">Square Feet</label>
                <input type="number" name="squarefeet" value={form.squarefeet || ''} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="e.g. 1200" />
              </div>
            </div>
          </div>
          {/* Property Details */}
          <div>
            <h2 className="text-lg font-bold text-cyan-900 mb-2">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Property Type</label>
                <select name="propertyType" value={form.propertyType} onChange={handleChange} className="w-full border rounded px-2 py-1">
                  <option>Apartment / Flat</option>
                  <option>House / Villa</option>
                  <option>Studio</option>
                  <option>Townhouse</option>
                  <option>Condo / Condominium</option>
                  <option>Duplex</option>
                  <option>Penthouse</option>
                  <option>Loft</option>
                  <option>Bungalow</option>
                  <option>Cottage</option>
                  <option>Commercial Space</option>
                  <option>Land / Plot</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Listing Type</label>
                <select name="listingType" value={form.listingType} onChange={handleChange} className="w-full border rounded px-2 py-1">
                  <option>Rent</option>
                  <option>Sale</option>
                  <option>Short Term Rental</option>
                  <option>Shared Accommodation</option>
                  <option>Sublet</option>
                  <option>Co-living</option>
                  <option>Vacation Rental</option>
                  <option>Commercial Lease</option>
                  <option>Lease to Own</option>
                  <option>Auction</option>
                  <option>Exchange</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Bedrooms</label>
                <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block font-medium mb-1">Bathrooms</label>
                <input type="number" name="bathrooms" value={form.bathrooms} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="isFurnished" checked={form.isFurnished} onChange={handleChange} />
                <label>Furnished</label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="hasParking" checked={form.hasParking} onChange={handleChange} />
                <label>Parking</label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="isPetFriendly" checked={form.isPetFriendly} onChange={handleChange} />
                <label>Pet Friendly</label>
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
              <label className="block font-medium mb-2">Property Images (max 10)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="property-image-upload"
                disabled={isUploading || (form.imageFiles?.length || 0) >= 10}
              />
              <label htmlFor="property-image-upload" className={`cursor-pointer inline-block px-4 py-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 transition mb-2 ${(form.imageFiles?.length || 0) >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}>Select Images</label>
              <div className="text-xs text-gray-500 mb-2">Drag and drop or select up to 10 images. <span className="font-semibold text-cyan-700">{form.imageFiles?.length || 0}/10</span> selected</div>
              <div className="text-xs text-gray-700 mb-2">Accepted image types: <span className="font-semibold">JPG, PNG, GIF, WEBP</span></div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img src={src} alt="Preview" className="w-full h-20 object-cover rounded border" />
                    <button type="button" onClick={() => {
                      setImagePreviews(prev => prev.filter((_, i) => i !== idx));
                      setForm((prev: any) => ({ ...prev, imageFiles: prev.imageFiles.filter((_: any, i: number) => i !== idx) }));
                    }} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
              {submitError && <div className="text-xs text-red-500 mt-1">{submitError}</div>}
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
                <label className="block font-medium mb-2">Property Video (optional, max 2)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                  id="property-video-upload"
                  disabled={isUploading || !!videoFile}
                />
                <label htmlFor="property-video-upload" className={`cursor-pointer inline-block px-4 py-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 transition mb-2 ${videoFile ? 'opacity-50 cursor-not-allowed' : ''}`}>Select Video</label>
                <div className="text-xs text-gray-500 mb-2">Drag and drop or select up to 2 video files. <span className="font-semibold text-cyan-700">{videoFile ? (Array.isArray(videoFile) ? videoFile.length : 1) : 0}/2 selected</span></div>
                <div className="text-xs text-gray-700 mb-2">Accepted video types: <span className="font-semibold">MP4, MOV, AVI, WEBM</span></div>
                {videoPreview && (
                  <div className="flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 text-sm text-cyan-900 font-medium">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z"/></svg>
                      <span>{videoFile ? videoFile.name : ''}</span>
                      <span className="text-xs text-gray-500">{videoFile ? `(${(videoFile.size / 1024 / 1024).toFixed(1)} MB)` : ''}</span>
                      <button type="button" onClick={() => { setVideoFile(null); setVideoPreview(null); setForm((prev: any) => ({ ...prev, videoUrl: '' })); }} className="ml-2 bg-white/80 rounded-full p-1 text-red-500 border border-red-200 hover:bg-red-50">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <video src={videoPreview!} controls className="w-full h-40 object-cover rounded border mt-2" />
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Submission Feedback */}
          {submitError && <div className="text-xs text-red-500 mt-1">{submitError}</div>}
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              className="w-1/2 py-2 bg-gray-200 text-cyan-900 rounded hover:bg-gray-300 transition"
              onClick={() => window.location.href = '/properties'}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
              disabled={isUploading}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 