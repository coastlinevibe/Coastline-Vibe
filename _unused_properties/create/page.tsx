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
  depositRequired: boolean;
  selectedTags: string[];
  imageFiles: string[];
  videoUrl: string;
  amenities: string;
  lifestyleTags: string;
  map_location: string;
  listed_by: 'owner' | 'agent';
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
    depositRequired: false,
    selectedTags: [],
    imageFiles: [],
    videoUrl: '',
    amenities: '',
    lifestyleTags: '',
    map_location: '',
    listed_by: 'owner',
  });
  
  // AI Assistant for description
  const [keywords, setKeywords] = useState<string>('');
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState<boolean>(false);
  
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUploadProgress, setImageUploadProgress] = useState<number[]>([]);
  const [videoFile, setVideoFile] = useState<File[] | null>(null);
  const [videoPreview, setVideoPreview] = useState<string[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  // Add this state for drag-over effect
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [areaUnit, setAreaUnit] = useState<'sqft' | 'sqm'>('sqft');
  const [areaError, setAreaError] = useState<string | null>(null);
  const [mediaTab, setMediaTab] = useState<'image' | 'video'>('image');
  // Add drag state
  const [draggedImageIdx, setDraggedImageIdx] = useState<number | null>(null);
  // Add state for suggestions
  const [amenitySuggestions, setAmenitySuggestions] = useState<string[]>([]);
  const [lifestyleSuggestions, setLifestyleSuggestions] = useState<string[]>([]);
  // Add state for AI modal and detected features
  const [showAIModal, setShowAIModal] = useState(false);
  const [detectedFeatures, setDetectedFeatures] = useState<string[]>([]);

  // Add after keywords state:
  const allKeywordSuggestions = [
    'Lake view', 'Oceanfront', 'Spacious', 'Quiet', 'Modern', 'Fully furnished', 'Scenic', 'Pet friendly', 'Luxury', 'Family-friendly', 'Central', 'Bright', 'Renovated', 'Garden', 'Balcony', 'Pool', 'Gym', 'Secure', 'Cozy', 'Open-plan', 'Mountain view', 'City view', 'Historic', 'Eco-friendly', 'Smart home', 'Parking', 'Fireplace', 'High ceilings', 'Walk-in closet', 'Rooftop', 'Studio', 'Loft', 'Townhouse', 'Bungalow', 'Cottage', 'Duplex', 'Penthouse', 'Condo', 'Land', 'Commercial', 'Vacation', 'Short-term', 'Long-term', 'Shared', 'Sublet', 'Co-living', 'Retreat', 'Active', 'Entertainer', 'Nature', 'Urban', 'Beach', 'Golf', 'Nightlife', 'Artistic', 'Wellness', 'Adventure', 'Community', 'Young professionals', 'Retirees', 'Students', 'Couples', 'Singles'
  ];

  function getSuggestedKeywords(title: string, userKeywords: string): string[] {
    const base = (title + ' ' + userKeywords).toLowerCase();
    // Find up to 6 relevant keywords from the list
    const relevant = allKeywordSuggestions.filter(k => base.includes(k.toLowerCase()));
    // Fill up to 6 with randoms if not enough relevant
    const unique = Array.from(new Set([...relevant, ...allKeywordSuggestions])).slice(0, 6);
    return unique;
  }

  // Function to generate property description
  const generateDescription = () => {
    // Auto-fill keywords if not enough
    const currentKeywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
    if (currentKeywords.length < 3) {
      const suggested = getSuggestedKeywords(formData.title, keywords);
      setKeywords(suggested.join(', '));
    }
    // Context detection
    const base = (formData.title + ' ' + keywords).toLowerCase();
    let context: 'ocean' | 'lake' | 'mountain' | 'urban' | 'city' | 'default' = 'default';
    if (base.includes('ocean') || base.includes('beach') || base.includes('sea') || base.includes('coast')) context = 'ocean';
    else if (base.includes('lake')) context = 'lake';
    else if (base.includes('mountain')) context = 'mountain';
    else if (base.includes('urban') || base.includes('city') || base.includes('central')) context = 'urban';

    // Smarter templates
    const templates: Record<string, string[]> = {
      ocean: [
        "Wake up to breathtaking ocean views in this stunning property. {keywords}. Perfect for those who love the sound of waves and the feel of sea breeze.",
        "Experience coastal living at its finest. {keywords}. Enjoy direct beach access and endless ocean horizons from your new home.",
      ],
      lake: [
        "Enjoy peaceful lakeside living in this beautiful property. {keywords}. Perfect for relaxing weekends and scenic sunsets.",
        "A rare opportunity to own a home by the lake. {keywords}. Ideal for water lovers and nature enthusiasts.",
      ],
      mountain: [
        "Escape to the mountains in this cozy retreat. {keywords}. Surrounded by nature and stunning views.",
        "Breathe in fresh mountain air every day. {keywords}. The perfect getaway for adventure and tranquility.",
      ],
      urban: [
        "Experience vibrant city life in this modern property. {keywords}. Located in the heart of the action, close to everything you need.",
        "Live in style and convenience in this urban oasis. {keywords}. Perfect for professionals and city lovers.",
      ],
      default: [
        "Discover your perfect home. {keywords}. A wonderful blend of comfort, style, and convenience.",
        "This property offers everything you need for modern living. {keywords}. Make it yours today!",
      ],
    };
    const templateList = templates[context] || templates['default'];
    const template = templateList[Math.floor(Math.random() * templateList.length)];
    // Use up to 6 keywords
    const keywordText = (keywords || getSuggestedKeywords(formData.title, keywords).join(', ')).split(',').map(k => k.trim()).filter(Boolean).slice(0, 6).join(', ');
    const description = `${formData.title}. ` + template.replace('{keywords}', keywordText ? `Featuring ${keywordText}` : '');
      setGeneratedDescription(description);
      setIsGeneratingDescription(false);
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
    
    // Check file sizes and types
    const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 5 * 1024 * 1024) {
        setUploadError("Each image must be 5MB or less");
        return;
      }
      if (!acceptedImageTypes.includes(files[i].type)) {
        setUploadError("Unsupported file type");
        return;
      }
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
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 2) {
      setUploadError('You can upload a maximum of 2 videos per property');
      return;
    }
    // Check file types
    const acceptedVideoTypes = [
      'video/mp4',
      'video/quicktime', // MOV
      'video/x-msvideo', // AVI
      'video/webm'
    ];
    for (let i = 0; i < files.length; i++) {
      if (!acceptedVideoTypes.includes(files[i].type)) {
        setUploadError('Unsupported file type');
        return;
      }
    }
    setVideoFile(Array.from(files));
    setVideoPreview(Array.from(files).map(file => URL.createObjectURL(file)));
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
    setPriceError(null);
    setAreaError(null);
    if (!formData.price || Number(formData.price) === 0) {
      setPriceError("Value can't be 0");
      return;
    }
    if (!formData.squareFeet || Number(formData.squareFeet) <= 0) {
      setAreaError('Value must be greater than 0');
      return;
    }
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
        const filePath = `Miami/${Date.now()}-${videoFile[0].name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('propertyvideos')
          .upload(filePath, videoFile[0], { cacheControl: '3600', upsert: false });
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
        community_id: 'e3316cb7-4c7e-437d-9901-0c310ec90a92',
        listed_by: formData.listed_by,
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
  const handleRemoveVideo = (idx: number) => {
    setVideoFile(prev => {
      if (!prev) return null;
      const arr = prev.filter((_, i) => i !== idx);
      return arr.length ? arr : null;
    });
    setVideoPreview(prev => {
      if (!prev) return null;
      const arr = prev.filter((_, i) => i !== idx);
      return arr.length ? arr : null;
    });
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

  // Drag handlers
  const handleDragStart = (idx: number) => setDraggedImageIdx(idx);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDrop = (idx: number) => {
    if (draggedImageIdx === null || draggedImageIdx === idx) return;
    const newPreviews = [...imagePreviews];
    const [draggedPreview] = newPreviews.splice(draggedImageIdx, 1);
    newPreviews.splice(idx, 0, draggedPreview);
    setImagePreviews(newPreviews);
    setFormData(prev => {
      const newFiles = [...prev.imageFiles];
      const [draggedFile] = newFiles.splice(draggedImageIdx, 1);
      newFiles.splice(idx, 0, draggedFile);
      return { ...prev, imageFiles: newFiles };
    });
    setDraggedImageIdx(null);
  };

  // Helper to generate suggestions (simple keyword extraction for demo)
  const generateAmenitySuggestions = () => {
    const base = (formData.title + ' ' + formData.description).toLowerCase();
    const all = [
      'Pool', 'Gym', 'Balcony', 'WiFi', 'Garden', 'Fireplace', 'Cinema', 'Game Room', 'Outdoor Kitchen', 'Braai Area', 'Garage', 'Security', 'Smart Home', 'Sauna', 'Rooftop', 'Playground', 'Tennis Court', 'Spa', 'Bar', 'Wine Cellar', 'Library', 'Home Office', 'Workshop', 'Solar Power', 'EV Charger'
    ];
    // Pick 6 relevant or random
    const filtered = all.filter(a => base.includes(a.toLowerCase()));
    const unique = Array.from(new Set([...filtered, ...all])).slice(0, 6);
    setAmenitySuggestions(unique);
  };
  const generateLifestyleSuggestions = () => {
    const base = (formData.title + ' ' + formData.description).toLowerCase();
    const all = [
      'Family', 'Urban', 'Pet Owners', 'Luxury', 'Entertainer', 'Active', 'Quiet', 'Nature', 'Social', 'Remote Work', 'Retreat', 'Beach', 'Golf', 'Eco-Friendly', 'Nightlife', 'Historic', 'Artistic', 'Wellness', 'Adventure', 'Community', 'Young Professionals', 'Retirees', 'Students', 'Couples', 'Singles'
    ];
    const filtered = all.filter(t => base.includes(t.toLowerCase()));
    const unique = Array.from(new Set([...filtered, ...all])).slice(0, 6);
    setLifestyleSuggestions(unique);
  };

  // Generate on mount and when title/description change
  useEffect(() => {
    generateAmenitySuggestions();
    generateLifestyleSuggestions();
    // eslint-disable-next-line
  }, [formData.title, formData.description]);

  // Helper to add suggestion to input
  const addAmenity = (a: string) => {
    const current = formData.amenities.split(',').map(s => s.trim()).filter(Boolean);
    if (!current.includes(a)) {
      setFormData(prev => ({ ...prev, amenities: current.concat(a).join(', ') }));
    }
  };
  const addLifestyle = (t: string) => {
    const current = formData.lifestyleTags.split(',').map(s => s.trim()).filter(Boolean);
    if (!current.includes(t)) {
      setFormData(prev => ({ ...prev, lifestyleTags: current.concat(t).join(', ') }));
    }
  };

  // Simulate AI assistant
  const handleAISimulate = () => {
    setShowAIModal(true);
    setTimeout(() => {
      // Simulated AI results
      setFormData(prev => ({
        ...prev,
        title: '2-Bed Ocean-View Apartment, Pet-Friendly',
        description: 'Beautiful 2-bedroom, ocean-view unit with modern kitchen, spacious living area, and pet-friendly amenities. Enjoy stunning sunsets from your balcony and relax by the pool. Perfect for families or couples seeking a coastal lifestyle.',
        price: '10500000',
        amenities: 'Ocean View, Pet-Friendly, Pool, Balcony, Modern Kitchen',
      }));
      setDetectedFeatures(['2 Bedrooms', 'Ocean View', 'Pool', 'Pet-Friendly', 'Balcony', 'Modern Kitchen']);
      setShowAIModal(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Create New Listing</h1>
          <a href="/properties" className="text-teal-600 hover:underline text-base flex items-center gap-1">
            <span className="text-xl">&#8592;</span> Back to Properties
          </a>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-bold text-cyan-900 mb-2">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Title <span className="text-red-500">*</span></label>
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
              
              <div>
                <label className="block font-medium mb-1">City <span className="text-red-500">*</span></label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="e.g. Hanoi" />
              </div>
              <div>
                <label className="block font-medium mb-1">Location <span className="text-red-500">*</span></label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border rounded px-2 py-1" required placeholder="Neighborhood or Address" />
                </div>
              <div>
                <label className="block font-medium mb-1 flex items-center gap-2">
                  {areaUnit === 'sqft' ? 'Square Feet' : 'Square Meters'} <span className="text-red-500">*</span>
                  <div className="flex border rounded overflow-hidden ml-2">
                    <button
                      type="button"
                      className={`px-2 py-0.5 text-xs font-semibold ${areaUnit === 'sqft' ? 'bg-teal-500 text-white' : 'bg-white text-teal-500'}`}
                      onClick={() => setAreaUnit('sqft')}
                    >
                      ft²
                    </button>
                    <button
                      type="button"
                      className={`px-2 py-0.5 text-xs font-semibold ${areaUnit === 'sqm' ? 'bg-teal-500 text-white' : 'bg-white text-teal-500'}`}
                      onClick={() => setAreaUnit('sqm')}
                    >
                      m²
                    </button>
                  </div>
                </label>
                <input
                  type="number"
                  name="squareFeet"
                  value={formData.squareFeet}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder={areaUnit === 'sqft' ? 'e.g. 1200' : 'e.g. 110'}
                  />
                {areaError && <div className="text-xs text-red-500 mt-1">{areaError}</div>}
              </div>
            </div>
          </div>
          {/* Property Details */}
          <div>
            <h2 className="text-lg font-bold text-cyan-900 mb-2">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Property Type <span className="text-red-500">*</span></label>
                <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full border rounded px-2 py-1" required>
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
                <label className="block font-medium mb-1">Listing Type <span className="text-red-500">*</span></label>
                <select name="listingType" value={formData.listingType} onChange={handleChange} className="w-full border rounded px-2 py-1" required>
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
                <label className="block font-medium mb-1">Bedrooms <span className="text-red-500">*</span></label>
                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full border rounded px-2 py-1" required />
              </div>
              <div>
                <label className="block font-medium mb-1">Bathrooms <span className="text-red-500">*</span></label>
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full border rounded px-2 py-1" required />
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
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="depositRequired" checked={formData.depositRequired} onChange={handleChange} />
                <label>Deposit Required</label>
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
              <label htmlFor="property-image-upload" className={`cursor-pointer inline-block px-4 py-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 transition mb-2 ${formData.imageFiles.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}>Upload Image</label>
              <div className="text-xs text-gray-500 mb-2">Drag and drop or select up to 10 images. <span className="font-semibold text-cyan-700">{formData.imageFiles.length}/10</span> selected</div>
              <div className="text-xs text-gray-700 mb-2">Accepted image types: <span className="font-semibold">JPG, PNG, GIF, WEBP</span></div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="property-image-upload"
                disabled={isUploading || formData.imageFiles.length >= 10}
              />
              <div className="grid grid-cols-4 gap-2 mt-2">
                {imagePreviews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative group"
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                    style={{ cursor: 'grab' }}
                  >
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
                <label className="block font-medium mb-2">Property Video (optional, max 2)</label>
                <label htmlFor="property-video-upload" className={`cursor-pointer inline-block px-4 py-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 transition mb-2 ${videoFile ? videoFile.length >= 2 ? 'opacity-50 cursor-not-allowed' : '' : ''}`}>Upload Video</label>
                <div className="text-xs text-gray-500 mb-2">Drag and drop or select up to 2 video files. <span className="font-semibold text-cyan-700">{videoFile ? videoFile.length : 0}/2 selected</span></div>
                <div className="text-xs text-gray-700 mb-2">Accepted video types: <span className="font-semibold">MP4, MOV, AVI, WEBM</span></div>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoChange}
                  className="hidden"
                  id="property-video-upload"
                  disabled={isUploading || (videoFile ? videoFile.length >= 2 : false)}
                />
                {videoFile && videoPreview && videoFile.map((file, idx) => (
                  <div key={idx} className="flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 text-sm text-cyan-900 font-medium">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"/></svg>
                      <span>{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                      <button type="button" onClick={() => handleRemoveVideo(idx)} className="ml-2 bg-white/80 rounded-full p-1 text-red-500 border border-red-200 hover:bg-red-50">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <video src={videoPreview[idx]} controls className="w-full h-40 object-cover rounded border mt-2" />
                  </div>
                ))}
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {amenitySuggestions.map(a => (
                    <button
                      key={a}
                      type="button"
                      className="px-2 py-1 rounded bg-cyan-100 text-cyan-700 text-xs font-medium hover:bg-cyan-200 transition"
                      onClick={() => addAmenity(a)}
                    >
                      {a}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="ml-2 px-2 py-1 rounded bg-cyan-200 text-cyan-900 text-xs font-medium hover:bg-cyan-300 transition"
                    onClick={generateAmenitySuggestions}
                  >
                    Regenerate
                  </button>
                </div>
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {lifestyleSuggestions.map(t => (
                    <button
                      key={t}
                      type="button"
                      className="px-2 py-1 rounded bg-sky-100 text-sky-700 text-xs font-medium hover:bg-sky-200 transition"
                      onClick={() => addLifestyle(t)}
                    >
                      {t}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="ml-2 px-2 py-1 rounded bg-sky-200 text-sky-900 text-xs font-medium hover:bg-sky-300 transition"
                    onClick={generateLifestyleSuggestions}
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Map Location <span className="text-red-500">*</span><span className="text-xs text-gray-500"> (address or coordinates)</span></label>
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
          <div className="mt-4">
            <label className="block font-medium mb-1">Description <span className="text-red-500">*</span></label>
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
          <div className="mt-4">
            <label className="block font-medium mb-1">AI Description Assistant</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1 rounded bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition"
                onClick={handleAISimulate}
              >
                AI description assistant
              </button>
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
          <button type="submit" className="w-full bg-teal-500 text-white font-semibold py-2 px-4 rounded hover:bg-teal-600 transition" disabled={isUploading}>Create New Listing</button>
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
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full flex flex-col items-center border border-cyan-200">
            <div className="flex items-center gap-2 mb-4">
              <svg className="animate-spin h-6 w-6 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-cyan-900 font-semibold text-lg">Analyzing your photos and details…</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePropertyPage; 