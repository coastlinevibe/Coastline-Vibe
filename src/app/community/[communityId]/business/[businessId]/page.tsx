"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import AccommodationTemplate from "../../../../../components/templates/AccommodationTemplate";
import Link from "next/link";

export default function CommunityBusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;
  const communityId = params.communityId as string;
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        // First get community to check if it exists
        const { data: communityData, error: communityError } = await supabase
          .from("communities")
          .select("id, name, slug")
          .eq("slug", communityId)
          .single();

        if (communityError) throw new Error("Community not found");

        // Now get the business
        const { data, error } = await supabase
          .from("businesses")
          .select("*, category:category_id(name), subcategory:subcategory_id(name)")
          .eq("id", businessId)
          .single();

        if (error) throw error;
        
        // Check if business belongs to this community
        if (data.community_id !== communityData.id) {
          throw new Error("This business doesn't belong to the selected community");
        }
        
        console.log("Business data loaded:", data);
        console.log("Gallery URLs:", data.gallery_urls);
        
        setBusiness(data);
      } catch (err: any) {
        console.error("Error fetching business:", err);
        setError(err.message || "Failed to load business details");
      } finally {
        setLoading(false);
      }
    };

    if (businessId && communityId) {
      fetchBusiness();
    }
  }, [businessId, communityId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyan-600">Loading...</div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-2">Error</h2>
          <p>{error || "Business not found"}</p>
          <button 
            onClick={() => router.push(`/community/${communityId}/business/directory`)}
            className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
          >
            Back to Directory
          </button>
        </div>
      </div>
    );
  }

  // Determine which template to use based on the business category
  const categoryName = business.category?.name;
  
  if (categoryName === "Accommodations") {
    return <AccommodationTemplate business={business} />;
  }
  
  // Default template for other business types
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <Link 
            href={`/community/${communityId}/business/directory/my-businesses`}
            className="flex items-center text-cyan-700 hover:text-cyan-900"
          >
            <span>← Back to My Businesses</span>
          </Link>
          
          <button 
            onClick={() => router.push(`/community/${communityId}/business/directory`)}
            className="text-cyan-700 hover:text-cyan-900"
          >
            Back to Directory
          </button>
        </div>
      
        {/* Business header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {business.banner_url && (
            <img src={business.banner_url} alt="Banner" className="w-full h-48 object-cover" />
          )}
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {business.logo_url && (
                <img src={business.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-cyan-900">{business.name || business.title}</h1>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs">{categoryName}</span>
                  {business.subcategory && (
                    <span className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded text-xs">{business.subcategory?.name}</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-line">{business.description}</p>
          </div>
        </div>
        
        {/* Contact & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-cyan-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {business.phone && <p className="flex items-center gap-2"><span className="text-cyan-500">📞</span> {business.phone}</p>}
              {business.email && <p className="flex items-center gap-2"><span className="text-cyan-500">✉️</span> {business.email}</p>}
              {business.website && (
                <p className="flex items-center gap-2">
                  <span className="text-cyan-500">🌐</span>
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">{business.website}</a>
                </p>
              )}
              {business.facebook && (
                <p className="flex items-center gap-2">
                  <span className="text-cyan-500">👍</span>
                  <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">Facebook</a>
                </p>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-cyan-900 mb-4">Location</h2>
            <div className="space-y-3">
              <p className="flex items-center gap-2"><span className="text-cyan-500">📍</span> {business.address}</p>
              <p className="flex items-center gap-2"><span className="text-cyan-500">🏙️</span> {business.city}, {business.country}</p>
              {(business.latitude && business.longitude) && (
                <div className="mt-4 h-40 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Map preview (coming soon)</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Amenities (if available) */}
        {business.amenities && business.amenities.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-cyan-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {business.amenities.map((amenity: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-cyan-500">✓</span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Gallery (if available) */}
        {business.gallery_urls && business.gallery_urls.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-cyan-900 mb-4">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {business.gallery_urls.map((url: string, idx: number) => (
                <img 
                  key={idx} 
                  src={url} 
                  alt={`Gallery image ${idx+1}`} 
                  className="rounded-lg object-cover w-full h-40"
                  onError={(e) => {
                    console.error("Error loading gallery image:", e);
                    e.currentTarget.src = "/placeholder-business.jpg";
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Business hours (if available) */}
        {business.schedule && Object.keys(business.schedule).length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-cyan-900 mb-4">Business Hours</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const schedule = business.schedule[day];
                if (!schedule) return null;
                
                return (
                  <div key={day} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium capitalize">{day}</span>
                    <span>
                      {schedule.open && schedule.close ? 
                        `${schedule.open} - ${schedule.close}` : 
                        'Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 