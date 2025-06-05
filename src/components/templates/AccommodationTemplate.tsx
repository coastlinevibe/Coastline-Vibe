"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const params = useParams();
  const router = useRouter();
  const communityId = params.communityId as string;
  
  // Booking panel state
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [roomCount, setRoomCount] = useState<number>(1);
  const [guests, setGuests] = useState<number>(1);
  const [dateError, setDateError] = useState<string | null>(null);
  
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
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-blue-50">
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
          <h1 className="text-3xl md:text-5xl font-heading font-bold mb-2">{business.name}</h1>
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
          
          {/* Verified Badge */}
          {business.is_verified && (
            <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
              <span className="text-green-600">✓</span>
              <span className="text-sm font-medium text-green-600">Verified</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content Container */}
      <div className="max-w-content mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto mb-6 border-b border-grayLight">
              <button 
                onClick={() => setSelectedTab("overview")}
                className={`px-4 py-2 font-medium whitespace-nowrap ${selectedTab === "overview" 
                  ? "text-primaryTeal border-b-2 border-primaryTeal" 
                  : "text-darkCharcoal hover:text-primaryTeal"}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setSelectedTab("amenities")}
                className={`px-4 py-2 font-medium whitespace-nowrap ${selectedTab === "amenities" 
                  ? "text-primaryTeal border-b-2 border-primaryTeal" 
                  : "text-darkCharcoal hover:text-primaryTeal"}`}
              >
                Amenities & Facilities
              </button>
              <button 
                onClick={() => setSelectedTab("rooms")}
                className={`px-4 py-2 font-medium whitespace-nowrap ${selectedTab === "rooms" 
                  ? "text-primaryTeal border-b-2 border-primaryTeal" 
                  : "text-darkCharcoal hover:text-primaryTeal"}`}
              >
                Rooms
              </button>
              <button 
                onClick={() => setSelectedTab("location")}
                className={`px-4 py-2 font-medium whitespace-nowrap ${selectedTab === "location" 
                  ? "text-primaryTeal border-b-2 border-primaryTeal" 
                  : "text-darkCharcoal hover:text-primaryTeal"}`}
              >
                Location
              </button>
              <button 
                onClick={() => setSelectedTab("gallery")}
                className={`px-4 py-2 font-medium whitespace-nowrap ${selectedTab === "gallery" 
                  ? "text-primaryTeal border-b-2 border-primaryTeal" 
                  : "text-darkCharcoal hover:text-primaryTeal"}`}
              >
                Gallery
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="mb-8">
              {/* Overview Tab */}
              {selectedTab === "overview" && (
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
              
              {/* Amenities Tab */}
              {selectedTab === "amenities" && (
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
              
              {/* Rooms Tab */}
              {selectedTab === "rooms" && (
                <div>
                  <h2 className="text-2xl font-heading font-semibold text-primaryTeal mb-4">Available Rooms</h2>
                  
                  {rooms.length > 0 ? (
                    <div className="space-y-6">
                      {rooms.map((room, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-subtle overflow-hidden">
                          <div className="md:flex">
                            <div className="md:w-1/3">
                              <img 
                                src={room.image_url || "/placeholder-room.jpg"} 
                                alt={room.name}
                                className="w-full h-48 md:h-full object-cover"
                              />
                            </div>
                            <div className="p-6 md:w-2/3">
                              <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-2">{room.name}</h3>
                              <p className="text-sm text-darkCharcoal mb-4">{room.description}</p>
                              <div className="flex flex-wrap gap-3 mb-4">
                                {room.features?.map((feature: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-seafoam/10 text-seafoam rounded text-xs">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-2xl font-bold text-primaryTeal">${room.price}</span>
                                  <span className="text-sm text-grayLight ml-1">/ night</span>
                                </div>
                                <button className="px-4 py-2 bg-primaryTeal text-white rounded-md hover:bg-seafoam transition">
                                  Book Now
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-subtle p-6 text-center">
                      <p className="text-grayLight">No rooms information available</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Location Tab */}
              {selectedTab === "location" && (
                <div>
                  <h2 className="text-2xl font-heading font-semibold text-primaryTeal mb-4">Location</h2>
                  
                  <div className="bg-white rounded-lg shadow-subtle p-6 mb-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-2">Address</h3>
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(business.address || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-darkCharcoal hover:text-primaryTeal flex items-center gap-2"
                      >
                        <span className="text-primaryTeal">📍</span>
                        {business.address || "Address not provided"}
                        <span className="text-xs text-primaryTeal">(Open in Maps)</span>
                      </a>
                    </div>
                    
                    {/* Map */}
                    <div className="w-full h-80 bg-seafoam/10 rounded-lg overflow-hidden">
                      {business.location_lat && business.location_lng ? (
                        <iframe
                          title="Business Location"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${business.location_lat},${business.location_lng}&zoom=15`}
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-grayLight">Map location not available</p>
                        </div>
                      )}
                    </div>

                    {/* Nearby Search */}
                    {business.location_lat && business.location_lng && (
                      <div className="mt-4">
                        <h4 className="font-medium text-darkCharcoal mb-2">Search nearby:</h4>
                        <div className="flex flex-wrap gap-2">
                          {["Restaurants", "Cafes", "Attractions", "Shopping", "Transport"].map(item => (
                            <a
                              key={item}
                              href={`https://www.google.com/maps/search/${item}/@${business.location_lat},${business.location_lng},15z`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-seafoam/20 text-primaryTeal rounded-full text-sm hover:bg-seafoam/30 transition-colors"
                            >
                              {item}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-subtle p-6">
                    <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-4">Nearby Attractions</h3>
                    <p className="text-grayLight">Information about nearby attractions not available</p>
                  </div>
                </div>
              )}
              
              {/* Gallery Tab */}
              {selectedTab === "gallery" && (
                <div>
                  <h2 className="text-2xl font-heading font-semibold text-primaryTeal mb-4">Gallery</h2>
                  
                  {/* Video Embed (if available) */}
                  {business.video_url && business.video_provider && (
                    <div className="mb-6">
                      <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-3">Video Tour</h3>
                      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                        {business.video_provider === 'youtube' && (
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${getYoutubeVideoId(business.video_url)}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        )}
                        {business.video_provider === 'vimeo' && (
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://player.vimeo.com/video/${getVimeoVideoId(business.video_url)}`}
                            title="Vimeo video player"
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Main Selected Image */}
                  <div className="w-full h-80 mb-4 bg-grayLight rounded-lg overflow-hidden">
                    {gallery && gallery.length > 0 ? (
                      <img 
                        src={gallery[selectedImageIndex]} 
                        alt={`Gallery image ${selectedImageIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("Error loading image:", e);
                          e.currentTarget.src = "/placeholder-accommodation.jpg";
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-grayLight">No gallery images available</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnails */}
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {gallery && gallery.map((image, index) => (
                      <div 
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`cursor-pointer h-20 rounded-md overflow-hidden ${
                          selectedImageIndex === index ? 'ring-2 ring-primaryTeal' : ''
                        }`}
                      >
                        <img 
                          src={image} 
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error("Error loading thumbnail:", e);
                            e.currentTarget.src = "/placeholder-accommodation.jpg";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Booking Panel and Contact */}
          <div className="lg:col-span-1">
            {/* Booking Panel */}
            <div className="bg-white rounded-lg shadow-elevated p-6 mb-6 sticky top-4">
              <h3 className="text-xl font-heading font-semibold text-primaryTeal mb-4">Book Your Stay</h3>
              
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
                    value={checkInDate}
                    onChange={(e) => {
                      setCheckInDate(e.target.value);
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
                    value={checkOutDate}
                    onChange={(e) => {
                      setCheckOutDate(e.target.value);
                      // Clear error when user makes changes
                      if (dateError) setDateError(null);
                    }}
                    min={checkInDate || new Date().toISOString().split('T')[0]} // Prevent dates before check-in
                    required
                  />
                </div>
                
                {dateError && (
                  <div className="text-red-500 text-sm">{dateError}</div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-darkCharcoal mb-1">Rooms</label>
                    <select 
                      className="w-full px-3 py-2 border border-grayLight rounded-md focus:outline-none focus:ring-2 focus:ring-primaryTeal"
                      value={roomCount}
                      onChange={(e) => setRoomCount(parseInt(e.target.value))}
                    >
                      <option value={1}>1 Room</option>
                      <option value={2}>2 Rooms</option>
                      <option value={3}>3 Rooms</option>
                      <option value={4}>4+ Rooms</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-darkCharcoal mb-1">Guests</label>
                    <select 
                      className="w-full px-3 py-2 border border-grayLight rounded-md focus:outline-none focus:ring-2 focus:ring-primaryTeal"
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                    >
                      <option value={1}>1 Guest</option>
                      <option value={2}>2 Guests</option>
                      <option value={3}>3 Guests</option>
                      <option value={4}>4 Guests</option>
                      <option value={5}>5+ Guests</option>
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
              <div className="space-y-3">
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
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <button className="w-full py-2 border border-primaryTeal text-primaryTeal rounded-md font-medium hover:bg-primaryTeal hover:text-white transition">
                  Contact Host
                </button>
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
    </div>
  );
} 