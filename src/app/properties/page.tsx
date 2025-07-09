"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import FilterSidebar from '@/components/shared/FilterSidebar';
import { propertyFilters } from '@/constants/filters';
import LocationFilter from '@/components/shared/filter-panels/LocationFilter';
import PropertyTypeFilter from '@/components/shared/filter-panels/PropertyTypeFilter';
import PriceFilter from '@/components/shared/filter-panels/PriceFilter';
import BedroomsFilter from '@/components/shared/filter-panels/BedroomsFilter';
import AmenitiesFilter from '@/components/shared/filter-panels/AmenitiesFilter';

type Property = {
  id: string;
  title: string;
  description: string;
  imageFiles: string[];
  price: number;
  city: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  listingType: string;
  isFurnished: boolean;
  hasParking: boolean;
  isPetFriendly: boolean;
  squarefeet: number;
  created_at: string;
  videoUrl?: string;
};

interface PropertiesPageProps {
  communityId: string;
}

function PropertyCard({ property, onDelete, favoriteIds, userId, onToggleFavorite }: { property: Property; onDelete?: () => void; favoriteIds: string[]; userId: string | null; onToggleFavorite?: (propertyId: string, isFav: boolean) => void }) {
  // Build gallery: only images for the card
  const galleryItems: { type: 'video' | 'image'; url: string }[] = [];
  if (property.imageFiles && property.imageFiles.length > 0) {
    galleryItems.push(...property.imageFiles.map(url => ({ type: 'image' as const, url })));
  }
  if (galleryItems.length === 0) {
    galleryItems.push({ type: 'image' as const, url: 'https://via.placeholder.com/400x200?text=No+Image' });
  }
  const [imgIdx, setImgIdx] = useState(0);
  const showArrows = galleryItems.length > 1;
  // Video controls state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((idx) => (idx === 0 ? galleryItems.length - 1 : idx - 1));
    setIsVideoPlaying(false);
  };
  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((idx) => (idx === galleryItems.length - 1 ? 0 : idx + 1));
    setIsVideoPlaying(false);
  };

  // Pause video when switching away
  React.useEffect(() => {
    if (galleryItems[imgIdx]?.type !== 'video' && videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  }, [imgIdx]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  const handleVideoPlay = () => setIsVideoPlaying(true);
  const handleVideoPause = () => setIsVideoPlaying(false);

  const isFavorite = favoriteIds.includes(property.id);
  const handleFavClick = () => {
    if (onToggleFavorite) onToggleFavorite(property.id, isFavorite);
  };

  return (
    <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl shadow-lg p-5 flex flex-col relative border border-cyan-100">
      <div className="relative group">
        {/* Favorite Star Icon */}
        <button
          className={`absolute top-2 right-2 z-10 p-1 rounded-full border ${isFavorite ? 'bg-yellow-200 text-yellow-600 border-yellow-300' : 'bg-white text-gray-400 border-gray-200'} hover:bg-yellow-100`}
          onClick={handleFavClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          disabled={!userId}
        >
          {isFavorite ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.386-2.46a1 1 0 00-1.175 0l-3.386 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.967z" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.386-2.46a1 1 0 00-1.175 0l-3.386 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.967z" /></svg>
          )}
        </button>
        {galleryItems[imgIdx].type === 'video' ? (
          <div className="relative">
            <video
              ref={videoRef}
              src={galleryItems[imgIdx].url}
              controls={false}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              className="w-full h-40 object-cover rounded-xl mb-3 border-2 border-sky-100 shadow-sm bg-black"
              onMouseEnter={() => setShowOverlay(true)}
              onMouseLeave={() => setShowOverlay(false)}
            />
            {/* Play/Pause Button Overlay */}
            {(!isVideoPlaying || showOverlay) && (
              <button
                type="button"
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center focus:outline-none"
                style={{ pointerEvents: 'auto' }}
                tabIndex={-1}
              >
                <span className="bg-white bg-opacity-80 rounded-full p-3 shadow-lg">
                  {isVideoPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <polygon points="6,4 20,12 6,20 6,4" fill="currentColor" />
                    </svg>
                  )}
                </span>
              </button>
            )}
          </div>
        ) : (
          <img
            src={galleryItems[imgIdx].url}
            alt={property.title}
            className="w-full h-40 object-cover rounded-xl mb-3 border-2 border-sky-100 shadow-sm"
          />
        )}
        {showArrows && (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-cyan-100 border border-cyan-200"
              onClick={prevImg}
              aria-label="Previous image"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-cyan-100 border border-cyan-200"
              onClick={nextImg}
              aria-label="Next image"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </>
        )}
        <span
          className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md ${
            property.listingType === 'Sale' ? 'bg-teal-500' : 'bg-sky-500'
          }`}
        >
          {property.listingType}
        </span>
      </div>
      <h3 className="font-semibold text-lg mb-1 text-cyan-900">
        <Link href={`/properties/${property.id}`} className="hover:underline">
          {property.title}
        </Link>
      </h3>
      <div className="text-xs text-cyan-500 mb-1">Listed: {new Date(property.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
      <div className="text-cyan-700 text-sm mb-2">
        {property.city}, {property.location}
      </div>
      <div className="font-bold text-xl mb-2 text-sky-700">
        {property.listingType === 'Sale' ? '$' + property.price.toLocaleString() : '$' + property.price + ' /mo'}
      </div>
      <div className="text-cyan-600 text-xs mb-2 line-clamp-3 whitespace-pre-line">
        {property.description && property.description.length > 0 ? (
          <>
            {property.description}
            {property.description.length > 120 && (
              <Link href={`/properties/${property.id}`} className="text-blue-600 hover:underline ml-1">Read more...</Link>
            )}
          </>
        ) : null}
      </div>
      <div className="flex gap-3 text-sm text-cyan-800 mb-2">
        <span>{property.bedrooms} bed</span>
        <span>{property.bathrooms} bath</span>
        <span>{property.propertyType}</span>
      </div>
      <div className="flex gap-2 text-xs text-cyan-400 mt-auto">
        {property.isFurnished && <span>Furnished</span>}
        {property.hasParking && <span>Parking</span>}
        {property.isPetFriendly && <span>Pet Friendly</span>}
      </div>
      <div className="flex gap-2 mt-4">
        <Link href={`/properties/${property.id}/edit`} className="px-3.5 py-1.5 rounded bg-sky-100 text-sky-700 text-xs font-medium hover:bg-sky-200 transition text-sm">
          Edit
        </Link>
        <button
          className="px-3.5 py-1.5 rounded bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition text-sm"
          onClick={onDelete}
        >
          Delete
        </button>
        <Link href={`/properties/${property.id}`} className="px-3.5 py-1.5 rounded bg-teal-100 text-teal-700 text-xs font-medium hover:bg-teal-200 transition text-sm">
          View
        </Link>
      </div>
    </div>
  );
}

export default function PropertiesPage({ communityId }: PropertiesPageProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Rent' | 'Sale'>('All');
  const [sortOrder, setSortOrder] = useState<'high' | 'low' | 'newest'>('low');
  
  // Filter sidebar state
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Initialize collapsed state based on screen width
  useEffect(() => {
    setCollapsed(window.innerWidth < 768);
    
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleFilterChange = (key: string, value: any) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }));
    setOpenKey(null); // close panel
  };
  
  const clearAllFilters = () => {
    setSelectedFilters({});
  };

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user and their property favorites
  useEffect(() => {
    const fetchUserAndFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Fetch property favorites for this user and community
        let favQuery = supabase
          .from('property_favorites')
          .select('property_id')
          .eq('user_id', user.id);
        if (communityId) {
          favQuery = favQuery.eq('community_id', communityId);
        }
        const { data: favs } = await favQuery;
        if (favs) {
          setFavoriteIds(favs.map((f: any) => f.property_id));
        }
      }
    };
    fetchUserAndFavorites();
  }, [communityId]);

  useEffect(() => {
    fetchProperties();
  }, [activeTab, selectedFilters, sortOrder]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('properties')
        .select('*')
        .eq('approval_status', 'approved');

      // Apply filters
      if (activeTab !== 'All') {
        query = query.eq('listingType', activeTab);
      }

      // Apply location filter
      if (selectedFilters.location?.city) {
        query = query.ilike('city', `%${selectedFilters.location.city}%`);
        
        // If area is also provided, filter by area/location too
        if (selectedFilters.location.area) {
          query = query.or(`location.ilike.%${selectedFilters.location.area}%`);
        }
      }

      // Apply property type filter
      if (selectedFilters.type) {
        query = query.eq('propertyType', selectedFilters.type);
      }

      // Apply price range filter
      if (selectedFilters.price?.min) {
        query = query.gte('price', selectedFilters.price.min);
      }
      if (selectedFilters.price?.max) {
        query = query.lte('price', selectedFilters.price.max);
      }

      // Apply bedrooms filter
      if (selectedFilters.beds && selectedFilters.beds !== 'Any') {
        if (selectedFilters.beds === '5+') {
          query = query.gte('bedrooms', 5);
        } else {
          query = query.eq('bedrooms', parseInt(selectedFilters.beds));
        }
      }

      // Apply amenities filters
      if (selectedFilters.amenities?.length > 0) {
        for (const amenity of selectedFilters.amenities) {
          if (amenity === 'furnished') {
            query = query.eq('isFurnished', true);
          } else if (amenity === 'parking') {
            query = query.eq('hasParking', true);
          } else if (amenity === 'petFriendly') {
            query = query.eq('isPetFriendly', true);
          }
          // Additional amenity filters can be added here
        }
      }

      // Apply sorting
      if (sortOrder === 'high') {
        query = query.order('price', { ascending: false });
      } else if (sortOrder === 'low') {
        query = query.order('price', { ascending: true });
      } else if (sortOrder === 'newest') {
        query = query.order('created_at', { ascending: false });
      }

      console.log('Executing query...');
      const { data, error } = await query;
      console.log('Query result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setProperties(data || []);
    } catch (err: any) {
      console.error('Error in fetchProperties:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    console.log('Attempting to delete property with id:', id);
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Property deleted successfully:', id);
      // Refresh properties after deletion
      fetchProperties();
      setDeleteId(null);
    } catch (err: any) {
      console.error('Error in handleDeleteProperty:', err);
      setError(err.message);
    }
  };

  // Add handler to toggle favorite
  const handleToggleFavorite = async (propertyId: string, isFav: boolean) => {
    if (!userId) return;
    if (isFav) {
      // Remove from favorites
      let delQuery = supabase
        .from('property_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId);
      if (communityId) {
        delQuery = delQuery.eq('community_id', communityId);
      }
      await delQuery;
      setFavoriteIds(ids => ids.filter(id => id !== propertyId));
    } else {
      // Add to favorites
      const insertData: any = { user_id: userId, property_id: propertyId };
      if (communityId) insertData.community_id = communityId;
      await supabase
        .from('property_favorites')
        .insert(insertData);
      setFavoriteIds(ids => [...ids, propertyId]);
    }
  };

  const listingTypes = [
    'All',
    'Rent',
    'Sale',
    'Short Term Rental',
    'Shared Accommodation',
    'Sublet',
    'Co-living',
    'Vacation Rental',
    'Commercial Lease',
    'Lease to Own',
    'Auction',
    'Exchange'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 flex gap-6">
        {/* Filter Sidebar */}
        <div className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex-shrink-0`}>
          <FilterSidebar
            filters={propertyFilters}
            selectedFilters={selectedFilters}
            openKey={openKey}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            onOpenKeyChange={setOpenKey}
            onFilterChange={handleFilterChange}
            onClearAll={clearAllFilters}
          >
            <LocationFilter 
              filterKey="location" 
              value={selectedFilters.location} 
              onChange={(value) => handleFilterChange('location', value)}
            />
            <PropertyTypeFilter 
              filterKey="type" 
              value={selectedFilters.type} 
              onChange={(value) => handleFilterChange('type', value)}
            />
            {/* Property Options label below Property Type */}
            <div className="px-2 py-1 text-xs font-semibold text-cyan-700 uppercase tracking-wide">Property Options</div>
            <PriceFilter 
              filterKey="price" 
              value={selectedFilters.price} 
              onChange={(value) => handleFilterChange('price', value)}
            />
            <BedroomsFilter 
              filterKey="beds" 
              value={selectedFilters.beds} 
              onChange={(value) => handleFilterChange('beds', value)}
            />
            <AmenitiesFilter 
              filterKey="amenities" 
              value={selectedFilters.amenities} 
              onChange={(value) => handleFilterChange('amenities', value)}
            />
          </FilterSidebar>
        </div>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Miami Properties</h1>
              <div className="text-cyan-700 text-base font-medium mt-1">Find rentals, sales, and short/long-term stays</div>
              {loading && <p className="text-sm text-gray-500">Loading...</p>}
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 select-none">
                <span className="text-sm font-medium">Show Favorite Properties</span>
                <button
                  type="button"
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none border ${showFavoritesOnly ? 'bg-teal-500 border-teal-500' : 'bg-gray-200 border-gray-300'}`}
                  onClick={() => setShowFavoritesOnly(fav => !fav)}
                  aria-pressed={showFavoritesOnly}
                >
                  <span
                    className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${showFavoritesOnly ? 'translate-x-6' : 'translate-x-0'}`}
                    style={{ transform: showFavoritesOnly ? 'translateX(1.5rem)' : 'translateX(0)' }}
                  />
                </button>
                <span className={`text-xs ml-1 font-semibold ${showFavoritesOnly ? 'text-teal-700' : 'text-gray-400'}`}>{showFavoritesOnly ? 'On' : 'Off'}</span>
              </div>
              <Link href="/properties/create" className="px-6 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition">
                Create New Listing
              </Link>
            </div>
          </div>

          {/* Listing Type Tabs and Sort Toggle */}
          <div className="flex gap-2 mb-6 items-center">
            {/* DEBUG: Show current options state visually */}
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-900 px-3 py-1 rounded text-xs mr-4">
              <div><b>DEBUG</b></div>
              <div>activeTab: {JSON.stringify(activeTab)}</div>
              <div>sortOrder: {JSON.stringify(sortOrder)}</div>
              <div>selectedFilters: {JSON.stringify(selectedFilters)}</div>
            </div>
            <select
              className="px-4 py-2 rounded-lg font-medium border border-cyan-200 bg-white text-cyan-700"
              value={activeTab}
              onChange={e => setActiveTab(e.target.value as typeof activeTab)}
            >
              {listingTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="ml-4 flex items-center gap-1">
              <span className="text-sm text-cyan-700 font-medium">Sort:</span>
              <button
                className={`px-3 py-1 rounded-l border border-cyan-200 text-sm font-medium ${sortOrder === 'low' ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-cyan-700'}`}
                onClick={() => setSortOrder('low')}
                type="button"
              >
                Low
              </button>
              <button
                className={`px-3 py-1 border-t border-b border-cyan-200 text-sm font-medium ${sortOrder === 'high' ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-cyan-700'}`}
                onClick={() => setSortOrder('high')}
                type="button"
              >
                High
              </button>
              <button
                className={`px-3 py-1 rounded-r border border-cyan-200 text-sm font-medium ${sortOrder === 'newest' ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-cyan-700'}`}
                onClick={() => setSortOrder('newest')}
                type="button"
              >
                Newest
              </button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {Object.keys(selectedFilters).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedFilters.location && (
                <div className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">
                  Location: {selectedFilters.location.city}
                  {selectedFilters.location.area && ` - ${selectedFilters.location.area}`}
                </div>
              )}
              {selectedFilters.type && (
                <div className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">
                  Type: {selectedFilters.type}
                </div>
              )}
              {selectedFilters.price && (
                <div className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">
                  Price: 
                  {selectedFilters.price.min ? ` $${selectedFilters.price.min}` : ' $0'} 
                  {' - '}
                  {selectedFilters.price.max ? `$${selectedFilters.price.max}` : 'Any'}
                </div>
              )}
              {selectedFilters.beds && (
                <div className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">
                  Beds: {selectedFilters.beds}
                </div>
              )}
              {selectedFilters.amenities && selectedFilters.amenities.length > 0 && (
                <div className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">
                  Amenities: {selectedFilters.amenities.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Property Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showFavoritesOnly
              ? properties.filter(p => favoriteIds.includes(p.id))
              : properties
            ).map((property) => (
              <div key={property.id} className="relative">
                <PropertyCard
                  property={property}
                  onDelete={() => setDeleteId(property.id)}
                  favoriteIds={favoriteIds}
                  userId={userId}
                  onToggleFavorite={handleToggleFavorite}
                />
                {deleteId === property.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center border border-cyan-200">
                      <div className="mb-3">
                        <svg className="w-10 h-10 text-red-400 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                        </svg>
                      </div>
                      <div className="text-lg font-bold text-cyan-900 mb-2">ARE YOU SURE?</div>
                      <div className="text-sm text-cyan-800 mb-1 text-center">You are about to delete <span className="font-semibold">{property.title}</span>.</div>
                      <div className="text-xs text-red-500 mb-4 text-center">This action cannot be undone.</div>
                      <div className="flex gap-4">
                        <button
                          className="px-4 py-2 rounded bg-gray-100 text-cyan-900 font-semibold hover:bg-gray-200 transition"
                          onClick={() => setDeleteId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                          onClick={() => handleDeleteProperty(property.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {!loading && properties.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No properties found</p>
              <Link href="/properties/create" className="text-teal-500 hover:text-teal-600">
                Create your first property listing
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 