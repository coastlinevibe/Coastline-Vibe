"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import BusinessMultiStepForm from './BusinessMultiStepForm';
import Link from 'next/link';

// Define the form state type to match what's in BusinessMultiStepForm
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
  neighborhood?: string;
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

interface BusinessFormContainerProps {
  communityId?: string;
}

export default function BusinessFormContainer({ communityId: propCommunityId }: BusinessFormContainerProps) {
  const params = useParams();
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<BusinessFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  
  const businessId = params?.businessId as string;
  // Use the prop communityId if provided, otherwise use from params
  const communityId = propCommunityId || (params?.communityId as string);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Determine if we're in edit mode based on the URL
    if (window.location.pathname.includes('/edit/')) {
      setMode('edit');
      
      // If we're in edit mode, fetch the existing business data
      if (businessId) {
        fetchBusinessData();
      }
    } else {
      setMode('create');
      setIsLoading(false);
    }
  }, [businessId]);

  const fetchBusinessData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('Business not found');
      }
      
      // Convert the database data to the form state format
      const formData: BusinessFormState = {
        title: data.title || data.name || '',
        description: data.description || '',
        category: data.category_id || '',
        subCategory: data.subcategory_id || '',
        featuredType: data.featured_type || '',
        amenities: data.amenities || [],
        facilities: data.facilities || [],
        facility_hours: data.facility_hours || {},
        country: data.country || '',
        city: data.city || '',
        address: data.address || '',
        latitude: data.latitude?.toString() || '',
        longitude: data.longitude?.toString() || '',
        neighborhood: data.neighborhood || '',
        thumbnail: null, // Can't pre-populate File objects
        cover: null,
        videoProvider: data.video_provider || '',
        videoUrl: data.video_url || '',
        gallery: [],
        tags: data.tags || [],
        metaTags: data.meta_tags || [],
        schedule: data.schedule || {
          monday: { open: '', close: '' },
          tuesday: { open: '', close: '' },
          wednesday: { open: '', close: '' },
          thursday: { open: '', close: '' },
          friday: { open: '', close: '' },
          saturday: { open: '', close: '' },
          sunday: { open: '', close: '' },
        },
        website: data.website || '',
        email: data.email || '',
        phone: data.phone || '',
        facebook: data.facebook || '',
        twitter: data.twitter || '',
        linkedin: data.linkedin || '',
        businessTypes: data.business_types || [],
        menuName: data.menu_name || '',
        menuPrice: data.menu_price || '',
        menuItems: data.menu_items || [],
        menuImage: null,
      };
      
      setInitialData(formData);
    } catch (err: any) {
      console.error('Error fetching business data:', err);
      setError(err.message || 'Failed to load business data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (id: string) => {
    // Show success message
    console.log("Business form submission completed successfully with ID:", id);
    setSubmissionSuccess(true);
    
    // Wait 2 seconds before redirecting
    setTimeout(() => {
      console.log("Redirecting to business page:", `/community/${communityId}/business/${id}`);
      // Redirect to the business view page after successful create/edit
      router.push(`/community/${communityId}/business/${id}`);
    }, 2000);
  };

  const handleBackClick = () => {
    router.push(`/community/${communityId}/business/directory/my-businesses`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-primaryTeal">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => router.push(`/community/${communityId}/business/directory`)}
          className="mt-4 px-4 py-2 bg-primaryTeal text-white rounded-md hover:bg-seafoam"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-content mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-primaryTeal">
            {mode === 'create' ? 'Create New Business' : 'Edit Business'}
          </h1>
          <p className="text-grayLight">
            {mode === 'create' 
              ? 'Fill out the form below to create a new business listing' 
              : 'Update your business information below'}
          </p>
        </div>
        
        {/* Back button */}
        <div className="mb-6">
          <button 
            onClick={handleBackClick}
            className="px-4 py-2 rounded-md bg-transparent text-primaryTeal font-semibold hover:underline transition-colors"
          >
            Back
          </button>
        </div>
        
        {submissionSuccess && (
          <div className="mb-6 bg-green-50 border border-green-500 text-green-700 p-4 rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Listing Submitted for Approval</span>
          </div>
        )}
        
        <BusinessMultiStepForm 
          mode={mode} 
          businessId={mode === 'edit' ? businessId : undefined}
          initialData={initialData || undefined}
          onComplete={handleComplete}
          communityId={communityId}
        />
      </div>
    </div>
  );
} 