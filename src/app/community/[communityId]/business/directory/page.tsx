"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { BusinessCard } from "@/components/BusinessCard";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Filter, List, Map as MapIcon, SlidersHorizontal } from "lucide-react";

// Import our new filter components
import AdvancedFilterSidebar from "@/components/shared/AdvancedFilterSidebar";
import ActiveFiltersTags from "@/components/shared/ActiveFiltersTags";

// Dynamically import the map component to avoid SSR issues with mapbox-gl
const BusinessMapView = dynamic(
  () => import("@/components/shared/BusinessMapView"),
  { ssr: false }
);

// Add types for query responses
type Category = {
  id: string;
  name: string;
};

type Subcategory = {
  id: string;
  name: string;
  category_id: string;
};

type Business = {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  cover_image_url: string;
  is_featured: boolean;
  community_id: string;
  category_id: string;
  subcategory_id: string;
  category?: { id: string; name: string };
  subcategory?: { id: string; name: string };
  category_name?: string;
  subcategory_name?: string;
  rating?: number;
  contact_phone?: string;
  contact_email?: string;
  location?: { latitude: number; longitude: number } | null;
};

export default function BusinessDirectoryPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const params = useParams();
  const communityId = (params?.communityId as string) || '';
  const router = useRouter();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [communityUuid, setCommunityUuid] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Enhanced filter state
  const [filters, setFilters] = useState<Record<string, any>>({
    search: "",
    category: "",
    location: {},
    amenities: [],
    price: {},
    hours: {},
    rating: 0,
    sort: "featured"
  });
  
  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching user role:', profileError);
          setUserRole(null);
        } else {
          setUserRole(profileData?.role || null);
        }
      }
    };
    
    fetchUserRole();
  }, [supabase]);

  // Get community UUID from slug
  useEffect(() => {
    const fetchCommunityUuid = async () => {
      console.log("Fetching community UUID for slug:", communityId);
      
      // Debug: Log the communities table to check if the community exists
      const { data: allCommunities, error: communityListError } = await supabase
        .from('communities')
        .select('id, name, slug')
        .limit(10);
        
      if (communityListError) {
        console.error("Error fetching communities list:", communityListError);
      } else {
        console.log("Available communities:", allCommunities);
      }
      
      // Now try to find the specific community by slug
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', communityId)
        .single();
      
      if (communityError) {
        console.error("Error fetching community UUID:", communityError);
        setCommunityUuid(null); // Set to null on error
        return;
      }
      
      if (communityData) {
        console.log("Found community UUID:", communityData.id);
        setCommunityUuid(communityData.id);
      } else {
        console.log("No community found with slug:", communityId);
        setCommunityUuid(null); // Set to null if no data
      }
    };
    
    if (communityId) { // Only run if communityId (slug) is present
      fetchCommunityUuid();
    }
  }, [supabase, communityId]);

  // Get categories and subcategories
  useEffect(() => {
    supabase.from("categories").select("id, name").then(res => {
      if (!res.error && res.data) setCategories(res.data);
      else if (res.error) console.error("Error fetching categories:", res.error);
    });
    supabase.from("subcategories").select("id, name, category_id").then(res => {
      if (!res.error && res.data) setSubcategories(res.data);
      else if (res.error) console.error("Error fetching subcategories:", res.error);
    });
  }, [supabase]);

  // Fetch businesses for the community
  useEffect(() => {
    if (!communityUuid) return; // Wait until we have the community UUID
    setLoading(true);

    // If no filters/search, fetch first 12 businesses
    const noFilters = Object.keys(filters).every(key => {
      if (key === 'search' || key === 'category') return !filters[key];
      if (key === 'rating') return filters[key] === 0;
      if (key === 'sort') return filters[key] === 'featured';
      if (key === 'amenities') return !filters[key].length;
      if (key === 'location' || key === 'price' || key === 'hours') {
        return Object.keys(filters[key]).length === 0;
      }
      return true;
    });

    if (noFilters) {
      supabase
        .from("businesses")
        .select(`
          *,
          category:category_id(id, name),
          subcategory:subcategory_id(id, name)
        `)
        .eq("community_id", communityUuid)
        .limit(12)
        .then(res => {
          setLoading(false);
          if (!res.error) {
            const transformedData = res.data.map(business => ({
              ...business,
              category_name: business.category?.name,
              subcategory_name: business.subcategory?.name
            }));
            setBusinesses(transformedData);
          } else {
            console.error("Error fetching all businesses:", res.error);
          }
        });
      return;
    }

    // Otherwise, run the searchBusinesses logic
    searchBusinesses();
  }, [supabase, communityUuid, filters]);

  // Fetch unique neighborhoods for the current community
  useEffect(() => {
    if (!communityUuid) return;
    supabase
      .from("businesses")
      .select("neighborhood")
      .eq("community_id", communityUuid)
      .then(res => {
        if (!res.error && res.data) {
          const unique = Array.from(new Set(res.data.map(b => b.neighborhood).filter(Boolean)));
          setNeighborhoods(unique);
        }
      });
  }, [supabase, communityUuid]);

  // Search businesses function
  const searchBusinesses = () => {
    if (!communityUuid) {
      console.error("Cannot search: community UUID is missing");
      return;
    }
    
    console.log("Searching businesses with filters:", {
      community: communityUuid,
      filters
    });
    
    setLoading(true);
    
    // Debug: First check if any businesses exist at all for this community
    supabase
      .from("businesses")
      .select("id, name")
      .eq("community_id", communityUuid)
      .then(res => {
        if (!res.error) {
          console.log("All businesses in community (without filters):", res.data);
          if (res.data.length === 0) {
            console.log("No businesses found for this community at all");
          }
        } else {
          console.error("Error in preliminary business check:", res.error);
        }
      });
    
    // Build the query
    let query = supabase
      .from("businesses")
      .select(`
        *,
        category:category_id(id, name),
        subcategory:subcategory_id(id, name)
      `)
      .eq("community_id", communityUuid);
    
    // Add filters if they exist
    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }
    
    if (filters.category) {
      query = query.eq("category_id", filters.category);
    }
    
    if (filters.location?.neighborhood) {
      query = query.eq("neighborhood", filters.location.neighborhood);
    }
    
    if (filters.location?.radius && filters.location?.coordinates) {
      query = query.filter(
        "location",
        "st_d_within",
        `SRID=4326;POINT(${filters.location.coordinates.lng} ${filters.location.coordinates.lat}),${filters.location.radius * 1000}`
      );
    }
    
    if (filters.rating > 0) {
      query = query.gte("rating", filters.rating);
    }
    
    if (filters.amenities && filters.amenities.length > 0) {
      // Assuming amenities are stored in a JSONB column called 'amenities'
      filters.amenities.forEach((amenity: string) => {
        query = query.contains('amenities', [amenity]);
      });
    }
    
    if (filters.hours?.openNow) {
      // This would require a more complex query to check current time against business hours
      // For now, we'll just log that this filter was applied
      console.log("Open Now filter applied - would need server-side implementation");
    }
    
    if (filters.price?.tier) {
      query = query.eq('price_tier', filters.price.tier);
    } else if (filters.price?.range) {
      query = query
        .gte('price_min', filters.price.range.min)
        .lte('price_max', filters.price.range.max);
    }
    
    // Apply sorting
    switch (filters.sort) {
      case "rating_high":
        query = query.order("rating", { ascending: false });
        break;
      case "rating_low":
        query = query.order("rating", { ascending: true });
        break;
      case "name_asc":
        query = query.order("name", { ascending: true });
        break;
      case "name_desc":
        query = query.order("name", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "featured":
      default:
        query = query.order("is_featured", { ascending: false }).order("rating", { ascending: false });
        break;
    }
    
    // Execute the query
    query.then(res => {
      setLoading(false);
      if (!res.error) {
        console.log("Search results:", res.data.length, "businesses found");
        console.log("Result details:", res.data);
        const transformedData = res.data.map(business => ({
          ...business,
          category_name: business.category?.name,
          subcategory_name: business.subcategory?.name
        }));
        setBusinesses(transformedData);
      } else {
        console.error("Error searching businesses:", res.error);
      }
    });
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle removing a filter
  const handleRemoveFilter = (key: string, subKey?: string) => {
    if (key === 'amenities' && subKey) {
      setFilters(prev => ({
        ...prev,
        amenities: prev.amenities.filter((item: string) => item !== subKey)
      }));
    } else {
      setFilters(prev => {
        const newFilters = { ...prev };
        if (key === 'location' || key === 'price' || key === 'hours') {
          newFilters[key] = {};
        } else if (key === 'amenities') {
          newFilters[key] = [];
        } else if (key === 'rating') {
          newFilters[key] = 0;
        } else if (key === 'sort') {
          newFilters[key] = 'featured';
        } else {
          newFilters[key] = '';
        }
        return newFilters;
      });
    }
  };
  
  // Clear all filters
  const handleClearAllFilters = () => {
    setFilters({
      search: "",
      category: "",
      location: {},
      amenities: [],
      price: {},
      hours: {},
      rating: 0,
      sort: "featured"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-blue-50">
      {/* Development Note: Display user role for context */}
      {userRole && (
        <div className="mb-4 p-3 bg-sky-100 text-sky-700 rounded-md text-sm">
          {userRole === 'community admin' && (
            <>You're viewing the business directory as a community administrator. You can create and manage all businesses.</>
          )}
          {userRole === 'business' && (
            <>You're viewing the business directory as a business account. You can create and manage your own businesses.</>
          )}
          {userRole !== 'community admin' && userRole !== 'business' && (
            <>You're viewing the business directory as a regular member. You can view businesses but not create them.</>
          )}
        </div>
      )}
      
      {/* Navigation tabs for business and admin users */}
      {(userRole === 'business' || userRole === 'community admin') && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={`/community/${communityId}/business/directory`}
            className="px-4 py-2 bg-white rounded-md shadow-sm border border-gray-200 text-cyan-700 font-medium hover:bg-gray-50 transition-colors"
          >
            All Businesses
          </Link>
          <Link
            href={`/community/${communityId}/business/directory/my-businesses`}
            className="px-4 py-2 bg-white rounded-md shadow-sm border border-gray-200 text-cyan-700 font-medium hover:bg-gray-50 transition-colors"
          >
            My Businesses
          </Link>
          <Link
            href={`/community/${communityId}/business/create`}
            className="px-4 py-2 bg-primaryTeal rounded-md shadow-sm text-white font-medium hover:bg-teal-600 transition-colors"
          >
            + Create Business
          </Link>
        </div>
      )}
      
      {/* 1. Modern Search/Filter Bar */}
      <section className="w-full bg-gradient-to-r from-primaryTeal/60 to-seafoam/40 py-12 md:py-16 flex flex-col items-center justify-center text-center relative">
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-offWhite mb-2 drop-shadow">
          {communityId ? `${communityId} – Business Directory` : 'Business Directory'}
        </h1>
        <p className="text-lg text-offWhite mb-6 md:mb-8 font-body drop-shadow">
          Discover local businesses by type, area, or rating.
        </p>
        
        <div className="flex justify-center w-full max-w-content mx-auto px-4">
          <form
            className="flex flex-col sm:flex-row items-center w-full max-w-2xl gap-3 bg-white rounded-xl shadow-subtle p-2"
            onSubmit={e => { 
              e.preventDefault();
              searchBusinesses();
            }}
          >
            <input
              type="text"
              placeholder="What are you finding?"
              className="w-full sm:flex-1 px-4 py-3 rounded-lg border-none bg-transparent text-darkCharcoal font-body focus:ring-2 focus:ring-primaryTeal focus:outline-none text-base"
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-primaryTeal text-offWhite font-semibold font-body text-base hover:bg-seafoam transition shadow-elevated"
              >
                Search
              </button>
              <button
                type="button"
                className="flex-1 sm:flex-none px-5 py-3 rounded-lg bg-white border border-primaryTeal text-primaryTeal font-semibold font-body text-base hover:bg-primaryTeal hover:text-white transition shadow-sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <SlidersHorizontal size={18} className="inline-block mr-2" />
                Filters
              </button>
            </div>
          </form>
        </div>
      </section>
      
      {/* Main Content with Advanced Filter Sidebar */}
      <div className="container mx-auto px-4 py-8">
        {/* View Toggle and Sort Controls */}
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md flex items-center ${
                viewMode === 'list' 
                  ? 'bg-primaryTeal text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <List size={18} className="mr-2" />
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-2 rounded-md flex items-center ${
                viewMode === 'map' 
                  ? 'bg-primaryTeal text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MapIcon size={18} className="mr-2" />
              Map View
            </button>
          </div>
          
          <div className="flex items-center">
            <label className="text-sm text-gray-600 mr-2">Sort by:</label>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primaryTeal focus:border-primaryTeal"
            >
              <option value="featured">Featured</option>
              <option value="rating_high">Highest Rated</option>
              <option value="rating_low">Lowest Rated</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
        
        {/* Active Filters Tags */}
        <ActiveFiltersTags 
          filters={filters} 
          onRemoveFilter={handleRemoveFilter}
          className="mb-6" 
        />
        
        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Advanced Filter Sidebar - only shown when showAdvancedFilters is true */}
          {showAdvancedFilters && (
            <div className="lg:w-72 flex-shrink-0">
              <AdvancedFilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearAllFilters={handleClearAllFilters}
                neighborhoods={neighborhoods}
                isCollapsible={true}
              />
            </div>
          )}
          
          {/* Business Listings */}
          <div className={`flex-1 ${showAdvancedFilters ? 'lg:ml-4' : ''}`}>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primaryTeal"></div>
              </div>
            ) : viewMode === 'list' ? (
              businesses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {businesses.map((business) => (
                    <BusinessCard key={business.id} business={business} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No businesses found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                </div>
              )
            ) : (
              <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
                <BusinessMapView 
                  businesses={businesses.map(business => ({
                    id: business.id,
                    name: business.name,
                    description: business.description || '',
                    logo_url: business.logo_url,
                    cover_image_url: business.cover_image_url,
                    location: business.location,
                    rating: business.rating,
                    category_name: business.category_name || '',
                    is_featured: business.is_featured
                  }))} 
                  initialViewState={{
                    longitude: 108.2022,
                    latitude: 16.0544,
                    zoom: 11
                  }}
                  communityId={communityId}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 