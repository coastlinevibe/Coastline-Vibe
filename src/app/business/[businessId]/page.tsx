"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";
import AccommodationTemplate from "../../../components/templates/AccommodationTemplate";

export default function BusinessDetailPage() {
  const params = useParams();
  const businessId = params?.businessId as string | undefined;
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
        const { data, error } = await supabase
          .from("businesses")
          .select("*, category:category_id(name)")
          .eq("id", businessId)
          .single();

        if (error) throw error;
        setBusiness(data);
      } catch (err: any) {
        setError(err.message || "Failed to load business details");
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchBusiness();
    }
  }, [businessId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primaryTeal">Loading...</div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-coral">
          {error || "Business not found"}
        </div>
      </div>
    );
  }

  // Determine which template to use based on the business category
  // For now, we only have the accommodation template
  const categoryName = business.category?.name;
  
  if (categoryName === "Accommodations") {
    return <AccommodationTemplate business={business} userRole={null} />;
  }
  
  // Default template for other business types
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-blue-50 py-8">
      <div className="max-w-content mx-auto px-4">
        <h1 className="text-3xl font-heading font-bold text-primaryTeal mb-4">{business.name}</h1>
        <p className="text-darkCharcoal mb-6">{business.description}</p>
        
        {/* Generic business details */}
        <div className="bg-white rounded-lg shadow-subtle p-6 mb-6">
          <h2 className="text-xl font-heading font-semibold text-primaryTeal mb-4">Business Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-grayLight">Category</p>
              <p>{categoryName}</p>
            </div>
            <div>
              <p className="text-sm text-grayLight">Contact</p>
              <p>{business.contact_email || "No email provided"}</p>
              <p>{business.contact_phone || "No phone provided"}</p>
            </div>
          </div>
        </div>
        
        {/* Location */}
        {business.address && (
          <div className="bg-white rounded-lg shadow-subtle p-6 mb-6">
            <h2 className="text-xl font-heading font-semibold text-primaryTeal mb-4">Location</h2>
            <p>{business.address}</p>
          </div>
        )}
      </div>
    </div>
  );
} 