"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

const IMAGE_BUCKET = 'propertyimages';
const VIDEO_BUCKET = 'propertyvideos';

// Explicit type for formData
interface PropertyFormData {
  title: string;
  description: string;
  price: string;
  city: string;
  location: string;
  squareFeet: string;
  propertyType: string;
  listingType: string;
  bedrooms: number;
  bathrooms: number;
  isFurnished: boolean;
  hasParking: boolean;
  isPetFriendly: boolean;
  selectedTags: string[];
  imageFiles: string[];
  videoUrl: string;
  amenities: string;
  lifestyleTags: string;
  map_location: string;
}

const CreatePropertyPage = () => {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    price: '',
    city: '',
    location: '',
    squareFeet: '',
    propertyType: 'Apartment',
    listingType: 'Rent',
    bedrooms: 1,
    bathrooms: 1,
    isFurnished: false,
    hasParking: false,
    isPetFriendly: false,
    selectedTags: [],
    imageFiles: [],
    videoUrl: '',
    amenities: '',
    lifestyleTags: '',
    map_location: '',
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUploadProgress, setImageUploadProgress] = useState<number[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  // Add this state for drag-over effect
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Check if total images would exceed 10
    if (files.length + formData.imageFiles.length > 10) {
      setUploadError("You can upload a maximum of 10 images per property");
      return;
    }
    
    // Check authentication first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setUploadError("You must be logged in to upload images");
      return;
    }
    console.log("Authenticated user:", user.id);

    setIsUploading(true);
    setUploadError(null);
    const previews: string[] = [];
    const urls: string[] = [];
    const progressArr: number[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      previews.push(URL.createObjectURL(file));
      progressArr.push(0);
      const filePath = `Miami/${Date.now()}-${file.name}`;
      console.log("Attempting to upload to:", filePath);
      
      const { data, error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        setUploadError(error.message);
        setIsUploading(false);
        return;
      }

      console.log("Upload successful:", data);
      const { data: publicUrlData } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(filePath);
      
      if (publicUrlData && publicUrlData.publicUrl) {
        urls.push(publicUrlData.publicUrl);
      }
    }
    setImagePreviews(previews);
    setFormData((prev) => ({ ...prev, imageFiles: urls }));
    setImageUploadProgress(progressArr.map(() => 100));
    setIsUploading(false);
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsUploading(true);
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubmitError('You must be logged in to create a property');
        setIsUploading(false);
        return;
      }
      const userId = session.user.id;
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profileError || !profileData || !profileData.email) {
        setShowEmailModal(true);
        setIsUploading(false);
        return;
      }
      setProfile(profileData);
      let videoUrl = '';
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
        // Always get the public URL after upload
        const { data: publicUrlData } = supabase.storage
          .from('propertyvideos')
          .getPublicUrl(filePath);
        if (publicUrlData && publicUrlData.publicUrl) {
          videoUrl = publicUrlData.publicUrl;
        }
      }
      // Prepare the data for insertion
      const insertData = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        city: formData.city,
        location: formData.location,
        squarefeet: Number(formData.squareFeet),
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        isFurnished: formData.isFurnished,
        hasParking: formData.hasParking,
        isPetFriendly: formData.isPetFriendly,
        imageFiles: formData.imageFiles,
        videoUrl: videoUrl || null,
        amenities: formData.amenities
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a.length > 0),
        lifestyleTags: formData.lifestyleTags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        map_location: formData.map_location,
        user_id: userId,
        approval_status: 'pending',
        community_id: 'e3316cb7-4c7e-437d-9901-0c310ec90a92'
      };
      console.log('Saving property with videoUrl:', videoUrl);
      const { data, error } = await supabase.from('properties').insert([insertData]);
      if (error) {
        setSubmitError(error.message);
        setIsUploading(false);
        return;
      }
      setSubmitSuccess('Property created successfully! Pending admin approval.');
      setIsUploading(false);
      // Optionally redirect after a short delay
      setTimeout(() => router.push('/properties'), 1200);
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred');
      setIsUploading(false);
    }
  };

  // Remove image handler
  const handleRemoveImage = (idx: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    setFormData(prev => ({ ...prev, imageFiles: prev.imageFiles.filter((_, i) => i !== idx) }));
  };
  // Remove video handler
  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setFormData(prev => ({ ...prev, videoUrl: '' }));
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Create Property</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-bold text-cyan-900 mb-2">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="e.g. Lake-View 2 Bedroom Apartment" />
              </div>
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 whitespace-pre-line"
                  required
                  placeholder="Describe the property, features, and highlights..."
                  rows={5}
                />
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
                    placeholder={formData.listingType === 'Rent' ? 'USD per month' : 'USD (one-time)'}
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="e.g. Hanoi" />
              </div>
              <div>
                <label className="block font-medium mb-1">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="Neighborhood or Address" />
              </div>
              <div>
                <label className="block font-medium mb-1">Square Feet</label>
                <input type="number" name="squareFeet" value={formData.squareFeet} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="e.g. 1200" />
              </div>
            </div>
          </div>
          {/* Property Details */}
          <div>
            <h2 className="text-lg font-bold text-cyan-900 mb-2">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Property Type</label>
                <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full border rounded px-2 py-1">
                  <option>Apartment</option>
                  <option>House</option>
                  <option>Studio</option>
                  <option>Townhouse</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Listing Type</label>
                <select name="listingType" value={formData.listingType} onChange={handleChange} className="w-full border rounded px-2 py-1">
                  <option>Rent</option>
                  <option>Sale</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Bedrooms</label>
                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block font-medium mb-1">Bathrooms</label>
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="isFurnished" checked={formData.isFurnished} onChange={handleChange} />
                <label>Furnished</label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="hasParking" checked={formData.hasParking} onChange={handleChange} />
                <label>Parking</label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="isPetFriendly" checked={formData.isPetFriendly} onChange={handleChange} />
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
                disabled={isUploading || formData.imageFiles.length >= 10}
              />
              <label htmlFor="property-image-upload" className={`cursor-pointer inline-block px-4 py-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 transition mb-2 ${formData.imageFiles.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}>Select Images</label>
              <div className="text-xs text-gray-500 mb-2">Drag and drop or select up to 10 images. <span className="font-semibold text-cyan-700">{formData.imageFiles.length}/10</span> selected</div>
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
                <label className="block font-medium mb-2">Property Video (optional, max 1)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                  id="property-video-upload"
                  disabled={isUploading || !!videoFile}
                />
                <label htmlFor="property-video-upload" className={`cursor-pointer inline-block px-4 py-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 transition mb-2 ${videoFile ? 'opacity-50 cursor-not-allowed' : ''}`}>Select Video</label>
                <div className="text-xs text-gray-500 mb-2">Drag and drop or select a video file. <span className="font-semibold text-cyan-700">{videoFile ? '1/1 selected' : '0/1 selected'}</span></div>
                {videoFile && (
                  <div className="flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 text-sm text-cyan-900 font-medium">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"/></svg>
                      <span>{videoFile.name}</span>
                      <span className="text-xs text-gray-500">({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                      <button type="button" onClick={handleRemoveVideo} className="ml-2 bg-white/80 rounded-full p-1 text-red-500 border border-red-200 hover:bg-red-50">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <video src={videoPreview!} controls className="w-full h-40 object-cover rounded border mt-2" />
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Extra Info */}
          <div>
            <h2 className="text-lg font-bold text-cyan-900 mb-2">Extra Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Amenities <span className="text-xs text-gray-500">(comma separated)</span></label>
                <input
                  type="text"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder="e.g. WiFi, Pool, Gym, Balcony"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Lifestyle Tags <span className="text-xs text-gray-500">(comma separated)</span></label>
                <input
                  type="text"
                  name="lifestyleTags"
                  value={formData.lifestyleTags}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder="e.g. Family, Urban, Pet Owners"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Map Location <span className="text-xs text-gray-500">(address or coordinates)</span></label>
                <input
                  type="text"
                  name="map_location"
                  value={formData.map_location}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder="e.g. 123 Main St, Hanoi or 21.0285, 105.8542"
                />
              </div>
            </div>
          </div>
          {/* Submission Feedback */}
          {submitError && <div className="text-xs text-red-500 mt-1">{submitError}</div>}
          {submitSuccess && <div className="text-xs text-green-600 mt-1">{submitSuccess}</div>}
          <button type="submit" className="w-full py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition" disabled={isUploading}>Create Property</button>
        </form>
      </div>
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full flex flex-col items-center border border-cyan-200">
            <div className="text-lg font-bold text-cyan-900 mb-2 text-center">Add Your Phone Number</div>
            <div className="text-cyan-800 text-sm mb-4 text-center">Please add your phone number to your profile before listing a property. This helps buyers contact you safely.</div>
            <Link href="/profile/edit" className="w-full px-4 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition text-center">Edit Profile</Link>
            <button className="mt-4 text-xs text-cyan-700 underline" onClick={() => setShowPhoneModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full flex flex-col items-center border border-cyan-200">
            <div className="text-lg font-bold text-cyan-900 mb-2 text-center">Add Your Email</div>
            <div className="text-cyan-800 text-sm mb-4 text-center">Please add your email to your profile before listing a property. This helps buyers contact you safely.</div>
            <Link href="/profile/edit" className="w-full px-4 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition text-center">Edit Profile</Link>
            <button className="mt-4 text-xs text-cyan-700 underline" onClick={() => setShowEmailModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePropertyPage; 