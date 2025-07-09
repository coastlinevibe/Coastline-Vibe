"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function MyBusinessesPage() {
  const params = useParams() || {};
  const router = useRouter();
  const communityId = (params && typeof params === 'object' && 'communityId' in params) ? params.communityId as string : '';
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("You must be logged in to view your businesses");
        }
        
        // Fetch user profile to get approval status
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else {
          setUserProfile(profileData);
        }
        
        // Get community UUID for the current community slug
        let communityUuid = null;
        if (communityId) {
          const { data: communityData, error: communityError } = await supabase
            .from('communities')
            .select('id')
            .eq('slug', communityId)
            .single();
            
          if (communityError) {
            console.error("Error fetching community:", communityError);
          } else if (communityData) {
            communityUuid = communityData.id;
            console.log("Found community UUID:", communityUuid);
          }
        }
        
        // Fetch businesses owned by this user in this community
        let query = supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id);
          
        // Filter by community if we have a community UUID
        if (communityUuid) {
          query = query.eq('community_id', communityUuid);
        }
        
        const { data, error } = await query;
          
        if (error) throw error;
        
        setBusinesses(data || []);
      } catch (err: any) {
        console.error("Error fetching businesses:", err);
        setError(err.message || "Failed to load businesses");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [supabase, communityId]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-heading font-bold text-primaryTeal">My Businesses</h1>
        
        {/* Only show Create New Business button if user has a business role and no existing businesses */}
        {userProfile && userProfile.role === 'business' && businesses.length === 0 && (
          <Link 
            href={`/community/${communityId}/business/create`}
            className="px-4 py-2 bg-primaryTeal text-white rounded-md hover:bg-seafoam transition-colors"
          >
            Create New Business
          </Link>
        )}
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-grayLight">Loading...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-2">Error</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Display business account status banner */}
          {userProfile && userProfile.role === 'business' && !userProfile.is_approved && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
              <p className="flex items-center">
                <span className="mr-2">⚠️</span>
                Your business account is pending approval by administrators.
              </p>
            </div>
          )}
          
          {/* Show regular user message if not a business account */}
          {userProfile && userProfile.role !== 'business' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 mb-6">
              <p className="flex items-center">
                <span className="mr-2">ℹ️</span>
                Only business accounts can create business listings. To create a business, please contact an administrator to upgrade your account.
              </p>
              <div className="mt-3 flex gap-2">
                <Link 
                  href={`/community/${communityId}/business/directory`}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                >
                  View Business Directory
                </Link>
              </div>
            </div>
          )}
          
          {/* Show businesses if they exist */}
          {businesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map(business => (
                <div key={business.id} className="bg-white border border-seafoam/20 rounded-lg shadow-sm overflow-hidden">
                  {/* Business card header with image */}
                  <div className="h-40 bg-seafoam/10 relative">
                    {business.thumbnail_url || business.cover_url ? (
                      <img 
                        src={business.thumbnail_url || business.cover_url} 
                        alt={business.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-seafoam/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        business.approval_status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : business.approval_status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {business.approval_status === 'approved' 
                          ? 'Approved' 
                          : business.approval_status === 'rejected'
                            ? 'Rejected'
                            : 'Pending Approval'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Business details */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-primaryTeal mb-1">{business.name}</h3>
                    <p className="text-sm text-grayLight mb-3 line-clamp-2">{business.description || 'No description provided'}</p>
                    
                    <div className="flex justify-end mt-4 gap-2">
                      <Link 
                        href={`/community/${communityId}/business/${business.id}`}
                        className="px-3 py-1 bg-seafoam/20 text-primaryTeal rounded hover:bg-seafoam/30 transition-colors text-sm"
                      >
                        View
                      </Link>
                      {/* Only show Edit button for business accounts */}
                      {userProfile && userProfile.role === 'business' && (
                        <Link 
                          href={`/community/${communityId}/business/edit/${business.id}`}
                          className="px-3 py-1 bg-primaryTeal text-white rounded hover:bg-seafoam transition-colors text-sm"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-sand/50 border border-seafoam/20 rounded-lg p-8 text-center">
              <h2 className="text-xl font-heading font-semibold text-primaryTeal mb-4">
                {userProfile && userProfile.role === 'business' 
                  ? "No Businesses Yet" 
                  : "No Saved Businesses"
                }
              </h2>
              <p className="text-darkCharcoal mb-6">
                {userProfile && userProfile.role === 'business' 
                  ? "You haven't created any business listings yet." 
                  : "You haven't saved any businesses to your favorites yet."
                }
              </p>
              
              {/* Only show business creation link for business accounts */}
              {userProfile && userProfile.role === 'business' ? (
                <Link 
                  href={`/community/${communityId}/business/create`}
                  className="px-6 py-3 bg-primaryTeal text-white rounded-md hover:bg-seafoam transition-colors inline-block"
                >
                  Create Your First Business
                </Link>
              ) : (
                <Link 
                  href={`/community/${communityId}/business/directory`}
                  className="px-6 py-3 bg-primaryTeal text-white rounded-md hover:bg-seafoam transition-colors inline-block"
                >
                  Browse Businesses
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 