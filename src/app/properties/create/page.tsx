"use client";
import React, { useState, useEffect } from 'react';
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
  
  // AI Assistant for description
  const [keywords, setKeywords] = useState<string>('');
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState<boolean>(false);
  
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

  // Function to generate property description
  const generateDescription = () => {
    if (!formData.title) {
      // If no title, continue but log a message
      console.log("No title provided, using generic description");
    }
    
    setIsGeneratingDescription(true);
    console.log("Generating description for property type:", formData.propertyType);
    console.log("Keywords:", keywords);
    
    // Sample descriptions based on property type and keywords
    const propertyTypeTemplates: {[key: string]: string[]} = {
      'Apartment': [
        "This stylish apartment offers a perfect blend of comfort and convenience. {keywords}. Ideal for those seeking a modern living space in a vibrant neighborhood.",
        "Experience urban living at its finest in this thoughtfully designed apartment. {keywords}. A perfect place to call home in the heart of the city.",
        "Welcome to this exceptional apartment that combines style with functionality. {keywords}. An ideal choice for urban dwellers looking for quality living."
      ],
      'House': [
        "This charming house provides a warm and inviting atmosphere for family living. {keywords}. Perfect for those seeking a comfortable home with character.",
        "Discover the perfect family home in this well-maintained house. {keywords}. Offering the ideal balance of comfort and style for modern living.",
        "This beautiful house offers spacious living in a desirable location. {keywords}. A rare opportunity to own a distinctive property in this sought-after area."
      ],
      'Studio': [
        "This contemporary studio apartment offers efficient living in a prime location. {keywords}. Perfect for professionals or students seeking a modern, low-maintenance home.",
        "Compact yet thoughtfully designed, this studio apartment maximizes every inch of space. {keywords}. Ideal for those seeking a streamlined lifestyle without compromising on quality.",
        "This stylish studio provides the perfect urban retreat. {keywords}. A smart investment for those seeking convenience and comfort in a central location."
      ],
      'Townhouse': [
        "This elegant townhouse combines the convenience of apartment living with the space of a house. {keywords}. Perfect for those seeking a low-maintenance lifestyle without compromising on space.",
        "Experience modern living in this well-designed townhouse. {keywords}. Offering the perfect balance of privacy and community in a desirable location.",
        "This spacious townhouse provides an ideal living environment for families or professionals. {keywords}. A perfect blend of style, comfort, and convenience."
      ],
      'Other': [
        "This unique property offers distinctive features rarely found on the market. {keywords}. A special opportunity for those seeking something truly different.",
        "Discover the exceptional qualities of this outstanding property. {keywords}. Perfect for those with discerning taste looking for something special.",
        "This remarkable property stands out with its unique character and appeal. {keywords}. An exciting opportunity to secure a one-of-a-kind living space."
      ]
    };
    
    // Choose a random template for the property type
    const propertyType = formData.propertyType;
    const templates = propertyTypeTemplates[propertyType] || propertyTypeTemplates['Other'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Process keywords
    let keywordText = "";
    if (keywords.trim()) {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      if (keywordArray.length > 0) {
        keywordText = `Featuring ${keywordArray.join(', ')}`;
      }
    }
    
    // Generate description by replacing placeholders
    let description = template.replace('{keywords}', keywordText || "Featuring all the amenities you need for comfortable living");
    
    // Add title-based content
    if (formData.title) {
      description = `${formData.title}: ${description}`;
    }
    
    console.log("Generated description:", description);
    
    // Simulate a delay for a more realistic "AI" generation experience
    setTimeout(() => {
      setGeneratedDescription(description);
      setIsGeneratingDescription(false);
    }, 1000);
  };
  
  // Use generated description
  const useGeneratedDescription = () => {
    if (generatedDescription) {
      console.log("Using generated description:", generatedDescription);
      setFormData(prev => ({ ...prev, description: generatedDescription }));
    } else {
      console.log("No description to use");
    }
  };

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
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  className="w-full border rounded px-2 py-1" 
                  required 
                  placeholder="e.g. Lake-View 2 Bedroom Apartment" 
                />
              </div>
              
              {/* AI Description Assistant */}
              <div className="border border-cyan-100 rounded-lg p-4 bg-cyan-50">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-700">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                    <path d="M13 7H11V13H17V11H13V7Z" fill="currentColor"/>
                  </svg>
                  <h3 className="text-sm font-bold text-cyan-900">AI Description Assistant</h3>
                </div>
                
                <div className="mb-3">
                  <label className="block text-xs font-medium text-cyan-800 mb-1">Enter 3 keywords about your property:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      placeholder="e.g. quiet, spacious, fully furnished"
                    />
                    <button
                      type="button"
                      onClick={generateDescription}
                      disabled={isGeneratingDescription}
                      className="px-4 py-1 bg-teal-500 text-white rounded text-sm hover:bg-teal-600 transition shadow-sm"
                    >
                      {isGeneratingDescription ? (
                        <div className="flex items-center gap-1">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </div>
                      ) : (
                        'Generate'
                      )}
                    </button>
                  </div>
                </div>
                
                {generatedDescription && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-cyan-800 mb-1">Generated description:</div>
                    <div className="bg-white p-3 rounded border border-cyan-200 text-sm mb-2 shadow-sm">
                      {generatedDescription}
                    </div>
                    <button
                      type="button"
                      onClick={useGeneratedDescription}
                      className="px-4 py-1.5 bg-teal-100 text-teal-700 rounded text-xs font-medium hover:bg-teal-200 transition flex items-center gap-1"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Use this description
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 whitespace-pre-line"
                  required
                  placeholder="Add 3 keywords (e.g. quiet, spacious, fully furnished) above to generate a description, or write your own description here..."
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