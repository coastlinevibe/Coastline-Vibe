import React, { useState } from 'react';
// Import Lucide icons for social media
import { Globe, Mail, Phone, Facebook, Twitter, Linkedin } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

const TABS = [
  'Basic',
  'Amenities',
  'Facilities',
  'Location',
  'Media',
  'SEO',
  'Schedule',
  'Contact',
  'Type',
  'Finish',
];

// Define the form state type
interface BusinessFormState {
  // Basic
  title: string;
  description: string;
  category: string;
  subCategory: string;
  featuredType: string;
  // Amenities
  amenities: string[];
  // Facilities
  facilities: string[];
  facility_hours: {
    [key: string]: {
      open: string;
      close: string;
      days: string;
    };
  };
  // Location
  country: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  // Media
  thumbnail: File | null;
  cover: File | null;
  videoProvider: string;
  videoUrl: string;
  gallery: File[];
  // SEO
  tags: string[];
  metaTags: string[];
  // Schedule
  schedule: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  // Contact
  website: string;
  email: string;
  phone: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  // Type
  businessTypes: string[];
  menuName: string;
  menuPrice: string;
  menuItems: string[];
  menuImage: File | null;
}

// Add the props interface
interface BusinessMultiStepFormProps {
  mode: 'create' | 'edit';
  businessId?: string;
  initialData?: BusinessFormState;
  onComplete: (businessId: string) => void;
}

export default function BusinessMultiStepForm({ 
  mode = 'create', 
  businessId,
  initialData,
  onComplete 
}: BusinessMultiStepFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState<BusinessFormState>(initialData || {
    // Basic
    title: '',
    description: '',
    category: '',
    subCategory: '',
    featuredType: '',
    // Amenities
    amenities: [],
    // Facilities
    facilities: [],
    facility_hours: {},
    // Location
    country: '',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    // Media
    thumbnail: null,
    cover: null,
    videoProvider: '',
    videoUrl: '',
    gallery: [],
    // SEO
    tags: [],
    metaTags: [],
    // Schedule
    schedule: {
      monday: { open: '', close: '' },
      tuesday: { open: '', close: '' },
      wednesday: { open: '', close: '' },
      thursday: { open: '', close: '' },
      friday: { open: '', close: '' },
      saturday: { open: '', close: '' },
      sunday: { open: '', close: '' },
    },
    // Contact
    website: '',
    email: '',
    phone: '',
    facebook: '',
    twitter: '',
    linkedin: '',
    // Type
    businessTypes: [],
    menuName: '',
    menuPrice: '',
    menuItems: [],
    menuImage: null,
  });

  // Updated category options to match the database
  const categories = [
    { value: 'accommodations', label: 'Accommodations' },
    { value: 'dining-cafes', label: 'Dining & Cafés' },
    { value: 'tours-activities', label: 'Tours & Activities' },
    { value: 'shopping-retail', label: 'Shopping & Retail' },
    { value: 'health-wellness', label: 'Health & Wellness' },
    { value: 'beauty-personal-care', label: 'Beauty & Personal Care' },
    { value: 'home-services-repairs', label: 'Home Services & Repairs' },
    { value: 'professional-services', label: 'Professional Services' },
    { value: 'kids-education-family', label: 'Kids, Education & Family' },
    { value: 'pets-animals', label: 'Pets & Animals' },
    { value: 'transport-travel', label: 'Transport & Travel' },
    { value: 'arts-culture-events', label: 'Arts, Culture & Events' },
    { value: 'outdoors-recreation', label: 'Outdoors & Recreation' },
    { value: 'community-nonprofits', label: 'Community & Non-Profits' }
  ];

  // Updated subcategories mapping to match the database
  const subCategoriesMap: Record<string, {value: string, label: string}[]> = {
    'accommodations': [
      { value: 'hotels', label: 'Hotels' },
      { value: 'boutique-beachfront', label: 'Boutique & Boutique Beachfront' },
      { value: 'hostels-guesthouses', label: 'Hostels & Guesthouses' },
      { value: 'vacation-rentals', label: 'Vacation Rentals & Cottages' },
      { value: 'bed-breakfast', label: 'Bed & Breakfasts' },
      { value: 'homestays-farmstays', label: 'Homestays & Farmstays' }
    ],
    'dining-cafes': [
      { value: 'seafood', label: 'Seafood Restaurants' },
      { value: 'beach-bars', label: 'Beach Bars & Cafés' },
      { value: 'fine-dining', label: 'Fine Dining' },
      { value: 'casual-family', label: 'Casual & Family Restaurants' },
      { value: 'bakeries-coffee', label: 'Bakeries & Coffee Shops' },
      { value: 'food-trucks', label: 'Food Trucks & Pop-Ups' }
    ],
    'tours-activities': [
      { value: 'boat-rentals', label: 'Boat Rentals & Charters' },
      { value: 'fishing-charters', label: 'Fishing Charters' },
      { value: 'whale-dolphin', label: 'Whale & Dolphin Watching' },
      { value: 'kayak-paddle-surf', label: 'Kayak, Paddleboard & Surf Rentals' },
      { value: 'snorkeling-scuba', label: 'Snorkeling & Scuba Diving' },
      { value: 'scenic-cruises', label: 'Scenic & Sunset Cruises' },
      { value: 'lighthouse-tours', label: 'Lighthouse & Heritage Tours' },
      { value: 'beach-walks', label: 'Beach Walks & Coastal Hikes' },
      { value: 'bike-tours', label: 'Bike Rentals & Tours' },
      { value: 'golf', label: 'Golf Courses & Driving Ranges' }
    ],
    'shopping-retail': [
      { value: 'boutiques-fashion', label: 'Boutiques & Fashion' },
      { value: 'souvenir-gifts', label: 'Souvenir & Gift Shops' },
      { value: 'grocery-convenience', label: 'Grocery & Convenience' },
      { value: 'specialty-foods', label: 'Specialty Foods & Delis' },
      { value: 'surf-watersports', label: 'Surf & Watersports Gear' },
      { value: 'artisanal-markets', label: 'Artisanal Markets' }
    ],
    'health-wellness': [
      { value: 'spas-centers', label: 'Spas & Wellness Centers' },
      { value: 'yoga-pilates', label: 'Yoga, Pilates & Meditation' },
      { value: 'gyms-fitness', label: 'Gyms & Fitness Studios' },
      { value: 'clinics-urgent', label: 'Clinics & Urgent Care' },
      { value: 'pharmacies', label: 'Pharmacies' }
    ],
    'beauty-personal-care': [
      { value: 'hair-salons', label: 'Hair Salons & Barbershops' },
      { value: 'nail-brow', label: 'Nail & Brow Studios' },
      { value: 'tattoo-piercing', label: 'Tattoo & Piercing' },
      { value: 'makeup-skin', label: 'Makeup & Skin Therapists' },
      { value: 'massage-physio', label: 'Massage & Physiotherapy' }
    ],
    'home-services-repairs': [
      { value: 'plumbing', label: 'Plumbing' },
      { value: 'electrical', label: 'Electrical' },
      { value: 'handyman-renovations', label: 'Handyman & Renovations' },
      { value: 'landscaping-garden', label: 'Landscaping & Garden Care' },
      { value: 'cleaning-services', label: 'Cleaning Services' }
    ],
    'professional-services': [
      { value: 'real-estate', label: 'Real Estate & Property Management' },
      { value: 'accounting-legal', label: 'Accounting & Legal' },
      { value: 'marketing-design', label: 'Marketing, Web & Graphic Design' },
      { value: 'architecture-interior', label: 'Architecture & Interior Design' },
      { value: 'consulting-coaching', label: 'Consulting & Business Coaching' }
    ],
    'kids-education-family': [
      { value: 'daycares-preschools', label: 'Daycares & Preschools' },
      { value: 'after-school', label: 'After-School & Tutoring' },
      { value: 'music-art-language', label: 'Music, Art & Language Schools' },
      { value: 'adventure-camps', label: 'Adventure Camps & Workshops' }
    ],
    'pets-animals': [
      { value: 'veterinary', label: 'Veterinary Services' },
      { value: 'grooming-boarding', label: 'Pet Grooming & Boarding' },
      { value: 'sitting-training', label: 'Pet Sitting & Training' },
      { value: 'pet-supplies', label: 'Pet Supply Stores' }
    ],
    'transport-travel': [
      { value: 'car-scooter', label: 'Car & Scooter Rentals' },
      { value: 'taxi-shuttle', label: 'Taxi, Shuttle & Airport Transfers' },
      { value: 'ferry-water-taxi', label: 'Ferry & Water Taxi Services' },
      { value: 'bike-ebike', label: 'Bike & E-Bike Rentals' }
    ],
    'arts-culture-events': [
      { value: 'art-galleries', label: 'Art Galleries & Studios' },
      { value: 'live-music', label: 'Live Music & Venues' },
      { value: 'theaters-cinemas', label: 'Theaters & Cinemas' },
      { value: 'museums-cultural', label: 'Museums & Cultural Centers' },
      { value: 'event-planners', label: 'Event Planners & Caterers' }
    ],
    'outdoors-recreation': [
      { value: 'beaches-access', label: 'Beaches & Public Access' },
      { value: 'parks-lookouts', label: 'Parks, Lookouts & Picnic Spots' },
      { value: 'marinas-boat', label: 'Marinas & Boat Services' },
      { value: 'fishing-tackle', label: 'Fishing Spots & Tackle Shops' },
      { value: 'watersport-schools', label: 'Water-Sport Schools' }
    ],
    'community-nonprofits': [
      { value: 'community-centers', label: 'Community Centers' },
      { value: 'volunteer-groups', label: 'Volunteer & "Good Vibes" Groups' },
      { value: 'farmers-markets', label: 'Farmers\' Markets & Local Food Hubs' },
      { value: 'clubs-associations', label: 'Clubs & Associations' }
    ]
  };

  // Get subcategories based on selected category
  const getSubCategories = () => {
    return form.category ? (subCategoriesMap[form.category] || []) : [];
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to submit a business listing");
        return;
      }

      // Get URL parameters to extract current community
      const params = new URLSearchParams(window.location.search);
      const pathParts = window.location.pathname.split('/');
      const communitySlug = pathParts.find(part => part !== '' && part !== 'community' && !part.includes('business'));
      
      // Get the actual community UUID based on the slug
      let communityId;
      if (communitySlug) {
        const { data: communityData } = await supabase
          .from('communities')
          .select('id')
          .eq('slug', communitySlug)
          .single();
          
        if (communityData) {
          communityId = communityData.id;
        }
      }
      
      if (!communityId) {
        // Fallback - get user's default community from profile
        const { data: profileData, error: profileFetchError } = await supabase
          .from('profiles')
          .select('community_id')
          .eq('id', user.id)
          .single();

        if (profileFetchError) {
          console.error("Error fetching profile:", profileFetchError);
          setError("Failed to fetch user profile. Please try again.");
          return;
        }
        
        communityId = profileData.community_id;
      }
      
      if (!communityId) {
        setError("Could not determine which community this business belongs to.");
        return;
      }

      // Now update the profile to have business role and pending approval
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'business',
          is_approved: false
        })
        .eq('id', user.id);

      if (profileUpdateError) {
        console.error("Error updating profile:", profileUpdateError);
        setError("Failed to update user profile. Please try again.");
        return;
      }

      // Basic validation
      if (!form.title || !form.description || !form.category || !form.subCategory) {
        setError("Please fill in all required fields in the Basic Info section");
        setStep(0); // Go back to the first step
        return;
      }

      // Location validation
      if (!form.country || !form.city || !form.address) {
        setError("Please fill in all required location fields");
        setStep(2); // Go to location step
        return;
      }

      // Contact validation
      if (!form.email || !form.phone) {
        setError("Please provide at least email and phone contact information");
        setStep(6); // Go to contact step
        return;
      }

      // First, update the user's profile to have a business role and pending approval status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'business',
          is_approved: false
        })
        .eq('id', user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        setError("Failed to update user profile. Please try again.");
        return;
      }

      // Get category and subcategory IDs from the database
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categories.find(c => c.value === form.category)?.label)
        .single();

      if (categoryError || !categoryData) {
        setError("Error finding category. Please try again.");
        return;
      }

      const { data: subcategoryData, error: subcategoryError } = await supabase
        .from('subcategories')
        .select('id')
        .eq('category_id', categoryData.id)
        .eq('name', subCategoriesMap[form.category]?.find(s => s.value === form.subCategory)?.label)
        .single();

      if (subcategoryError || !subcategoryData) {
        setError("Error finding subcategory. Please try again.");
        return;
      }

      // Prepare business data
      const businessData: Record<string, any> = {
        name: form.title,
          description: form.description,
          category_id: categoryData.id,
          subcategory_id: subcategoryData.id,
        featured_type: form.featuredType || null,
          amenities: form.amenities,
        facilities: form.facilities,
        facility_hours: form.facility_hours,
        address: form.address,
        city: form.city,
        country: form.country,
        location_lat: form.latitude ? parseFloat(form.latitude) : null,
        location_lng: form.longitude ? parseFloat(form.longitude) : null,
        contact_email: form.email,
        contact_phone: form.phone,
        website: form.website || null,
        social_facebook: form.facebook || null,
        social_twitter: form.twitter || null,
        social_linkedin: form.linkedin || null,
          business_types: form.businessTypes,
        menu_name: form.menuName || null,
        menu_price: form.menuPrice || null,
          menu_items: form.menuItems,
        schedule: form.schedule,
        tags: form.tags,
        meta_tags: form.metaTags,
        video_provider: form.videoProvider || null,
        video_url: form.videoUrl || null,
        owner_id: user.id,
        community_id: communityId,
        status: 'pending',
        is_approved: false
      };

      // Add created_at only for new businesses
      if (mode === 'create') {
        businessData.created_at = new Date().toISOString();
      }

      let business;
      
      if (mode === 'create') {
        // Create business record
        const { data: newBusiness, error: businessError } = await supabase
          .from('businesses')
          .insert(businessData)
        .select()
        .single();

      if (businessError) {
        setError(businessError.message);
        return;
        }
        
        business = newBusiness;
      } else {
        // Update existing business
        const { data: updatedBusiness, error: businessError } = await supabase
          .from('businesses')
          .update(businessData)
          .eq('id', businessId)
          .select()
          .single();

        if (businessError) {
          setError(businessError.message);
          return;
        }
        
        business = updatedBusiness;
      }

      // Handle file uploads if needed
      if (form.thumbnail) {
        console.log("Uploading thumbnail to business-uploads bucket");
        const thumbnailPath = `businesses/${business.id}/thumbnail`;
        const { error: thumbnailError } = await supabase.storage
          .from('business-uploads')
          .upload(thumbnailPath, form.thumbnail, { upsert: true });
        
        if (thumbnailError) {
          console.error("Error uploading thumbnail:", thumbnailError);
        } else {
          console.log("Thumbnail uploaded successfully");
          // Get the public URL for the thumbnail
          const { data: thumbnailData } = supabase.storage
            .from('business-uploads')
            .getPublicUrl(thumbnailPath);
            
          console.log("Thumbnail public URL:", thumbnailData.publicUrl);
          // Update business record with thumbnail URL
          await supabase
            .from('businesses')
            .update({ thumbnail_url: thumbnailData.publicUrl })
            .eq('id', business.id);
        }
      }

      // Handle cover image upload
      if (form.cover) {
        const coverPath = `businesses/${business.id}/cover`;
        const { error: coverError } = await supabase.storage
          .from('business-uploads')
          .upload(coverPath, form.cover, { upsert: true });
        
        if (coverError) {
          console.error("Error uploading cover image:", coverError);
        } else {
          // Get the public URL for the cover image
          const { data: coverData } = supabase.storage
            .from('business-uploads')
            .getPublicUrl(coverPath);
            
          // Update business record with cover URL
          await supabase
            .from('businesses')
            .update({ cover_url: coverData.publicUrl })
            .eq('id', business.id);
        }
      }

      // Handle gallery images upload
      if (form.gallery && form.gallery.length > 0) {
        console.log(`Uploading ${form.gallery.length} gallery images to business-uploads bucket`);
        const galleryUrls: string[] = [];
        
        for (let i = 0; i < form.gallery.length; i++) {
          try {
          const galleryPath = `businesses/${business.id}/gallery/${i}`;
            console.log(`Uploading gallery image ${i} to path: ${galleryPath}`);
            
          const { error: galleryError } = await supabase.storage
              .from('business-uploads')
              .upload(galleryPath, form.gallery[i], { upsert: true });
          
          if (galleryError) {
            console.error(`Error uploading gallery image ${i}:`, galleryError);
          } else {
              console.log(`Gallery image ${i} uploaded successfully`);
            // Get the public URL for the gallery image
            const { data: galleryData } = supabase.storage
                .from('business-uploads')
              .getPublicUrl(galleryPath);
              
              console.log(`Gallery image ${i} public URL:`, galleryData.publicUrl);
            galleryUrls.push(galleryData.publicUrl);
            }
          } catch (err) {
            console.error(`Error processing gallery image ${i}:`, err);
          }
        }
        
        if (galleryUrls.length > 0) {
          console.log(`Updating business record with ${galleryUrls.length} gallery URLs:`, galleryUrls);
          // Update business record with gallery URLs
          try {
            const { error: updateError } = await supabase
            .from('businesses')
            .update({ gallery_urls: galleryUrls })
            .eq('id', business.id);
              
            if (updateError) {
              console.error("Error updating business with gallery URLs:", updateError);
            } else {
              console.log("Business updated with gallery URLs successfully");
            }
          } catch (err) {
            console.error("Error updating business with gallery URLs:", err);
          }
        }
      }

      // Handle menu image upload
      if (form.menuImage) {
        const menuImagePath = `businesses/${business.id}/menu`;
        const { error: menuImageError } = await supabase.storage
          .from('business-uploads')
          .upload(menuImagePath, form.menuImage, { upsert: true });
        
        if (menuImageError) {
          console.error("Error uploading menu image:", menuImageError);
        } else {
          // Get the public URL for the menu image
          const { data: menuImageData } = supabase.storage
            .from('business-uploads')
            .getPublicUrl(menuImagePath);
            
          // Update business record with menu image URL
          await supabase
            .from('businesses')
            .update({ menu_image_url: menuImageData.publicUrl })
            .eq('id', business.id);
        }
      }

      // Set success message
      setSuccessMessage(
        mode === 'create'
          ? "Your business has been successfully submitted and is now pending approval by administrators."
          : "Your business information has been successfully updated."
      );
      
      // Call the onComplete callback
      onComplete(business.id);
      
    } catch (err) {
      console.error("Error submitting business:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-content mx-auto bg-offWhite rounded-lg shadow-elevated p-0 overflow-hidden border border-seafoam/20">
      {/* Tabs */}
      <div className="flex border-b border-seafoam/30">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              step === i
                ? 'bg-offWhite text-primaryTeal border-b-2 border-primaryTeal'
                : 'bg-seafoam/20 text-darkCharcoal hover:bg-seafoam/30'
            }`}
            onClick={() => setStep(i)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Step Content */}
      <div className="p-8">
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Basic Info</h2>
            
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-darkCharcoal">Business Name</label>
              <input 
                id="title"
                className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                placeholder="Enter your business name" 
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-darkCharcoal">Short Description</label>
              <textarea 
                id="description"
                className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none min-h-[100px]" 
                placeholder="Briefly describe your business" 
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
              />
              <p className="text-xs text-grayLight">Provide a concise description that will appear in search results.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium text-darkCharcoal">Category</label>
                <select 
                  id="category"
                  className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                  value={form.category}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    setForm({...form, category: newCategory, subCategory: ''});
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
                {form.category === 'accommodations' && (
                  <div className="mt-2 px-3 py-2 bg-primaryTeal/10 border border-primaryTeal/30 rounded-md text-sm font-medium text-primaryTeal flex items-center gap-2">
                    <span className="text-lg">✓</span>
                    Accommodation template will be applied
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subCategory" className="text-sm font-medium text-darkCharcoal">Sub-category</label>
                <select 
                  id="subCategory"
                  className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                  value={form.subCategory}
                  onChange={(e) => setForm({...form, subCategory: e.target.value})}
                  disabled={!form.category}
                >
                  <option value="">Select sub-category</option>
                  {getSubCategories().map(subCat => (
                    <option key={subCat.value} value={subCat.value}>{subCat.label}</option>
                  ))}
                </select>
                {!form.category && (
                  <p className="text-xs text-grayLight">Please select a category first</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="featuredType" className="text-sm font-medium text-darkCharcoal">Featured Type</label>
              <input 
                id="featuredType"
                className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                placeholder="e.g. Hot Deal, New Opening, etc." 
                value={form.featuredType}
                onChange={(e) => setForm({...form, featuredType: e.target.value})}
              />
              <p className="text-xs text-grayLight">Special tag that will be shown with your listing</p>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Amenities</h2>
            <p className="text-darkCharcoal mb-4">Select all amenities that your business offers:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'WiFi',
                'Parking',
                'Outdoor Seating',
                'Pet Friendly',
                'Wheelchair Accessible',
                'Air Conditioning',
                'Delivery',
                'Takeout',
                'Reservations',
                'Family-Friendly',
                'Live Music',
                'Waterfront View',
                'Beachfront',
                'Swimming Pool',
                'Fitness Center',
                'Spa Services',
                'Business Center',
                'Electric Vehicle Charging'
              ].map(amenity => (
                <label key={amenity} className="flex items-center gap-2 p-2 rounded-md border border-transparent hover:border-seafoam hover:bg-seafoam/10 transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="text-primaryTeal focus:ring-primaryTeal h-4 w-4"
                    checked={form.amenities.includes(amenity)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({...form, amenities: [...form.amenities, amenity]});
                      } else {
                        setForm({...form, amenities: form.amenities.filter(a => a !== amenity)});
                      }
                    }}
                  />
                  <span className="text-darkCharcoal">{amenity}</span>
                </label>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-seafoam/30">
              <h3 className="font-heading font-semibold text-primaryTeal mb-3">Custom Amenities</h3>
              <p className="text-sm text-grayLight mb-3">Add any additional amenities not listed above:</p>
              
              <div className="flex gap-2">
                <input 
                  className="flex-1 border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                  placeholder="Enter custom amenity"
                  id="customAmenity"
                />
                <button 
                  type="button"
                  className="px-4 py-2 bg-seafoam text-primaryTeal font-semibold rounded-md hover:bg-seafoam/80 transition-colors"
                  onClick={() => {
                    const customAmenity = (document.getElementById('customAmenity') as HTMLInputElement).value.trim();
                    if (customAmenity && !form.amenities.includes(customAmenity)) {
                      setForm({...form, amenities: [...form.amenities, customAmenity]});
                      (document.getElementById('customAmenity') as HTMLInputElement).value = '';
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Facilities</h2>
            <p className="text-darkCharcoal mb-4">Select on-site facilities that your business offers:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'Swimming Pool',
                'Spa',
                'Gym',
                'Restaurant',
                'Bar',
                'Conference Room',
                'Business Center',
                'Kids Club',
                'Tennis Court',
                'Golf Course',
                'Beach Access',
                'Water Sports',
              ].map(facility => (
                <label key={facility} className="flex items-center gap-2 p-2 rounded-md border border-transparent hover:border-seafoam hover:bg-seafoam/10 transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="text-primaryTeal focus:ring-primaryTeal h-4 w-4"
                    checked={form.facilities?.includes(facility) || false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({...form, facilities: [...form.facilities, facility]});
                      } else {
                        setForm({
                          ...form, 
                          facilities: form.facilities.filter(f => f !== facility),
                          // Also remove facility hours if the facility is unchecked
                          facility_hours: Object.fromEntries(
                            Object.entries(form.facility_hours).filter(([key]) => key !== facility)
                          )
                        });
                      }
                    }}
                  />
                  <span className="text-darkCharcoal">{facility}</span>
                </label>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-seafoam/30">
              <h3 className="font-heading font-semibold text-primaryTeal mb-3">Custom Facilities</h3>
              <p className="text-sm text-grayLight mb-3">Add any additional facilities not listed above:</p>
              
              <div className="flex gap-2">
                <input 
                  className="flex-1 border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                  placeholder="Enter custom facility"
                  id="customFacility"
                />
                <button 
                  type="button"
                  className="px-4 py-2 bg-seafoam text-primaryTeal font-semibold rounded-md hover:bg-seafoam/80 transition-colors"
                  onClick={() => {
                    const customFacility = (document.getElementById('customFacility') as HTMLInputElement).value.trim();
                    if (customFacility && !form.facilities?.includes(customFacility)) {
                      setForm({...form, facilities: [...(form.facilities || []), customFacility]});
                      (document.getElementById('customFacility') as HTMLInputElement).value = '';
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
            
            {form.facilities?.length > 0 && (
              <div className="mt-6 pt-4 border-t border-seafoam/30">
                <h3 className="font-heading font-semibold text-primaryTeal mb-3">Facility Operating Hours</h3>
                <p className="text-sm text-grayLight mb-4">Specify operating hours for each facility (if applicable):</p>
                
                <div className="space-y-4">
                  {form.facilities.map(facility => (
                    <div key={facility} className="p-4 bg-seafoam/10 rounded-lg">
                      <h4 className="font-medium text-primaryTeal mb-3">{facility}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-darkCharcoal">Opening Time</label>
                          <input 
                            type="time" 
                            className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                            value={form.facility_hours[facility]?.open || ''}
                            onChange={(e) => {
                              const updatedHours = { 
                                ...form.facility_hours,
                                [facility]: {
                                  open: e.target.value,
                                  close: form.facility_hours[facility]?.close || '',
                                  days: form.facility_hours[facility]?.days || 'Monday - Sunday'
                                }
                              };
                              setForm({...form, facility_hours: updatedHours});
                            }}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-darkCharcoal">Closing Time</label>
                          <input 
                            type="time" 
                            className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                            value={form.facility_hours[facility]?.close || ''}
                            onChange={(e) => {
                              const updatedHours = { 
                                ...form.facility_hours,
                                [facility]: {
                                  open: form.facility_hours[facility]?.open || '',
                                  close: e.target.value,
                                  days: form.facility_hours[facility]?.days || 'Monday - Sunday'
                                }
                              };
                              setForm({...form, facility_hours: updatedHours});
                            }}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-darkCharcoal">Days of Operation</label>
                          <input 
                            type="text" 
                            className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                            placeholder="e.g. Monday - Friday"
                            value={form.facility_hours[facility]?.days || ''}
                            onChange={(e) => {
                              const updatedHours = { 
                                ...form.facility_hours,
                                [facility]: {
                                  open: form.facility_hours[facility]?.open || '',
                                  close: form.facility_hours[facility]?.close || '',
                                  days: e.target.value
                                }
                              };
                              setForm({...form, facility_hours: updatedHours});
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="country" className="text-sm font-medium text-darkCharcoal">Country</label>
                  <select 
                    id="country"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    value={form.country}
                    onChange={(e) => setForm({...form, country: e.target.value})}
                  >
                    <option value="">Select country</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="United States">United States</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Philippines">Philippines</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm font-medium text-darkCharcoal">City</label>
                  <input 
                    id="city"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    placeholder="Enter city name"
                    value={form.city}
                    onChange={(e) => setForm({...form, city: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium text-darkCharcoal">Full Address</label>
                  <textarea 
                    id="address"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    placeholder="Enter full street address"
                    value={form.address}
                    onChange={(e) => setForm({...form, address: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="latitude" className="text-sm font-medium text-darkCharcoal">Latitude</label>
                    <input 
                      id="latitude"
                      className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="e.g. 16.0544"
                      value={form.latitude}
                      onChange={(e) => setForm({...form, latitude: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="longitude" className="text-sm font-medium text-darkCharcoal">Longitude</label>
                    <input 
                      id="longitude"
                      className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="e.g. 108.2022"
                      value={form.longitude}
                      onChange={(e) => setForm({...form, longitude: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="border border-grayLight rounded-lg overflow-hidden bg-white">
                <div className="bg-sand p-3 border-b border-grayLight">
                  <h3 className="font-medium text-darkCharcoal">Map Location</h3>
                </div>
                <div className="h-[300px] bg-seafoam/20 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">📍</div>
                    <p className="text-darkCharcoal font-medium">Map Preview</p>
                    <p className="text-sm text-grayLight">Enter location details to see your business on the map</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-sand/70 p-4 rounded-md border border-seafoam/20 mt-4">
              <p className="text-sm text-darkCharcoal">
                <span className="font-medium">Tip:</span> For the most accurate listing, please provide precise coordinates. You can find these by right-clicking on your location in Google Maps and selecting "What's here?".
              </p>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Media</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-darkCharcoal">Thumbnail Image</label>
                  <div className="border-2 border-dashed border-seafoam rounded-md p-4 bg-sand/50 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-3xl text-seafoam">🖼️</div>
                      <p className="text-sm text-darkCharcoal">Drag and drop your thumbnail image or</p>
                      <label className="px-4 py-2 bg-seafoam text-primaryTeal rounded-md cursor-pointer hover:bg-seafoam/80 transition-colors font-medium">
                        Browse Files
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setForm({...form, thumbnail: e.target.files[0]});
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-grayLight">Recommended: 400x300px, max 2MB</p>
                    </div>
                    {form.thumbnail && (
                      <div className="mt-4 p-2 bg-white rounded border border-seafoam">
                        <p className="text-sm text-darkCharcoal truncate">{form.thumbnail.name}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-darkCharcoal">Cover Image</label>
                  <div className="border-2 border-dashed border-seafoam rounded-md p-4 bg-sand/50 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-3xl text-seafoam">🌄</div>
                      <p className="text-sm text-darkCharcoal">Drag and drop your cover image or</p>
                      <label className="px-4 py-2 bg-seafoam text-primaryTeal rounded-md cursor-pointer hover:bg-seafoam/80 transition-colors font-medium">
                        Browse Files
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setForm({...form, cover: e.target.files[0]});
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-grayLight">Recommended: 1200x600px, max 5MB</p>
                    </div>
                    {form.cover && (
                      <div className="mt-4 p-2 bg-white rounded border border-seafoam">
                        <p className="text-sm text-darkCharcoal truncate">{form.cover.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="videoProvider" className="text-sm font-medium text-darkCharcoal">Video Provider</label>
                  <select 
                    id="videoProvider"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    value={form.videoProvider}
                    onChange={(e) => setForm({...form, videoProvider: e.target.value})}
                  >
                    <option value="">Select provider</option>
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="videoUrl" className="text-sm font-medium text-darkCharcoal">Video URL</label>
                  <input 
                    id="videoUrl"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    placeholder="e.g. https://youtube.com/watch?v=..."
                    value={form.videoUrl}
                    onChange={(e) => setForm({...form, videoUrl: e.target.value})}
                  />
                  <p className="text-xs text-grayLight">Paste the full URL of your video</p>
                </div>
                
                <div className="space-y-2 mt-4">
                  <label className="text-sm font-medium text-darkCharcoal">Gallery Images</label>
                  <div className="border-2 border-dashed border-seafoam rounded-md p-4 bg-sand/50 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-3xl text-seafoam">📸</div>
                      <p className="text-sm text-darkCharcoal">Upload multiple gallery images</p>
                      <label className="px-4 py-2 bg-seafoam text-primaryTeal rounded-md cursor-pointer hover:bg-seafoam/80 transition-colors font-medium">
                        Browse Files
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const filesArray = Array.from(e.target.files);
                              setForm({...form, gallery: [...form.gallery, ...filesArray]});
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-grayLight">Up to 10 images, max 2MB each</p>
                    </div>
                    {form.gallery.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {form.gallery.slice(0, 3).map((file, index) => (
                          <div key={index} className="p-2 bg-white rounded border border-seafoam">
                            <p className="text-xs text-darkCharcoal truncate">{file.name}</p>
                          </div>
                        ))}
                        {form.gallery.length > 3 && (
                          <div className="p-2 bg-white rounded border border-seafoam flex items-center justify-center">
                            <p className="text-xs text-darkCharcoal">+{form.gallery.length - 3} more</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">SEO</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="tags" className="text-sm font-medium text-darkCharcoal">Business Tags</label>
                <div className="relative">
                  <input 
                    id="tags"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    placeholder="Enter tags separated by commas (e.g. beach, seafood, family-friendly)" 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim();
                        if (value && !form.tags.includes(value)) {
                          setForm({...form, tags: [...form.tags, value]});
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button 
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-seafoam text-primaryTeal rounded hover:bg-seafoam/80 transition-colors"
                    onClick={() => {
                      const input = document.getElementById('tags') as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !form.tags.includes(value)) {
                        setForm({...form, tags: [...form.tags, value]});
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-grayLight">Tags help customers find your business when searching</p>
                
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.tags.map((tag, index) => (
                      <div 
                        key={index} 
                        className="bg-seafoam/20 text-primaryTeal px-2 py-1 rounded-md flex items-center gap-1 text-sm"
                      >
                        <span>{tag}</span>
                        <button 
                          type="button"
                          className="text-primaryTeal hover:text-coralAccent transition-colors"
                          onClick={() => setForm({...form, tags: form.tags.filter((_, i) => i !== index)})}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="metaTags" className="text-sm font-medium text-darkCharcoal">Meta Tags</label>
                <div className="relative">
                  <input 
                    id="metaTags"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    placeholder="Enter meta tags separated by commas" 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim();
                        if (value && !form.metaTags.includes(value)) {
                          setForm({...form, metaTags: [...form.metaTags, value]});
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button 
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-seafoam text-primaryTeal rounded hover:bg-seafoam/80 transition-colors"
                    onClick={() => {
                      const input = document.getElementById('metaTags') as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !form.metaTags.includes(value)) {
                        setForm({...form, metaTags: [...form.metaTags, value]});
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-grayLight">Meta tags improve your business's visibility in search engines</p>
                
                {form.metaTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.metaTags.map((tag, index) => (
                      <div 
                        key={index} 
                        className="bg-sand border border-grayLight px-2 py-1 rounded-md flex items-center gap-1 text-sm"
                      >
                        <span>{tag}</span>
                        <button 
                          type="button"
                          className="text-grayLight hover:text-coralAccent transition-colors"
                          onClick={() => setForm({...form, metaTags: form.metaTags.filter((_, i) => i !== index)})}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="bg-sand/70 p-4 rounded-md border border-seafoam/20 mt-4">
                <h3 className="font-heading font-semibold text-primaryTeal mb-2">SEO Tips</h3>
                <ul className="text-sm text-darkCharcoal space-y-1 list-disc pl-5">
                  <li>Use relevant keywords that potential customers might search for</li>
                  <li>Include your location in tags (city, neighborhood, etc.)</li>
                  <li>Add specific services or products you offer</li>
                  <li>Consider including nearby landmarks or attractions</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Business Hours</h2>
            
            <div className="bg-white rounded-lg border border-grayLight overflow-hidden">
              <div className="grid grid-cols-7 bg-sand border-b border-grayLight">
                <div className="p-3 font-medium text-darkCharcoal border-r border-grayLight">Day</div>
                <div className="p-3 font-medium text-darkCharcoal border-r border-grayLight">Open</div>
                <div className="p-3 font-medium text-darkCharcoal border-r border-grayLight">Close</div>
                <div className="p-3 font-medium text-darkCharcoal border-r border-grayLight">Open 24h</div>
                <div className="p-3 font-medium text-darkCharcoal border-r border-grayLight">Closed</div>
                <div className="p-3 font-medium text-darkCharcoal border-r border-grayLight">Split Hours</div>
                <div className="p-3 font-medium text-darkCharcoal">Second Shift</div>
              </div>
              
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, index) => {
                const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                const isOpen24h = form.schedule[day as keyof typeof form.schedule].open === '00:00' && 
                                 form.schedule[day as keyof typeof form.schedule].close === '23:59';
                const isClosed = form.schedule[day as keyof typeof form.schedule].open === '' && 
                               form.schedule[day as keyof typeof form.schedule].close === '';
                
                return (
                  <div 
                    key={day} 
                    className={`grid grid-cols-7 ${index % 2 === 0 ? 'bg-white' : 'bg-sand/30'} border-b border-grayLight last:border-b-0`}
                  >
                    <div className="p-3 border-r border-grayLight flex items-center">
                      <span className="font-medium text-primaryTeal">{dayName}</span>
                    </div>
                    
                    <div className="p-3 border-r border-grayLight">
                      <input 
                        type="time" 
                        className="w-full border border-grayLight rounded-md px-2 py-1 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none"
                        value={form.schedule[day as keyof typeof form.schedule].open}
                        onChange={(e) => {
                          const newSchedule = {...form.schedule};
                          newSchedule[day as keyof typeof form.schedule].open = e.target.value;
                          setForm({...form, schedule: newSchedule});
                        }}
                        disabled={isOpen24h || isClosed}
                      />
                    </div>
                    
                    <div className="p-3 border-r border-grayLight">
                      <input 
                        type="time" 
                        className="w-full border border-grayLight rounded-md px-2 py-1 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none"
                        value={form.schedule[day as keyof typeof form.schedule].close}
                        onChange={(e) => {
                          const newSchedule = {...form.schedule};
                          newSchedule[day as keyof typeof form.schedule].close = e.target.value;
                          setForm({...form, schedule: newSchedule});
                        }}
                        disabled={isOpen24h || isClosed}
                      />
                    </div>
                    
                    <div className="p-3 border-r border-grayLight flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 text-primaryTeal focus:ring-primaryTeal"
                        checked={isOpen24h}
                        onChange={(e) => {
                          const newSchedule = {...form.schedule};
                          if (e.target.checked) {
                            newSchedule[day as keyof typeof form.schedule].open = '00:00';
                            newSchedule[day as keyof typeof form.schedule].close = '23:59';
                          } else {
                            newSchedule[day as keyof typeof form.schedule].open = '';
                            newSchedule[day as keyof typeof form.schedule].close = '';
                          }
                          setForm({...form, schedule: newSchedule});
                        }}
                      />
                    </div>
                    
                    <div className="p-3 border-r border-grayLight flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 text-primaryTeal focus:ring-primaryTeal"
                        checked={isClosed}
                        onChange={(e) => {
                          const newSchedule = {...form.schedule};
                          if (e.target.checked) {
                            newSchedule[day as keyof typeof form.schedule].open = '';
                            newSchedule[day as keyof typeof form.schedule].close = '';
                          } else {
                            newSchedule[day as keyof typeof form.schedule].open = '09:00';
                            newSchedule[day as keyof typeof form.schedule].close = '17:00';
                          }
                          setForm({...form, schedule: newSchedule});
                        }}
                      />
                    </div>
                    
                    <div className="p-3 border-r border-grayLight flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 text-primaryTeal focus:ring-primaryTeal"
                      />
                    </div>
                    
                    <div className="p-3 flex items-center justify-center text-xs text-grayLight">
                      N/A
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-4 mt-4">
              <button 
                type="button"
                className="px-4 py-2 bg-seafoam text-primaryTeal rounded-md hover:bg-seafoam/80 transition-colors font-medium text-sm"
                onClick={() => {
                  // Set all days to 9am-5pm
                  const newSchedule = {...form.schedule};
                  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
                    newSchedule[day as keyof typeof form.schedule].open = '09:00';
                    newSchedule[day as keyof typeof form.schedule].close = '17:00';
                  });
                  ['saturday', 'sunday'].forEach(day => {
                    newSchedule[day as keyof typeof form.schedule].open = '';
                    newSchedule[day as keyof typeof form.schedule].close = '';
                  });
                  setForm({...form, schedule: newSchedule});
                }}
              >
                Set Weekday Hours (9-5)
              </button>
              
              <button 
                type="button"
                className="px-4 py-2 bg-seafoam text-primaryTeal rounded-md hover:bg-seafoam/80 transition-colors font-medium text-sm"
                onClick={() => {
                  // Set all days to the same hours
                  const newSchedule = {...form.schedule};
                  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                  const mondayOpen = form.schedule.monday.open;
                  const mondayClose = form.schedule.monday.close;
                  
                  days.forEach(day => {
                    newSchedule[day as keyof typeof form.schedule].open = mondayOpen;
                    newSchedule[day as keyof typeof form.schedule].close = mondayClose;
                  });
                  
                  setForm({...form, schedule: newSchedule});
                }}
              >
                Copy Monday to All Days
              </button>
            </div>
          </div>
        )}
        {step === 7 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="website" className="text-sm font-medium text-darkCharcoal">Website</label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayLight" />
                    <input 
                      id="website"
                      className="w-full border border-grayLight rounded-md pl-10 pr-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="https://www.example.com" 
                      value={form.website}
                      onChange={(e) => setForm({...form, website: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-darkCharcoal">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayLight" />
                    <input 
                      id="email"
                      type="email"
                      className="w-full border border-grayLight rounded-md pl-10 pr-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="contact@yourbusiness.com" 
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-darkCharcoal">Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayLight" />
                    <input 
                      id="phone"
                      type="tel"
                      className="w-full border border-grayLight rounded-md pl-10 pr-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="+1 (555) 123-4567" 
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="font-heading font-semibold text-primaryTeal">Social Media Profiles</h3>
                
                <div className="space-y-2">
                  <label htmlFor="facebook" className="text-sm font-medium text-darkCharcoal">Facebook</label>
                  <div className="relative">
                    <Facebook size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayLight" />
                    <input 
                      id="facebook"
                      className="w-full border border-grayLight rounded-md pl-10 pr-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="https://facebook.com/yourbusiness" 
                      value={form.facebook}
                      onChange={(e) => setForm({...form, facebook: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="twitter" className="text-sm font-medium text-darkCharcoal">Twitter</label>
                  <div className="relative">
                    <Twitter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayLight" />
                    <input 
                      id="twitter"
                      className="w-full border border-grayLight rounded-md pl-10 pr-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="https://twitter.com/yourbusiness" 
                      value={form.twitter}
                      onChange={(e) => setForm({...form, twitter: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="linkedin" className="text-sm font-medium text-darkCharcoal">LinkedIn</label>
                  <div className="relative">
                    <Linkedin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayLight" />
                    <input 
                      id="linkedin"
                      className="w-full border border-grayLight rounded-md pl-10 pr-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="https://linkedin.com/company/yourbusiness" 
                      value={form.linkedin}
                      onChange={(e) => setForm({...form, linkedin: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-sand/70 p-4 rounded-md border border-seafoam/20 mt-4">
              <h3 className="font-heading font-semibold text-primaryTeal mb-2">Contact Tips</h3>
              <ul className="text-sm text-darkCharcoal space-y-1 list-disc pl-5">
                <li>Include at least one contact method (phone, email, or website)</li>
                <li>Social media profiles help customers connect with your business</li>
                <li>Make sure your contact information is current and accurate</li>
              </ul>
            </div>
          </div>
        )}
        {step === 8 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Business Type</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-darkCharcoal">Business Type</label>
                  <p className="text-xs text-grayLight">Select all that apply to your business</p>
                  
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {['General', 'Shop', 'Hotel', 'Restaurant', 'Cafe', 'Bar', 'Tour', 'Activity', 'Service'].map(type => (
                      <label 
                        key={type} 
                        className={`
                          flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer
                          ${form.businessTypes.includes(type) 
                            ? 'bg-seafoam/20 border-primaryTeal text-primaryTeal' 
                            : 'bg-sand border-grayLight text-darkCharcoal hover:border-seafoam'}
                        `}
                      >
                        <input 
                          type="checkbox" 
                          className="text-primaryTeal focus:ring-primaryTeal h-4 w-4"
                          checked={form.businessTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({...form, businessTypes: [...form.businessTypes, type]});
                            } else {
                              setForm({...form, businessTypes: form.businessTypes.filter(t => t !== type)});
                            }
                          }}
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-darkCharcoal">Has Menu?</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="hasMenu" 
                        className="text-primaryTeal focus:ring-primaryTeal h-4 w-4"
                        checked={form.menuName !== ''}
                        onChange={() => {
                          if (form.menuName === '') {
                            setForm({...form, menuName: 'Menu'});
                          }
                        }}
                      />
                      <span className="text-darkCharcoal">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="hasMenu" 
                        className="text-primaryTeal focus:ring-primaryTeal h-4 w-4"
                        checked={form.menuName === ''}
                        onChange={() => {
                          setForm({...form, menuName: '', menuPrice: '', menuItems: []});
                        }}
                      />
                      <span className="text-darkCharcoal">No</span>
                    </label>
                  </div>
                </div>
                
                {form.menuName !== '' && (
                  <div className="space-y-4 p-4 bg-sand/50 rounded-md border border-seafoam/20">
                    <div className="space-y-2">
                      <label htmlFor="menuName" className="text-sm font-medium text-darkCharcoal">Menu Name</label>
                      <input 
                        id="menuName"
                        className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                        placeholder="e.g. Lunch Menu, Dinner Menu" 
                        value={form.menuName}
                        onChange={(e) => setForm({...form, menuName: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="menuPrice" className="text-sm font-medium text-darkCharcoal">Price Range</label>
                      <input 
                        id="menuPrice"
                        className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                        placeholder="e.g. $10-$30" 
                        value={form.menuPrice}
                        onChange={(e) => setForm({...form, menuPrice: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="menuItems" className="text-sm font-medium text-darkCharcoal">Menu Items</label>
                      <div className="relative">
                        <input 
                          id="menuItems"
                          className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                          placeholder="Add menu items one by one" 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const value = input.value.trim();
                              if (value) {
                                setForm({...form, menuItems: [...form.menuItems, value]});
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button 
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-seafoam text-primaryTeal rounded hover:bg-seafoam/80 transition-colors"
                          onClick={() => {
                            const input = document.getElementById('menuItems') as HTMLInputElement;
                            const value = input.value.trim();
                            if (value) {
                              setForm({...form, menuItems: [...form.menuItems, value]});
                              input.value = '';
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <p className="text-xs text-grayLight">Press Enter after each item or click Add</p>
                      
                      {form.menuItems.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-darkCharcoal">Added Items:</p>
                          <ul className="bg-white rounded-md border border-grayLight p-2 max-h-[150px] overflow-y-auto">
                            {form.menuItems.map((item, index) => (
                              <li 
                                key={index} 
                                className="flex justify-between items-center py-1 px-2 border-b border-grayLight/50 last:border-b-0"
                              >
                                <span className="text-sm text-darkCharcoal">{item}</span>
                                <button 
                                  type="button"
                                  className="text-grayLight hover:text-coralAccent transition-colors"
                                  onClick={() => setForm({...form, menuItems: form.menuItems.filter((_, i) => i !== index)})}
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-darkCharcoal">Menu Image</label>
                      <div className="border-2 border-dashed border-seafoam rounded-md p-4 bg-sand/50 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="text-2xl text-seafoam">🍽️</div>
                          <p className="text-sm text-darkCharcoal">Upload an image of your menu</p>
                          <label className="px-4 py-2 bg-seafoam text-primaryTeal rounded-md cursor-pointer hover:bg-seafoam/80 transition-colors font-medium">
                            Browse Files
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setForm({...form, menuImage: e.target.files[0]});
                                }
                              }}
                            />
                          </label>
                        </div>
                        {form.menuImage && (
                          <div className="mt-4 p-2 bg-white rounded border border-seafoam">
                            <p className="text-sm text-darkCharcoal truncate">{form.menuImage.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {step === 9 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Review & Submit</h2>
            
            <div className="bg-white rounded-lg border border-seafoam/20 overflow-hidden">
              <div className="bg-sand p-4 border-b border-seafoam/20">
                <h3 className="font-heading font-semibold text-primaryTeal">Business Profile Summary</h3>
                <p className="text-sm text-grayLight">Please review your information before submitting</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info Summary */}
                  <div className="space-y-3">
                    <h4 className="font-heading font-semibold text-darkCharcoal border-b border-grayLight pb-1">Basic Information</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-grayLight">Business Name:</span>
                        <span className="text-sm font-medium text-darkCharcoal">{form.title || 'Not provided'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-grayLight">Category:</span>
                        <span className="text-sm font-medium text-darkCharcoal">{categories.find(c => c.value === form.category)?.label || 'Not provided'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-grayLight">Subcategory:</span>
                        <span className="text-sm font-medium text-darkCharcoal">{subCategoriesMap[form.category]?.find(s => s.value === form.subCategory)?.label || 'Not provided'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-grayLight">Featured Type:</span>
                        <span className="text-sm font-medium text-darkCharcoal">{form.featuredType || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Summary */}
                  <div className="space-y-3">
                    <h4 className="font-heading font-semibold text-darkCharcoal border-b border-grayLight pb-1">Contact Information</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-grayLight">Email:</span>
                        <span className="text-sm font-medium text-darkCharcoal">{form.email || 'Not provided'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-grayLight">Phone:</span>
                        <span className="text-sm font-medium text-darkCharcoal">{form.phone || 'Not provided'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-grayLight">Website:</span>
                        <span className="text-sm font-medium text-darkCharcoal">{form.website || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Location Summary */}
                <div className="space-y-3">
                  <h4 className="font-heading font-semibold text-darkCharcoal border-b border-grayLight pb-1">Location</h4>
                  
                  <div className="text-sm">
                    <p><span className="text-grayLight">Address:</span> {form.address || 'Not provided'}</p>
                    <p><span className="text-grayLight">City:</span> {form.city || 'Not provided'}, <span className="text-grayLight">Country:</span> {form.country || 'Not provided'}</p>
                  </div>
                </div>
                
                {/* Media Summary */}
                <div className="space-y-3">
                  <h4 className="font-heading font-semibold text-darkCharcoal border-b border-grayLight pb-1">Media</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-grayLight">Thumbnail</span>
                      <div className="h-16 bg-sand/50 rounded flex items-center justify-center border border-grayLight">
                        {form.thumbnail ? (
                          <span className="text-xs text-darkCharcoal truncate px-2">✓ Uploaded</span>
                        ) : (
                          <span className="text-xs text-coralAccent">Missing</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-xs text-grayLight">Cover</span>
                      <div className="h-16 bg-sand/50 rounded flex items-center justify-center border border-grayLight">
                        {form.cover ? (
                          <span className="text-xs text-darkCharcoal truncate px-2">✓ Uploaded</span>
                        ) : (
                          <span className="text-xs text-coralAccent">Missing</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-xs text-grayLight">Gallery</span>
                      <div className="h-16 bg-sand/50 rounded flex items-center justify-center border border-grayLight">
                        {form.gallery.length > 0 ? (
                          <span className="text-xs text-darkCharcoal truncate px-2">{form.gallery.length} images</span>
                        ) : (
                          <span className="text-xs text-coralAccent">No images</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-xs text-grayLight">Video</span>
                      <div className="h-16 bg-sand/50 rounded flex items-center justify-center border border-grayLight">
                        {form.videoUrl ? (
                          <span className="text-xs text-darkCharcoal truncate px-2">✓ Added</span>
                        ) : (
                          <span className="text-xs text-grayLight">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-sand/70 p-4 rounded-md border border-seafoam/20 mt-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl text-seafoam">✓</div>
                <div>
                  <h3 className="font-heading font-semibold text-primaryTeal">Ready to Submit</h3>
                  <p className="text-sm text-darkCharcoal">Click the button below to submit your business listing</p>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-coralAccent/20 p-4 rounded-md border border-coralAccent text-darkCharcoal">
                <p>{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-seafoam/20 p-4 rounded-md border border-primaryTeal text-darkCharcoal">
                <p className="flex items-center gap-2">
                  <span className="text-xl text-primaryTeal">✓</span>
                  {successMessage}
                </p>
              </div>
            )}

            <div className="flex justify-center gap-4 pt-4">
              <button 
                className="px-6 py-3 rounded-md bg-sand text-darkCharcoal font-semibold border border-grayLight hover:bg-seafoam/20 transition-colors" 
                type="button" 
                onClick={() => setStep(0)}
              >
                Edit Information
              </button>
              <button 
                className="px-6 py-3 rounded-md bg-primaryTeal text-offWhite font-semibold hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle" 
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Business Listing'}
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Navigation */}
      <div className="flex justify-between p-4 border-t border-seafoam/30 bg-sand">
        <button
          className="px-4 py-2 rounded-md bg-transparent text-primaryTeal font-semibold hover:underline transition-colors disabled:opacity-50 disabled:no-underline"
          type="button"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Back
        </button>
        <button
          className="px-4 py-2 rounded-md bg-primaryTeal text-offWhite font-semibold hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle disabled:opacity-50"
          type="button"
          onClick={() => {
            if (step === TABS.length - 1) {
              handleSubmit();
            } else {
              setStep(s => Math.min(TABS.length - 1, s + 1));
            }
          }}
          disabled={isSubmitting || (step === TABS.length - 1)}
        >
          {step === TABS.length - 1 
            ? (isSubmitting 
              ? 'Submitting...' 
              : mode === 'create' ? 'Create Business' : 'Save Changes') 
            : 'Next'}
        </button>
      </div>
    </div>
  );
} 