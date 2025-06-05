"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function MyBusinessesPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.communityId as string;
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
        
        // Fetch businesses owned by this user
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id);
          
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
  }, [supabase]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-heading font-bold text-primaryTeal">My Businesses</h1>
        <Link 
          href={`/community/${communityId}/business/create`}
          className="px-4 py-2 bg-primaryTeal text-white rounded-md hover:bg-seafoam transition-colors"
        >
          Create New Business
        </Link>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-grayLight">Loading your businesses...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-2">Error</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Display approval status banner if not approved */}
          {userProfile && userProfile.role === 'business' && !userProfile.is_approved && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
              <p className="flex items-center">
                <span className="mr-2">⚠️</span>
                Your business account is pending approval by administrators.
              </p>
            </div>
          )}
          
          {businesses.length === 0 ? (
            <div className="bg-sand/50 border border-seafoam/20 rounded-lg p-8 text-center">
              <h2 className="text-xl font-heading font-semibold text-primaryTeal mb-4">No Businesses Yet</h2>
              <p className="text-darkCharcoal mb-6">You haven't created any business listings yet.</p>
              <Link 
                href={`/community/${communityId}/business/create`}
                className="px-6 py-3 bg-primaryTeal text-white rounded-md hover:bg-seafoam transition-colors inline-block"
              >
                Create Your First Business
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {businesses.map((business) => (
                <div key={business.id} className="bg-white rounded-lg shadow-subtle overflow-hidden">
                  <div className="h-40 bg-seafoam/20 relative">
                    {business.thumbnail_url ? (
                      <img 
                        src={business.thumbnail_url} 
                        alt={business.name || business.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-grayLight">No image</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded text-xs font-medium">
                      {userProfile && userProfile.is_approved ? (
                        <span className="text-green-600">Approved</span>
                      ) : (
                        <span className="text-amber-600">Pending Approval</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h2 className="text-xl font-heading font-semibold text-primaryTeal mb-1">{business.name || business.title}</h2>
                    <p className="text-sm text-grayLight mb-4">
                      Created: {new Date(business.created_at).toLocaleDateString()}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 bg-seafoam/20 text-primaryTeal rounded-full text-xs">
                        {business.category_id || 'No Category'}
                      </span>
                      {business.featured_type && (
                        <span className="px-2 py-1 bg-coral/20 text-coral rounded-full text-xs">
                          {business.featured_type}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between mt-4">
                      <Link 
                        href={`/community/${communityId}/business/${business.id}`}
                        className="px-3 py-1 bg-seafoam/20 text-primaryTeal rounded hover:bg-seafoam/30 transition-colors"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/community/${communityId}/business/edit/${business.id}`}
                        className="px-3 py-1 bg-primaryTeal text-white rounded hover:bg-seafoam transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 