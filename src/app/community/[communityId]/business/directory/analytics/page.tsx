"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import EnhancedBusinessAnalyticsDashboard from "@/components/shared/EnhancedBusinessAnalyticsDashboard";

export default function BusinessAnalyticsPage() {
  const params = useParams() || {};
  const communityId = params && typeof params === 'object' && 'communityId' in params 
    ? params.communityId as string 
    : '';
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserBusiness() {
      setLoading(true);
      setError(null);
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError("You must be logged in to view your business analytics.");
          setLoading(false);
          return;
        }
        // Get community ID from slug if needed
        let communityData;
        if (communityId) {
          const { data: communityResult, error: communityError } = await supabase
            .from('communities')
            .select('id')
            .eq('slug', communityId)
            .single();
          if (!communityError && communityResult) {
            communityData = communityResult;
          }
        }
        const actualCommunityId = communityData?.id || communityId;
        // Fetch only the user's business in this community
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name')
          .eq('community_id', actualCommunityId)
          .eq('user_id', user.id)
          .order('name');
        if (error) throw error;
        setBusiness(data && data.length > 0 ? data[0] : null);
      } catch (error: any) {
        setError(error.message || "Failed to load business");
      } finally {
        setLoading(false);
      }
    }
    if (communityId) {
      fetchUserBusiness();
    }
  }, [communityId, supabase]);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <div className="mb-6">
          {error ? (
            <div className="text-red-500 mb-2">{error}</div>
          ) : loading ? (
            <div className="text-gray-500 mb-2">Loading...</div>
          ) : business ? (
            <h1 className="text-2xl font-bold mb-4">{business.name} Analytics</h1>
          ) : (
            <div className="text-gray-500">No business found for your account in this community.</div>
          )}
        </div>
        {/* Enhanced Analytics Dashboard */}
        {business && business.id ? (
          <EnhancedBusinessAnalyticsDashboard businessId={business.id} />
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Select a business to view analytics</p>
          </div>
        )}
      </div>
    </div>
  );
} 