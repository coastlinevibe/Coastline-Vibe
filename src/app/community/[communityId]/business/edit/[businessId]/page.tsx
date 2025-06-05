"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BusinessEditTabsForm from "../../../../../../components/shared/BusinessEditTabsForm";

// Copy BusinessFormState type here for local use
interface BusinessFormState {
  title: string;
  description: string;
  category: string;
  subCategory: string;
  featuredType: string;
  amenities: string[];
  facilities: string[];
  facility_hours: {
    [key: string]: {
      open: string;
      close: string;
      days: string;
    };
  };
  country: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  thumbnail: File | null;
  cover: File | null;
  videoProvider: string;
  videoUrl: string;
  gallery: File[];
  tags: string[];
  metaTags: string[];
  schedule: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  website: string;
  email: string;
  phone: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  businessTypes: string[];
  menuName: string;
  menuPrice: string;
  menuItems: string[];
  menuImage: File | null;
}
 
export default function EditBusinessPage() {
  const params = useParams() ?? {};
  const router = useRouter();
  const businessId = (params as any).businessId as string;
  const communityId = (params as any).communityId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<BusinessFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single();
        if (error) throw error;
        if (!data) throw new Error("Business not found");
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
          thumbnail: null,
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
        setError(err.message || 'Failed to load business data');
      } finally {
        setIsLoading(false);
      }
    };
    if (businessId) fetchBusinessData();
  }, [businessId]);

  const handleComplete = (id: string) => {
    router.push(`/community/${communityId}/business/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-primaryTeal">Loading...</div>
      </div>
    );
  }
  if (error || !initialData) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-2">Error</h2>
        <p>{error || 'No data found'}</p>
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
          <h1 className="text-2xl font-heading font-bold text-primaryTeal">Edit Business</h1>
          <p className="text-grayLight">Update your business information below</p>
        </div>
        <BusinessEditTabsForm businessId={businessId} initialData={initialData} onComplete={handleComplete} />
      </div>
    </div>
  );
} 