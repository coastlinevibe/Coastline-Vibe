"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import VisionChat from '../../../components/VisionChat';

const categories = ['Electronics', 'Sports', 'Furniture', 'Fashion'];
const conditions = ['New', 'Like New', 'Good', 'Used'];

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MarketCreatePage() {
  const router = useRouter();
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
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  // AI Assistant states
  const [keywords, setKeywords] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  // Add a new state for the main image
  const [mainImage, setMainImage] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length + imagePreviews.length > 10) {
      setUploadError('You can upload a maximum of 10 images');
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
    if (formData.videoFile) {
      setUploadError('You can only upload one video');
      return;
    }
    setUploadError(null);
    setFormData((prev) => ({ ...prev, videoFile: file, videoPreview: URL.createObjectURL(file) }));
  };

  const handleRemoveVideo = () => {
    setFormData((prev) => ({ ...prev, videoFile: null, videoPreview: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError(null);

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUploadError('You must be logged in to create a market item');
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

      // Upload images to Supabase Storage
      const uploadedImageUrls: string[] = [];
      for (const file of formData.imageFiles) {
        if (file instanceof File) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const { data: imageData, error: imageError } = await supabase.storage
            .from('itemimages')
            .upload(`Miami/${fileName}`, file);

          if (imageError) throw imageError;
          
          const { data: { publicUrl: imageUrl } } = supabase.storage
            .from('itemimages')
            .getPublicUrl(`Miami/${fileName}`);
            
          uploadedImageUrls.push(imageUrl);
        }
      }

      // Upload video if exists
      let videoUrl = null;
      if (formData.videoFile) {
        const fileExt = formData.videoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: videoData, error: videoError } = await supabase.storage
          .from('itemvideos')
          .upload(`Miami/${fileName}`, formData.videoFile);

        if (videoError) throw videoError;

        const { data: { publicUrl } } = supabase.storage
          .from('itemvideos')
          .getPublicUrl(`Miami/${fileName}`);
          
        videoUrl = publicUrl;
      }

      // Use first uploaded image as main image
      // const mainImage = uploadedImageUrls[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
      
      // Create the new item
      const newItem = {
        title: formData.title,
        price: parseInt(formData.price),
        category: formData.category,
        condition: formData.condition,
        location: formData.location,
        tags: formData.tags.split(',').map(tag => tag.trim()),
        description: formData.description,
        imagefiles: uploadedImageUrls,
        videourl: videoUrl,
        user_id: userId,
        approval_status: 'pending',
        community_id: 'e3316cb7-4c7e-437d-9901-0c310ec90a92'
      };

      // Save to Supabase
      const { error: insertError } = await supabase.from('market_items').insert([newItem]);
      if (insertError) {
        console.error('Supabase insert error:', insertError);
        setUploadError(insertError.message);
        setIsUploading(false);
        return;
      }

      setSubmitSuccess('Item created successfully! Pending admin approval.');
      setTimeout(() => {
        router.push('/market');
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to create item. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // AI Description generator for market items (client-side, template-based)
  const generateDescription = () => {
    setIsGeneratingDescription(true);
    // Use title, category, condition, and keywords
    const { title, category, condition } = formData;
    const keywordText = keywords.trim() ? `Featuring ${keywords}` : '';
    const base = title ? `${title}: ` : '';
    const cat = category ? `Category: ${category}. ` : '';
    const cond = condition ? `Condition: ${condition}. ` : '';
    const descTemplates = [
      `${base}${cat}${cond}{keywords}A great find for anyone looking for quality and value!`,
      `${base}This item is in {condition} condition. {cat}{keywords}Don't miss out on this opportunity!`,
      `${base}{cat}{cond}{keywords}Ready for a new owner!`,
    ];
    const template = descTemplates[Math.floor(Math.random() * descTemplates.length)];
    const desc = template
      .replace('{keywords}', keywordText ? keywordText + '. ' : '')
      .replace('{cat}', cat)
      .replace('{cond}', cond)
      .replace('{condition}', condition);
    setTimeout(() => {
      setGeneratedDescription(desc);
      setFormData(prev => ({ ...prev, description: desc }));
      setIsGeneratingDescription(false);
    }, 800);
  };
  const useGeneratedDescription = () => {
    if (generatedDescription) {
      setFormData(prev => ({ ...prev, description: generatedDescription }));
    }
  };

  // 2. Auto-generate description when all required fields are filled
  // useEffect(() => {
  //   if (mainImage && formData.title && formData.category && formData.condition) {
  //     // Build prompt
  //     let prompt = `Generate a detailed, appealing description for a marketplace item. Title: ${formData.title}. Category: ${formData.category}. Condition: ${formData.condition}.`;
  //     if (keywords.trim()) prompt += ` Keywords: ${keywords}`;
  //     // Call Vision API
  //     const fetchDescription = async () => {
  //       setIsGeneratingDescription(true);
  //       setGeneratedDescription('');
  //       setUploadError(null);
  //       try {
  //         const formDataObj = new FormData();
  //         formDataObj.append('image', mainImage);
  //         const res = await fetch('/api/vision-chat', {
  //           method: 'POST',
  //           body: formDataObj,
  //         });
  //         const data = await res.json();
  //         if (data.reply) {
  //           setGeneratedDescription(data.reply);
  //           setFormData(prev => ({ ...prev, description: data.reply }));
  //         } else {
  //           setUploadError(data.error || 'No description generated');
  //         }
  //       } catch (err: any) {
  //         setUploadError(err.message);
  //       } finally {
  //         setIsGeneratingDescription(false);
  //       }
  //     };
  //     fetchDescription();
  //   }
  // }, [mainImage, formData.title, formData.category, formData.condition, keywords]);

  // 3. Add main image to gallery as first image
  useEffect(() => {
    if (mainImage) {
      setImagePreviews(prev => [URL.createObjectURL(mainImage), ...prev.filter((_, i) => i !== 0)]);
      setFormData(prev => ({ ...prev, imageFiles: [mainImage, ...prev.imageFiles.filter((_, i) => i !== 0)] }));
    }
  }, [mainImage]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Create Market Item</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Top row: Title, main image, Category, Condition */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block font-medium mb-1">Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                required
                placeholder="e.g. Pearl White Throne"
              />
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">Main Image (required) <span className="text-red-500">*</span></label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setMainImage(e.target.files[0]);
                  }
                }}
                className="w-full border rounded px-2 py-1"
                required
              />
              {mainImage && (
                <div className="mt-2">
                  <img src={URL.createObjectURL(mainImage)} alt="Main preview" className="w-20 h-20 object-cover rounded" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">Category <span className="text-red-500">*</span></label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">Condition <span className="text-red-500">*</span></label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                required
              >
                {conditions.map((cond) => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Description with AI Assistant */}
          <div className="bg-cyan-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-700">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                <path d="M13 7H11V13H17V11H13V7Z" fill="currentColor"/>
              </svg>
              <h3 className="text-sm font-bold text-cyan-900">AI Description Assistant</h3>
            </div>
            <div className="text-xs text-cyan-800 mb-2">Enter 3 keywords about your item:</div>
            <div className="mb-3 flex gap-2 items-center">
              <input
                type="text"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-sm"
                placeholder="e.g. durable, stylish, lightweight"
              />
              <button
                type="button"
                onClick={generateDescription}
                disabled={isGeneratingDescription || !(formData.title && formData.category && formData.condition)}
                className="px-4 py-1 bg-teal-500 text-white rounded text-sm hover:bg-teal-600 transition shadow-sm"
              >
                {isGeneratingDescription ? 'Generating...' : 'Generate'}
              </button>
              {!mainImage && <div className="text-xs text-yellow-600 ml-2">(Image is optional for this test)</div>}
            </div>
            {generatedDescription && (
              <div className="mt-2">
                <div className="text-xs font-medium text-cyan-800 mb-1">Generated description:</div>
                <div className="bg-white p-3 rounded border border-cyan-200 text-sm mb-2 shadow-sm">{generatedDescription}</div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, description: generatedDescription }))}
                  className="px-4 py-1.5 bg-teal-100 text-teal-700 rounded text-xs font-medium hover:bg-teal-200 transition flex items-center gap-1"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  Use this description
                </button>
              </div>
            )}
            <label className="block font-medium mb-1 mt-4">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 whitespace-pre-line"
              required
              placeholder="Add keywords above to generate a description, or write your own description here..."
              rows={5}
            />
            {uploadError && <div className="text-xs text-red-500 mt-1">{uploadError}</div>}
          </div>
          {/* 2. Auto-generate description when all required fields are filled */}
          {/* 3. Rest of the fields */}
          <div>
            <label className="block font-medium mb-1">Price</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
              placeholder="$ USD"
              min={0}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
              placeholder="e.g. Miami"
            />
          </div>
          {/* Restored: Full Image Upload Section */}
          <div>
            <h2 className="text-lg font-bold text-cyan-900 mb-2">Images (Full Gallery)</h2>
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
              <label className="block font-medium mb-2">Item Images (max 10)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="market-image-upload"
                disabled={isUploading || formData.imageFiles.length >= 10}
              />
              <label htmlFor="market-image-upload" className={`cursor-pointer inline-block px-4 py-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 transition mb-2 ${formData.imageFiles.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}>Select Images</label>
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
          </div>
          {/* Restored: Video Upload Section */}
          <div className="mt-6">
            <h2 className="text-lg font-bold text-cyan-900 mb-2">Item Video (optional, max 1)</h2>
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
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
                id="market-video-upload"
                disabled={isUploading || !!formData.videoFile}
              />
              <label htmlFor="market-video-upload" className={`cursor-pointer inline-block px-4 py-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 transition mb-2 ${formData.videoFile ? 'opacity-50 cursor-not-allowed' : ''}`}>Select Video</label>
              <div className="text-xs text-gray-500 mb-2">Drag and drop or select a video file. <span className="font-semibold text-cyan-700">{formData.videoFile ? '1/1 selected' : '0/1 selected'}</span></div>
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
          <button
            type="submit"
            className="w-full py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 font-semibold mt-4"
            disabled={isUploading}
          >
            {isUploading ? 'Submitting...' : 'Create Item'}
          </button>
          {uploadError && <div className="text-red-600 mt-2 text-sm">{uploadError}</div>}
          {submitSuccess && <div className="text-green-600 mt-2 text-sm">{submitSuccess}</div>}
        </form>
      </div>
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full flex flex-col items-center border border-cyan-200">
            <div className="text-lg font-bold text-cyan-900 mb-2 text-center">Add Your Phone Number</div>
            <div className="text-cyan-800 text-sm mb-4 text-center">Please add your phone number to your profile before listing an item. This helps buyers contact you safely.</div>
            <Link href="/profile/edit" className="w-full px-4 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition text-center">Edit Profile</Link>
            <button className="mt-4 text-xs text-cyan-700 underline" onClick={() => setShowPhoneModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full flex flex-col items-center border border-cyan-200">
            <div className="text-lg font-bold text-cyan-900 mb-2 text-center">Add Your Email</div>
            <div className="text-cyan-800 text-sm mb-4 text-center">Please add your email to your profile before listing an item. This helps buyers contact you safely.</div>
            <Link href="/profile/edit" className="w-full px-4 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition text-center">Edit Profile</Link>
            <button className="mt-4 text-xs text-cyan-700 underline" onClick={() => setShowEmailModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
} 