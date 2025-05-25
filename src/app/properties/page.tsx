"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

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

const PropertyCard = ({ property, onDelete }: { property: Property; onDelete?: () => void }) => {
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

  return (
    <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl shadow-lg p-5 flex flex-col relative border border-cyan-100">
      <div className="relative group">
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
      <h3 className="font-semibold text-lg mb-1 text-cyan-900">{property.title}</h3>
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
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Rent' | 'Sale'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('Any');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('Any');
  const [isFurnished, setIsFurnished] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [isPetFriendly, setIsPetFriendly] = useState(false);
  const [sortOption, setSortOption] = useState('Newest First');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchProperties();
  }, [activeTab, searchTerm, location, propertyType, minPrice, maxPrice, bedrooms, isFurnished, hasParking, isPetFriendly, sortOption]);

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

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (location) {
        query = query.or(`city.ilike.%${location}%,location.ilike.%${location}%`);
      }

      if (propertyType !== 'Any') {
        query = query.eq('propertyType', propertyType);
      }

      if (minPrice) {
        query = query.gte('price', parseInt(minPrice));
      }

      if (maxPrice) {
        query = query.lte('price', parseInt(maxPrice));
      }

      if (bedrooms !== 'Any') {
        query = query.eq('bedrooms', parseInt(bedrooms));
      }

      if (isFurnished) {
        query = query.eq('isFurnished', true);
      }

      if (hasParking) {
        query = query.eq('hasParking', true);
      }

      if (isPetFriendly) {
        query = query.eq('isPetFriendly', true);
      }

      // Apply sorting
      switch (sortOption) {
        case 'Newest First':
          query = query.order('created_at', { ascending: false });
          break;
        case 'Price: Low to High':
          query = query.order('price', { ascending: true });
          break;
        case 'Price: High to Low':
          query = query.order('price', { ascending: false });
          break;
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

  const clearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setPropertyType('Any');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('Any');
    setIsFurnished(false);
    setHasParking(false);
    setIsPetFriendly(false);
    setSortOption('Newest First');
  };

  const hasActiveFilters = () => {
    return searchTerm || location || propertyType !== 'Any' || minPrice || maxPrice || bedrooms !== 'Any' || isFurnished || hasParking || isPetFriendly;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 flex gap-8">
        {/* Filter Sidebar */}
        <aside className="w-64 bg-white rounded-lg shadow p-6 hidden md:block">
          <h2 className="font-bold text-lg mb-4">Filters</h2>
          <form className="space-y-4 text-sm">
            <div>
              <label className="block font-medium mb-1">Search</label>
              <input className="w-full border rounded px-2 py-1" placeholder="Search properties" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Location</label>
              <input className="w-full border rounded px-2 py-1" placeholder="Enter city or location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Property Type</label>
              <select className="w-full border rounded px-2 py-1" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option>Any</option>
                <option>Apartment</option>
                <option>House</option>
                <option>Studio</option>
                <option>Townhouse</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Price Range</label>
              <div className="flex gap-2">
                <input className="w-1/2 border rounded px-2 py-1" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <input className="w-1/2 border rounded px-2 py-1" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Bedrooms</label>
              <select className="w-full border rounded px-2 py-1" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
                <option>Any</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5+</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={isFurnished} onChange={(e) => setIsFurnished(e.target.checked)} />
              <label>Furnished</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={hasParking} onChange={(e) => setHasParking(e.target.checked)} />
              <label>Parking</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={isPetFriendly} onChange={(e) => setIsPetFriendly(e.target.checked)} />
              <label>Pet Friendly</label>
            </div>
            <div>
              <label className="block font-medium mb-1">Sort By</label>
              <select className="w-full border rounded px-2 py-1" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option>Newest First</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
            {hasActiveFilters() && (
              <button type="button" className="w-full py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </form>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Properties</h1>
              {loading && <p className="text-sm text-gray-500">Loading...</p>}
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <Link href="/properties/create" className="px-4 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition">
              Create Property
            </Link>
          </div>

          {/* Listing Type Tabs */}
          <div className="flex gap-2 mb-6">
            {['All', 'Rent', 'Sale'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === tab
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab(tab as 'All' | 'Rent' | 'Sale')}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Property Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="relative">
                <PropertyCard
                  property={property}
                  onDelete={() => setDeleteId(property.id)}
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