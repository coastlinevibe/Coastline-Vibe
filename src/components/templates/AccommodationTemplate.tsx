"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "../shared/Breadcrumb";

interface AccommodationTemplateProps {
  business: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    address?: string;
    location_lat?: number;
    location_lng?: number;
    contact_email?: string;
    contact_phone?: string;
    website?: string;
    amenities?: string[];
    gallery_urls?: string[];
    rooms?: any[];
    key_facts?: {
      guests?: number;
      bedrooms?: number;
      bathrooms?: number;
      property_type?: string;
    };
    facilities?: string[];
    facility_hours?: {
      [key: string]: {
        open: string;
        close: string;
        days: string;
      };
    };
    promotions?: {
      title: string;
      description: string;
      valid_until?: string;
      discount?: number;
      is_seasonal?: boolean;
      banner_color?: string;
    }[];
    featured_type?: string;
    tagline?: string;
    rating?: number;
    review_count?: number;
    price_range?: string;
    is_verified?: boolean;
    video_url?: string;
    video_provider?: string;
    related_rooms?: {
      id: string;
      name: string;
      image_url?: string;
      price?: number;
      capacity?: number;
      description?: string;
    }[];
    nearby_properties?: {
      id: string;
      name: string;
      image_url?: string;
      distance?: string;
      rating?: number;
    }[];
  };
}

export default function AccommodationTemplate({ business }: AccommodationTemplateProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'gallery' | 'reviews'>('overview');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [roomCount, setRoomCount] = useState<number>(1);
  const [guests, setGuests] = useState<number>(1);
  const params = useParams();
  const router = useRouter();
  const communityId = params?.communityId as string;
  
  // Helper functions
  const getYoutubeVideoId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const getVimeoVideoId = (url: string): string => {
    const regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[5] : '';
  };
  
  const getTopAmenities = (amenities: string[]): string[] => {
    // Define priority amenities that should be shown first if they exist
    const priorityAmenities = [
      'WiFi', 'Free WiFi', 'Parking', 'Pool', 'Spa', 'Gym', 
      'Restaurant', 'Bar', 'Breakfast', 'Air Conditioning',
      'Pet Friendly', 'Beach Access', 'Room Service'
    ];
    
    // Filter amenities that match priority list
    const topOnes = amenities.filter(a => 
      priorityAmenities.some(pa => a.toLowerCase().includes(pa.toLowerCase()))
    );
    
    // If we have enough priority amenities, return them (up to 8)
    if (topOnes.length >= 4) {
      return topOnes.slice(0, 8);
    }
    
    // Otherwise return first 8 amenities or all if less than 8
    return amenities.slice(0, 8);
  };

  const getAmenityIcon = (amenity: string): string => {
    const amenityLower = amenity.toLowerCase();
    
    if (amenityLower.includes('wifi')) return '📶';
    if (amenityLower.includes('parking')) return '🚗';
    if (amenityLower.includes('pool')) return '🏊';
    if (amenityLower.includes('spa')) return '💆';
    if (amenityLower.includes('gym') || amenityLower.includes('fitness')) return '🏋️';
    if (amenityLower.includes('restaurant')) return '🍽️';
    if (amenityLower.includes('bar')) return '🍸';
    if (amenityLower.includes('breakfast')) return '🍳';
    if (amenityLower.includes('air conditioning') || amenityLower.includes('ac')) return '❄️';
    if (amenityLower.includes('pet')) return '🐾';
    if (amenityLower.includes('beach')) return '🏖️';
    if (amenityLower.includes('room service')) return '🛎️';
    if (amenityLower.includes('tv') || amenityLower.includes('television')) return '📺';
    if (amenityLower.includes('kitchen')) return '🍳';
    if (amenityLower.includes('washer') || amenityLower.includes('laundry')) return '🧺';
    
    // Default icon for other amenities
    return '✓';
  };
  
  // Debug logging
  console.log("Business data in AccommodationTemplate:", business);
  console.log("Gallery URLs:", business.gallery_urls);
  
  // Default values in case the business object doesn't have these properties
  const gallery = business.gallery_urls && business.gallery_urls.length > 0 
    ? business.gallery_urls 
    : [business.image_url || "/placeholder-accommodation.jpg"];
  
  console.log("Final gallery array:", gallery);
  const keyFacts = business.key_facts || {};
  const amenities = business.amenities || [];
  const facilities = business.facilities || [];
  const promotions = business.promotions || [];
  const rooms = business.rooms || [];
  
  // Handle lightbox navigation
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 
        ? ((business?.gallery_urls?.length || 1) - 1) 
        : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === ((business?.gallery_urls?.length || 1) - 1) 
        ? 0 
        : prevIndex + 1
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-blue-50">
      {/* Breadcrumbs Navigation */}
      <div className="max-w-content mx-auto px-4 pt-4">
        <Breadcrumb 
          items={[
            { label: 'Directory', href: `/community/${communityId}/business/directory` },
            { label: business.name || 'Accommodation Details' }
          ]}
        />
      </div>

      {/* Back to My Businesses Link */}
      <div className="max-w-content mx-auto px-4 py-4">
        <Link 
          href={`/community/${communityId}/business/directory/my-businesses`}
          className="inline-flex items-center text-primaryTeal hover:text-seafoam transition-colors"
        >
          <span className="mr-1">←</span> Back to My Businesses
        </Link>
      </div>
      
      {/* Hero Section with Main Image */}
      <section className="relative w-full h-[60vh] min-h-[400px]">
        <div className="absolute inset-0">
          <img 
            src={business.image_url || "/placeholder-accommodation.jpg"} 
            alt={business.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
          <div className="flex flex-wrap items-center justify-between mb-2">
            <h1 className="text-3xl md:text-5xl font-heading font-bold">{business.name}</h1>
            
            {/* Verification Badge */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              business.is_verified 
                ? "bg-emerald-100/90 text-emerald-700" 
                : "bg-gray-100/80 text-gray-600"
            }`}>
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={business.is_verified
                    ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  }
                />
              </svg>
              <span className="font-medium">
                {business.is_verified ? "Verified Business" : "Verification Pending"}
              </span>
            </div>
          </div>
          
          <p className="text-lg md:text-xl mb-4 max-w-2xl">{business.address}</p>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-primaryTeal/90 rounded-full text-sm font-medium">
              Accommodation
            </span>
            {keyFacts.property_type && (
              <span className="px-3 py-1 bg-seafoam/90 rounded-full text-sm font-medium">
                {keyFacts.property_type}
              </span>
            )}
            {business.featured_type && (
              <span className="px-3 py-1 bg-coral/90 rounded-full text-sm font-medium flex items-center gap-1">
                <span className="text-xs">🔥</span>
                {business.featured_type}
              </span>
            )}
          </div>
          {business.tagline && (
            <p className="mt-4 text-white/90 text-lg italic">{business.tagline}</p>
          )}
        </div>
      </section>
      
      {/* Key Facts Bar */}
      <div className="bg-white shadow-md border-b border-grayLight">
        <div className="max-w-content mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Star Rating */}
            <div className="flex items-center">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-yellow-400 text-lg">
                    {star <= (business.rating || 0) ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <span className="ml-2 text-sm text-darkCharcoal">
                {business.rating || 0} ({business.review_count || 0} reviews)
              </span>
            </div>
            
            {/* Price Range */}
            <div className="flex items-center border-l border-grayLight pl-4">
              <span className="text-primaryTeal font-bold">
                {business.price_range || 'Price on request'}
              </span>
            </div>
          </div>
          
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-medium">
              Accommodation
            </span>
            {keyFacts.property_type && (
              <span className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded-full text-xs font-medium">
                {keyFacts.property_type}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content Container */}
      <div className="max-w-content mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Tab navigation */}
            <div className="bg-white border-b border-grayLight">
              <div className="max-w-content mx-auto px-4">
                <div className="flex space-x-1 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-6 font-medium text-sm transition-colors ${
                      activeTab === 'overview' ? 'text-primaryTeal border-b-2 border-primaryTeal' : 'text-darkCharcoal/70 hover:text-darkCharcoal'
                    }`}
                  >
                    Overview
                  </button>
                  
                  {business.amenities && business.amenities.length > 0 && (
                    <button
                      onClick={() => setActiveTab('amenities')}
                      className={`py-4 px-6 font-medium text-sm transition-colors ${
                        activeTab === 'amenities' ? 'text-primaryTeal border-b-2 border-primaryTeal' : 'text-darkCharcoal/70 hover:text-darkCharcoal'
                      }`}
                    >
                      Amenities
                    </button>
                  )}
                  
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={`py-4 px-6 font-medium text-sm transition-colors ${
                      activeTab === 'gallery' ? 'text-primaryTeal border-b-2 border-primaryTeal' : 'text-darkCharcoal/70 hover:text-darkCharcoal'
                    }`}
                  >
                    Gallery
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 px-6 font-medium text-sm transition-colors ${
                      activeTab === 'reviews' ? 'text-primaryTeal border-b-2 border-primaryTeal' : 'text-darkCharcoal/70 hover:text-darkCharcoal'
                    }`}
                  >
                    Reviews
                  </button>
                </div>
              </div>
            </div>
            
            {/* Tab content */}
            <div className="mb-8">
              {activeTab === 'overview' && (
                <div>
                  <p className="text-darkCharcoal mb-6 whitespace-pre-line text-lg">{business.description}</p>
                  
                  {/* Key Facts Section */}
                  <div className="bg-white rounded-lg shadow-subtle p-6 mb-6">
                    <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-4">Key Facts</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col items-center p-3 bg-seafoam/10 rounded-lg">
                        <span className="text-seafoam text-2xl mb-1">👥</span>
                        <span className="text-sm text-grayLight">Guests</span>
                        <span className="font-medium">{keyFacts.guests || "N/A"}</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-seafoam/10 rounded-lg">
                        <span className="text-seafoam text-2xl mb-1">🛏️</span>
                        <span className="text-sm text-grayLight">Bedrooms</span>
                        <span className="font-medium">{keyFacts.bedrooms || "N/A"}</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-seafoam/10 rounded-lg">
                        <span className="text-seafoam text-2xl mb-1">🚿</span>
                        <span className="text-sm text-grayLight">Bathrooms</span>
                        <span className="font-medium">{keyFacts.bathrooms || "N/A"}</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-seafoam/10 rounded-lg">
                        <span className="text-seafoam text-2xl mb-1">🏠</span>
                        <span className="text-sm text-grayLight">Property Type</span>
                        <span className="font-medium">{keyFacts.property_type || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Promotions Section */}
                  {promotions.length > 0 && (
                    <div className="bg-white rounded-lg shadow-subtle p-6 mb-6">
                      <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-4">Special Offers</h3>
                      <div className="space-y-4">
                        {promotions.map((promo, index) => (
                          <div 
                            key={index} 
                            className={`border rounded-lg p-4 ${
                              promo.is_seasonal 
                                ? `bg-${promo.banner_color || 'amber-50'} border-${promo.banner_color?.replace('50', '300') || 'amber-300'}` 
                                : 'border-coral/30 bg-coral/5'
                            }`}
                          >
                            {promo.is_seasonal && (
                              <div className="flex items-center justify-center mb-2 bg-gradient-to-r from-transparent via-amber-100 to-transparent py-1">
                                <span className="text-amber-600 font-semibold text-sm uppercase tracking-wider">Seasonal Offer</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <span className={promo.is_seasonal ? "text-amber-500" : "text-coral"}>
                                {promo.is_seasonal ? "🍂" : "🏷️"}
                              </span>
                              <h4 className={`font-medium ${promo.is_seasonal ? "text-amber-700" : "text-coral"}`}>
                                {promo.title}
                              </h4>
                              {promo.discount && (
                                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold text-white ${
                                  promo.is_seasonal ? "bg-amber-500" : "bg-coral"
                                }`}>
                                  {promo.discount}% OFF
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${promo.is_seasonal ? "text-amber-800" : "text-darkCharcoal"}`}>
                              {promo.description}
                            </p>
                            {promo.valid_until && (
                              <p className="text-xs text-grayLight mt-2">
                                Valid until {new Date(promo.valid_until).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'amenities' && (
                <div>
                  <h2 className="text-2xl font-heading font-semibold text-primaryTeal mb-4">Amenities & Facilities</h2>
                  
                  {/* Top Amenities with Icons */}
                  <div className="bg-white rounded-lg shadow-subtle p-6 mb-6">
                    <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-4">Top Amenities</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {getTopAmenities(amenities).map((amenity, index) => (
                        <div key={index} className="flex flex-col items-center p-4 bg-seafoam/10 rounded-lg text-center">
                          <span className="text-2xl mb-2">{getAmenityIcon(amenity)}</span>
                          <span className="text-sm font-medium text-darkCharcoal">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Amenities Section */}
                  <div className="bg-white rounded-lg shadow-subtle p-6 mb-6">
                    <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-4">All Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {amenities.length > 0 ? amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-seafoam">✓</span>
                          <span>{amenity}</span>
                        </div>
                      )) : (
                        <p className="text-grayLight col-span-3">No amenities listed</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Facilities Section */}
                  <div className="bg-white rounded-lg shadow-subtle p-6">
                    <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-4">Facilities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {facilities.length > 0 ? facilities.map((facility, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-seafoam">✓</span>
                          <span>{facility}</span>
                        </div>
                      )) : (
                        <p className="text-grayLight col-span-3">No facilities listed</p>
                      )}
                    </div>

                    {/* Facility Hours */}
                    {business.facility_hours && Object.keys(business.facility_hours).length > 0 && (
                      <div className="mt-6 pt-4 border-t border-grayLight">
                        <h4 className="font-medium text-primaryTeal mb-3">Operating Hours</h4>
                        <div className="space-y-3">
                          {Object.entries(business.facility_hours).map(([facility, hours]) => (
                            <div key={facility} className="bg-seafoam/10 rounded-md p-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-darkCharcoal">{facility}</span>
                                <span className="text-sm bg-seafoam/20 px-2 py-0.5 rounded text-primaryTeal">
                                  {hours.open} - {hours.close}
                                </span>
                              </div>
                              <p className="text-xs text-grayLight">{hours.days}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'gallery' && (
                <div>
                  <h2 className="text-2xl font-heading font-semibold text-primaryTeal mb-6">Photo Gallery</h2>
                  
                  {/* Gallery Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {business.gallery_urls && business.gallery_urls.length > 0 ? (
                      business.gallery_urls.map((image, index) => (
                        <div 
                          key={index} 
                          className="relative aspect-square overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-grayLight"
                          onClick={() => openLightbox(index)}
                        >
                          <img
                            src={image}
                            alt={`${business.name} - Photo ${index + 1}`}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-accommodation.jpg";
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full flex items-center justify-center p-12 bg-grayLight/20 rounded-lg">
                        <p className="text-grayLight">No gallery photos available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'reviews' && (
                <div>
                  <h2 className="text-2xl font-heading font-semibold text-primaryTeal mb-6">Reviews & Ratings</h2>
                  
                  {/* Overall Rating Display */}
                  <div className="bg-white rounded-lg shadow-subtle p-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-primaryTeal">
                        {business.rating ? business.rating.toFixed(1) : "N/A"}
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg 
                              key={star}
                              className={`w-5 h-5 ${
                                business.rating && star <= Math.round(business.rating)
                                  ? "text-yellow-400" 
                                  : "text-gray-300"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <div className="text-sm text-grayLight">
                          Based on {business.review_count || 0} {business.review_count === 1 ? 'review' : 'reviews'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 border-t pt-4">
                      <p className="text-darkCharcoal">
                        {business.review_count && business.review_count > 0 
                          ? "See what guests are saying about their experience at " + business.name
                          : "Be the first to review " + business.name
                        }
                      </p>
                      <button 
                        onClick={() => router.push(`/community/${communityId}/business/${business.id}#reviews`)}
                        className="mt-3 px-4 py-2 bg-primaryTeal text-white rounded-md hover:bg-seafoam transition-colors"
                      >
                        {business.review_count && business.review_count > 0 ? "Read all reviews" : "Write a review"}
                      </button>
                    </div>
                  </div>
                  
                  {/* Review Highlights - Would be populated from actual reviews */}
                  {business.review_count && business.review_count > 0 ? (
                    <div className="bg-white rounded-lg shadow-subtle p-6">
                      <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-4">Review Highlights</h3>
                      <div className="space-y-4">
                        {/* This would typically be populated from actual reviews */}
                        <div className="p-4 border border-grayLight rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="bg-primaryTeal/20 text-primaryTeal rounded-full w-8 h-8 flex items-center justify-center font-medium">
                                  G
                                </div>
                                <span className="font-medium">Guest</span>
                              </div>
                              <div className="flex items-center mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg 
                                    key={star}
                                    className="w-4 h-4 text-yellow-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-grayLight">
                              Recent stay
                            </div>
                          </div>
                          <p className="text-darkCharcoal mt-2">
                            "Visit the full business page to see all reviews and ratings for this property."
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <button 
                            onClick={() => router.push(`/community/${communityId}/business/${business.id}#reviews`)}
                            className="text-primaryTeal hover:underline"
                          >
                            View all {business.review_count} reviews
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-subtle p-6 text-center">
                      <div className="text-4xl mb-4">📝</div>
                      <h3 className="text-xl font-medium mb-2">No Reviews Yet</h3>
                      <p className="text-grayLight mb-4">Be the first to share your experience at this property</p>
                      <button 
                        onClick={() => router.push(`/community/${communityId}/business/${business.id}#reviews`)}
                        className="px-4 py-2 bg-primaryTeal text-white rounded-md hover:bg-seafoam transition-colors"
                      >
                        Write a Review
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Booking Panel and Contact */}
          <div className="lg:col-span-1">
            {/* Booking Panel */}
            <div className="bg-white rounded-lg shadow-elevated p-6 mb-6 sticky top-4">
              <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-4">Book Your Stay</h3>
              
              {dateError && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {dateError}
                </div>
              )}
              
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                if (!checkInDate || !checkOutDate) {
                  setDateError('Please select both check-in and check-out dates');
                  return;
                }
                
                const checkIn = new Date(checkInDate);
                const checkOut = new Date(checkOutDate);
                
                if (checkOut <= checkIn) {
                  setDateError('Check-out date must be after check-in date');
                  return;
                }
                
                setDateError(null);
                // Here you would typically handle the booking process
                console.log('Booking details:', { checkInDate, checkOutDate, roomCount, guests });
                alert('Availability check submitted!');
              }}>
                <div>
                  <label className="block text-sm font-medium text-darkCharcoal mb-1">Check-in</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-grayLight rounded-md focus:outline-none focus:ring-2 focus:ring-primaryTeal"
                    value={checkInDate?.toISOString().split('T')[0]}
                    onChange={(e) => {
                      setCheckInDate(new Date(e.target.value));
                      // Clear error when user makes changes
                      if (dateError) setDateError(null);
                    }}
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkCharcoal mb-1">Check-out</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-grayLight rounded-md focus:outline-none focus:ring-2 focus:ring-primaryTeal"
                    value={checkOutDate?.toISOString().split('T')[0]}
                    onChange={(e) => {
                      setCheckOutDate(new Date(e.target.value));
                      // Clear error when user makes changes
                      if (dateError) setDateError(null);
                    }}
                    min={checkInDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]} // Prevent dates before check-in
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rooms" className="block text-sm font-medium text-darkCharcoal mb-1">Rooms</label>
                    <select 
                      id="rooms" 
                      className="w-full px-3 py-2 border border-grayLight rounded-md focus:outline-none focus:ring-2 focus:ring-primaryTeal"
                      value={roomCount}
                      onChange={(e) => setRoomCount(parseInt(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num} Room{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="guests" className="block text-sm font-medium text-darkCharcoal mb-1">Guests</label>
                    <select 
                      id="guests" 
                      className="w-full px-3 py-2 border border-grayLight rounded-md focus:outline-none focus:ring-2 focus:ring-primaryTeal"
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-primaryTeal text-white rounded-md font-medium hover:bg-seafoam transition"
                >
                  Check Availability
                </button>
              </form>
              
              <div className="mt-4 pt-4 border-t border-grayLight">
                <div className="flex justify-between mb-2">
                  <span className="text-darkCharcoal">Starting from</span>
                  <span className="font-bold text-primaryTeal">$--</span>
                </div>
                <p className="text-xs text-grayLight">Prices may vary depending on room type and date</p>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-subtle p-6">
              <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-4">Contact Information</h3>
              <div className="space-y-3 mb-5">
                {business.contact_phone && (
                  <div className="flex items-center gap-3">
                    <span className="text-seafoam">📞</span>
                    <a href={`tel:${business.contact_phone}`} className="text-darkCharcoal hover:text-primaryTeal">
                      {business.contact_phone}
                    </a>
                  </div>
                )}
                {business.contact_email && (
                  <div className="flex items-center gap-3">
                    <span className="text-seafoam">✉️</span>
                    <a href={`mailto:${business.contact_email}`} className="text-darkCharcoal hover:text-primaryTeal">
                      {business.contact_email}
                    </a>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-3">
                    <span className="text-seafoam">🌐</span>
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-darkCharcoal hover:text-primaryTeal">
                      {business.website}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Contact CTA Buttons */}
              <div className="flex flex-col gap-3">
                {business.website && (
                  <a 
                    href={business.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-2 bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Visit Website
                  </a>
                )}
                
                {business.contact_phone && (
                  <a 
                    href={`tel:${business.contact_phone}`} 
                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call Now
                  </a>
                )}
                
                {business.contact_email && (
                  <a 
                    href={`mailto:${business.contact_email}`} 
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Rooms / Alternatives */}
      {((business.related_rooms && business.related_rooms.length > 0) || 
        (business.nearby_properties && business.nearby_properties.length > 0)) && (
        <div className="bg-seafoam/10 py-12">
          <div className="max-w-content mx-auto px-4">
            {business.related_rooms && business.related_rooms.length > 0 && (
              <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-heading font-semibold text-primaryTeal">Other Room Options</h2>
                  <button className="text-sm text-primaryTeal hover:underline">View All Rooms</button>
                </div>
                
                <div className="relative">
                  <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
                    {business.related_rooms.map((room) => (
                      <div 
                        key={room.id}
                        className="min-w-[280px] max-w-[280px] bg-white rounded-lg shadow-subtle overflow-hidden flex-shrink-0 snap-start"
                      >
                        <div className="h-40 overflow-hidden">
                          <img 
                            src={room.image_url || "/placeholder-room.jpg"} 
                            alt={room.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-room.jpg";
                            }}
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-darkCharcoal mb-1">{room.name}</h3>
                          {room.description && (
                            <p className="text-sm text-grayLight mb-3 line-clamp-2">{room.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-grayLight">
                              <span>Up to {room.capacity || 2} guests</span>
                            </div>
                            <div className="text-primaryTeal font-bold">
                              ${room.price || '--'}<span className="text-xs font-normal">/night</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {business.nearby_properties && business.nearby_properties.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-heading font-semibold text-primaryTeal">Nearby Properties</h2>
                  <button className="text-sm text-primaryTeal hover:underline">View All</button>
                </div>
                
                <div className="relative">
                  <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
                    {business.nearby_properties.map((property) => (
                      <div 
                        key={property.id}
                        className="min-w-[280px] max-w-[280px] bg-white rounded-lg shadow-subtle overflow-hidden flex-shrink-0 snap-start"
                      >
                        <div className="h-40 overflow-hidden">
                          <img 
                            src={property.image_url || "/placeholder-accommodation.jpg"} 
                            alt={property.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-accommodation.jpg";
                            }}
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-darkCharcoal mb-1">{property.name}</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-grayLight">
                              <span>{property.distance || '< 1km'} away</span>
                            </div>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="text-yellow-400 text-xs">
                                  {star <= (property.rating || 0) ? "★" : "☆"}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Footer Contact / Newsletter */}
      <div className="bg-primaryTeal text-white py-12">
        <div className="max-w-content mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Quick Contact Form */}
            <div>
              <h2 className="text-2xl font-heading font-semibold mb-6">
                Contact <span className="font-extrabold bg-gradient-to-r from-yellow-300 to-seafoam text-transparent bg-clip-text">{business.name || 'Us'}</span>
              </h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Your Name</label>
                  <input 
                    type="text" 
                    id="name"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" 
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
                  <input 
                    type="email" 
                    id="email"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" 
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
                  <textarea 
                    id="message"
                    rows={4}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" 
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-white text-primaryTeal font-medium rounded-md hover:bg-seafoam transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
            
            {/* Newsletter Signup */}
            <div>
              <h2 className="text-2xl font-heading font-semibold mb-6">Subscribe to Our Newsletter</h2>
              <p className="mb-6 text-white/80">
                Stay updated with our latest offers, promotions, and news. Subscribe to our newsletter.
              </p>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="subscribe-email" className="block text-sm font-medium mb-1">Email Address</label>
                  <div className="flex">
                    <input 
                      type="email" 
                      id="subscribe-email"
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-l-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" 
                      placeholder="Enter your email"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-white font-medium rounded-r-md hover:bg-seafoam transition-colors"
                    >
                      <span className="bg-gradient-to-r from-yellow-300 to-seafoam text-transparent bg-clip-text font-extrabold">Subscribe</span>
                    </button>
                  </div>
                </div>
              </form>
              
              <div className="mt-8">
                <h3 className="font-medium mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <span className="sr-only">Facebook</span>
                    <span>📱</span>
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <span className="sr-only">Instagram</span>
                    <span>📸</span>
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <span className="sr-only">Twitter</span>
                    <span>🐦</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lightbox Component */}
      {lightboxOpen && business.gallery_urls && business.gallery_urls.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          {/* Close button */}
          <button 
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/20 transition z-50"
            aria-label="Close lightbox"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Previous button */}
          <button 
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full hover:bg-white/20 transition z-50"
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Next button */}
          <button 
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full hover:bg-white/20 transition z-50"
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Current image */}
          <div className="max-h-[90vh] max-w-[90vw] relative">
            <img
              src={business.gallery_urls[currentImageIndex]}
              alt={`${business.name} - Photo ${currentImageIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-accommodation.jpg";
              }}
            />
            
            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {business.gallery_urls.length}
            </div>
          </div>
          
          {/* Thumbnail navigation at bottom */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[80vw] pb-2">
            {business.gallery_urls.map((image, index) => (
              <div 
                key={index} 
                className={`w-16 h-16 flex-shrink-0 cursor-pointer rounded overflow-hidden border-2 ${index === currentImageIndex ? 'border-white' : 'border-transparent'}`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-accommodation.jpg";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 