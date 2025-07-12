"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { BusinessCard } from "@/components/BusinessCard";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Filter, List, Map as MapIcon, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Import our filter components
import AdvancedFilterSidebar from "@/components/shared/AdvancedFilterSidebar";
import ActiveFiltersTags from "@/components/shared/ActiveFiltersTags";
import FloatingSocialShare from "../../../../../components/shared/FloatingSocialShare";
import { danangNeighborhoods, getNeighborhoodById } from "@/data/danang-neighborhoods";

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
  neighborhood?: string;
  neighborhood_id?: string;
  district?: string;
};

export default function BusinessDirectoryPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const params = useParams();
  const communityId = (params?.communityId as string) || '';
  const router = useRouter();
  const { t } = useTranslation();

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
      // Search across multiple fields using 'or' filter
      const search = filters.search;
      query = query.or(`
        name.ilike.%${search}%,
        description.ilike.%${search}%,
        address.ilike.%${search}%,
        category.name.ilike.%${search}%,
        subcategory.name.ilike.%${search}%
      `);
    }
    
    if (filters.category) {
      if (filters.category.categoryId) {
        query = query.eq("category_id", filters.category.categoryId);
    }
    
      if (filters.category.subcategoryId) {
        query = query.eq("subcategory_id", filters.category.subcategoryId);
      }
    }
    
    if (filters.location?.neighborhoodId) {
      // Get the neighborhood by ID
      const neighborhood = getNeighborhoodById(filters.location.neighborhoodId);
      if (neighborhood) {
        // Try to match either by neighborhood_id or by neighborhood name
        query = query.or(`neighborhood_id.eq.${filters.location.neighborhoodId},neighborhood.ilike.%${neighborhood.name.en}%,neighborhood.ilike.%${neighborhood.name.vi}%`);
        
        // Also set district if available
        if (neighborhood.district) {
          query = query.or(`district.eq.${neighborhood.district}`);
        }
      }
    } else if (filters.location?.district) {
      // Filter by district
      query = query.eq("district", filters.location.district);
    }
    
    if (filters.location?.radius && filters.location?.coordinates) {
      // Use PostGIS for spatial queries if available
      try {
      query = query.filter(
        "location",
        "st_d_within",
        `SRID=4326;POINT(${filters.location.coordinates.lng} ${filters.location.coordinates.lat}),${filters.location.radius * 1000}`
      );
      } catch (error) {
        console.error("Error with spatial query:", error);
        // Fallback to simple distance calculation if PostGIS is not available
        // This would need to be implemented on the client side
      }
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
            <>{t('directory.viewingAsAdmin', "You're viewing the business directory as a community administrator. You can create and manage all businesses.")}</>
          )}
          {userRole === 'business' && (
            <>{t('directory.viewingAsBusiness', "You're viewing the business directory as a business account. You can create and manage your own businesses.")}</>
          )}
          {userRole !== 'community admin' && userRole !== 'business' && (
            <>{t('directory.viewingAsUser', "You're viewing the business directory as a regular member. You can view businesses but not create them.")}</>
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
            {t('directory.allBusinesses', 'All Businesses')}
          </Link>
          <Link
            href={`/community/${communityId}/business/directory/my-businesses`}
            className="px-4 py-2 bg-white rounded-md shadow-sm border border-gray-200 text-cyan-700 font-medium hover:bg-gray-50 transition-colors"
          >
            {t('directory.myBusinesses', 'My Businesses')}
          </Link>
          <Link
            href={`/community/${communityId}/business/create`}
            className="px-4 py-2 bg-primaryTeal rounded-md shadow-sm text-white font-medium hover:bg-teal-600 transition-colors"
          >
            + {t('directory.createBusiness', 'Create Business')}
          </Link>
        </div>
      )}
      
      {/* 1. Modern Search/Filter Bar */}
      <section className="w-full bg-gradient-to-r from-primaryTeal/60 to-seafoam/40 py-12 md:py-16 flex flex-col items-center justify-center text-center relative">
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-offWhite mb-2 drop-shadow">
          {communityId ? `${communityId} – ${t('directory.title', 'Business Directory')}` : t('directory.title', 'Business Directory')}
        </h1>
        <p className="text-lg text-offWhite mb-6 md:mb-8 font-body drop-shadow">
          {t('directory.discoverBusinesses', 'Discover local businesses by type, area, or rating.')}
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
              placeholder={t('directory.findingWhat', 'What are you finding?')}
              className="w-full sm:flex-1 px-4 py-3 rounded-lg border-none bg-transparent text-darkCharcoal font-body focus:ring-2 focus:ring-primaryTeal focus:outline-none text-base"
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-primaryTeal text-offWhite font-semibold font-body text-base hover:bg-seafoam transition shadow-elevated"
              >
                {t('common.search', 'Search')}
              </button>
              <button
                type="button"
                className="flex-1 sm:flex-none px-5 py-3 rounded-lg bg-white border border-primaryTeal text-primaryTeal font-semibold font-body text-base hover:bg-primaryTeal hover:text-white transition shadow-sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                aria-expanded={showAdvancedFilters}
                aria-controls="advanced-filters-sidebar"
              >
                <SlidersHorizontal size={18} className="inline-block mr-2" />
                {t('common.filters', 'Filters')}
              </button>
            </div>
          </form>
        </div>
      </section>
      
      {/* Main Content with Advanced Filter Sidebar */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* View Toggle and Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 sm:px-3 py-2 rounded-md flex items-center ${
                viewMode === 'list' 
                  ? 'bg-primaryTeal text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <List size={16} className="mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">{t('directory.listView', 'List View')}</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-2 sm:px-3 py-2 rounded-md flex items-center ${
                viewMode === 'map' 
                  ? 'bg-primaryTeal text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MapIcon size={16} className="mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">{t('directory.mapView', 'Map View')}</span>
            </button>
          </div>
          
          <div className="flex items-center mt-2 sm:mt-0">
            <label className="text-xs sm:text-sm text-gray-600 mr-2">{t('directory.sortBy', 'Sort by:')}:</label>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-primaryTeal focus:border-primaryTeal"
            >
              <option value="featured">{t('directory.featured', 'Featured')}</option>
              <option value="rating_high">{t('directory.highestRated', 'Highest Rated')}</option>
              <option value="rating_low">{t('directory.lowestRated', 'Lowest Rated')}</option>
              <option value="name_asc">{t('directory.nameAsc', 'Name (A-Z)')}</option>
              <option value="name_desc">{t('directory.nameDesc', 'Name (Z-A)')}</option>
              <option value="newest">{t('directory.newest', 'Newest')}</option>
            </select>
          </div>
        </div>
        
        {/* Active Filters Tags */}
        <ActiveFiltersTags 
          filters={filters} 
          onRemoveFilter={handleRemoveFilter}
          className="mb-4 sm:mb-6 overflow-x-auto pb-2 flex flex-nowrap" 
        />
        
        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Advanced Filter Sidebar - only shown when showAdvancedFilters is true */}
          {showAdvancedFilters && (
            <div className="lg:w-72 flex-shrink-0 sticky top-0 max-h-screen overflow-y-auto z-10">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {businesses.map((business) => (
                    <BusinessCard key={business.id} business={business} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">{t('directory.noResults', 'No businesses found')}</h3>
                  <p className="text-gray-500 text-sm sm:text-base">{t('directory.tryAdjusting', 'Try adjusting your filters or search terms.')}</p>
                </div>
              )
            ) : (
              <div className="h-[400px] sm:h-[500px] md:h-[600px] rounded-lg overflow-hidden shadow-lg">
                <BusinessMapView 
                  businesses={businesses.map(business => {
                    // Extract category name safely
                    let categoryName = '';
                    if (typeof business.category === 'string') {
                      categoryName = business.category;
                    } else if (business.category && typeof business.category === 'object' && 'name' in business.category) {
                      categoryName = business.category.name;
                    } else if (business.category_name) {
                      categoryName = business.category_name;
                    }
                    
                    return {
                    id: business.id,
                    name: business.name,
                    description: business.description || '',
                      logo_url: business.logo_url || '',
                      cover_image_url: business.cover_image_url || '',
                    location: business.location,
                    rating: business.rating,
                      category_name: categoryName,
                      is_featured: business.is_featured,
                      neighborhood: business.neighborhood,
                      neighborhood_id: business.neighborhood_id,
                      district: business.district
                    };
                  })}
                  communityId={communityId}
                  initialViewState={{
                    longitude: 108.2022,
                    latitude: 16.0544,
                    zoom: 11
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Floating Social Share Button */}
      <FloatingSocialShare
        url={typeof window !== 'undefined' ? window.location.href : `/community/${communityId}/business/directory`}
        title="Business Directory"
        description="Discover local businesses in our community directory"
      />
    </div>
  );
} 