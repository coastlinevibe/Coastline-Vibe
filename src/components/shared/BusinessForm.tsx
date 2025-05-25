"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

// Business categories configuration
const businessCategories = [
  {
    "name": "Restaurants & Cafes",
    "subcategories": ["Vietnamese", "Western", "Seafood", "Vegetarian", "Coffee Shops", "Bakeries", "Fast Food"]
  },
  {
    "name": "Homestays & Hotels",
    "subcategories": ["Boutique Hotels", "Hostels", "Resorts", "Villas", "Beachfront Rentals", "Backpacker Lodges"]
  },
  {
    "name": "Fitness & Wellness",
    "subcategories": ["Gyms", "Yoga Studios", "Massage", "Spas", "Wellness Centers", "Personal Trainers"]
  },
  {
    "name": "Shops & Retail",
    "subcategories": ["Clothing", "Surf & Beachwear", "Electronics", "Convenience Stores", "Souvenir Shops", "Specialty Foods"]
  },
  {
    "name": "Beauty & Services",
    "subcategories": ["Hair Salons", "Nail Bars", "Barbershops", "Lash & Brow Studios", "Tattoo Studios"]
  },
  {
    "name": "Real Estate & Rentals",
    "subcategories": ["Property Agencies", "Rental Listings", "Coworking Spaces", "Property Management"]
  },
  {
    "name": "Business & Professional Services",
    "subcategories": ["Accounting", "Legal Services", "Printing", "Web Design", "Marketing", "Photography"]
  },
  {
    "name": "Florists & Garden",
    "subcategories": ["Flower Shops", "Garden Centers", "Landscaping Services", "Plant Nurseries"]
  },
  {
    "name": "Home & Repairs",
    "subcategories": ["Plumbing", "Electrical", "Renovation", "Cleaning Services", "Handyman Services"]
  },
  {
    "name": "Kids & Education",
    "subcategories": ["Daycares", "Preschools", "Language Schools", "Tutors", "Toy Shops", "After-school Programs"]
  },
  {
    "name": "Transport & Travel",
    "subcategories": ["Scooter Rentals", "Travel Agencies", "Airport Transfers", "Car Rentals", "Tour Operators"]
  },
  {
    "name": "Health & Medical",
    "subcategories": ["Clinics", "Dentists", "Pharmacies", "Physiotherapy", "Alternative Medicine"]
  },
  {
    "name": "Pets & Animals",
    "subcategories": ["Vets", "Grooming", "Pet Shops", "Pet Sitting", "Dog Training"]
  },
  {
    "name": "Arts, Events & Culture",
    "subcategories": ["Art Studios", "Music Schools", "Event Planners", "Galleries", "Dance Classes"]
  },
  {
    "name": "Other & Community",
    "subcategories": ["NGOs", "Volunteer Groups", "Religious Organizations", "Lost & Found", "Miscellaneous"]
  }
];

interface BusinessFormValues {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  category: string;
  subcategory: string[];
  location: any; // Will be set by Google Maps
  hours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  website: string;
  logo_url: string;
  banner_url: string;
}

interface BusinessFormProps {
  initialValues?: Partial<BusinessFormValues>;
  onSubmitSuccess?: () => void;
}

const BusinessForm: React.FC<BusinessFormProps> = ({ initialValues = {}, onSubmitSuccess }) => {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<BusinessFormValues>({
    defaultValues: {
      name: '',
      description: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      category: '',
      subcategory: [],
      location: null,
      hours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '17:00', closed: false },
        sunday: { open: '09:00', close: '17:00', closed: false },
      },
      website: '',
      logo_url: '',
      banner_url: '',
      ...initialValues,
    },
  });

  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [communityId, setCommunityId] = useState<string | null>(null);

  // Check user role and fetch community ID on mount
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, community_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.role === 'business') {
          setUserRole('business');
          setCommunityId(profile.community_id);
        } else {
          router.push('/'); // Redirect non-business users
        }
      } else {
        router.push('/login');
      }
    };
    checkUserRole();
  }, []);

  // Handle image uploads
  const handleImageUpload = async (file: File, type: 'logo' | 'banner') => {
    if (!communityId) {
      // This should ideally not happen if the useEffect completes, but as a safeguard
      console.error('Community ID not available for upload.');
      throw new Error('Community information is missing.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${type}s/${communityId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('business-uploads')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('business-uploads')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: BusinessFormValues) => {
    setFormError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Ensure subcategory is always an array
      const subcategory = Array.isArray(data.subcategory)
        ? data.subcategory
        : [data.subcategory].filter(Boolean);

      const newBusiness = {
        ...data,
        subcategory, // always an array
        user_id: user.id,
        is_approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('businesses')
        .insert([newBusiness]);

      if (insertError) throw insertError;

      if (onSubmitSuccess) onSubmitSuccess();
      router.push('/business/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save business');
    }
  };

  // If user is not a business owner, don't render the form
  if (userRole !== 'business') {
    return null;
  }

  return (
    <form className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-2xl font-bold text-cyan-900 mb-6">Business Profile</h2>
      
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-cyan-900 mb-1">Business Name</label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-900 mb-1">Description</label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={4}
            className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cyan-900 mb-1">Phone</label>
            <input
              type="tel"
              {...register('phone', { required: 'Phone is required' })}
              className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-900 mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-cyan-900 mb-1">Address</label>
          <input
            type="text"
            {...register('address', { required: 'Address is required' })}
            className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-900 mb-1">City</label>
          <input
            type="text"
            {...register('city', { required: 'City is required' })}
            className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
        </div>

        {/* Category Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cyan-900 mb-1">Category</label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {businessCategories.map((cat) => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-900 mb-1">Subcategory</label>
            <select
              {...register('subcategory', { required: 'Subcategory is required' })}
              className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              disabled={!selectedCategory}
            >
              <option value="">Select a subcategory</option>
              {selectedCategory && businessCategories
                .find(cat => cat.name === selectedCategory)
                ?.subcategories.map((subcat) => (
                  <option key={subcat} value={subcat}>{subcat}</option>
                ))}
            </select>
            {errors.subcategory && <p className="mt-1 text-sm text-red-600">{errors.subcategory.message}</p>}
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-cyan-900 mb-1">Website</label>
          <input
            type="url"
            {...register('website')}
            className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>

        {/* Operating Hours */}
        <div>
          <label className="block text-sm font-medium text-cyan-900 mb-1">Operating Hours</label>
          <div className="space-y-2">
            {Object.entries(watch('hours')).map(([day, hours]) => (
              <div key={day} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!hours.closed}
                  onChange={(e) => {
                    const newHours = { ...watch('hours') };
                    newHours[day] = { ...hours, closed: !e.target.checked };
                    setValue('hours', newHours);
                  }}
                  className="rounded border-cyan-200 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="w-24 text-sm text-cyan-900">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                <input
                  type="time"
                  value={hours.open}
                  onChange={(e) => {
                    const newHours = { ...watch('hours') };
                    newHours[day] = { ...hours, open: e.target.value };
                    setValue('hours', newHours);
                  }}
                  disabled={hours.closed}
                  className="px-2 py-1 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
                <span className="text-cyan-900">to</span>
                <input
                  type="time"
                  value={hours.close}
                  onChange={(e) => {
                    const newHours = { ...watch('hours') };
                    newHours[day] = { ...hours, close: e.target.value };
                    setValue('hours', newHours);
                  }}
                  disabled={hours.closed}
                  className="px-2 py-1 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Media Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cyan-900 mb-1">Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setLogoUploading(true);
                  try {
                    const url = await handleImageUpload(file, 'logo');
                    setValue('logo_url', url);
                  } catch (err) {
                    setFormError('Failed to upload logo');
                  }
                  setLogoUploading(false);
                }
              }}
              className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            {logoUploading && <p className="mt-1 text-sm text-cyan-600">Uploading...</p>}
            {watch('logo_url') && (
              <img
                src={watch('logo_url')}
                alt="Logo preview"
                className="mt-2 h-16 w-16 object-cover rounded"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-900 mb-1">Banner</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setBannerUploading(true);
                  try {
                    const url = await handleImageUpload(file, 'banner');
                    setValue('banner_url', url);
                  } catch (err) {
                    setFormError('Failed to upload banner');
                  }
                  setBannerUploading(false);
                }
              }}
              className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            {bannerUploading && <p className="mt-1 text-sm text-cyan-600">Uploading...</p>}
            {watch('banner_url') && (
              <img
                src={watch('banner_url')}
                alt="Banner preview"
                className="mt-2 h-16 w-full object-cover rounded"
              />
            )}
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Saving...' : 'Save Business'}
      </button>
    </form>
  );
};

export default BusinessForm; 