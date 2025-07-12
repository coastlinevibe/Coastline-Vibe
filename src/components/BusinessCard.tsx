"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import SocialShareButtons from "./shared/SocialShareButtons";

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    logo_url?: string;
    cover_image_url?: string;
    image_url?: string; // Keep for backward compatibility
    is_featured?: boolean;
    category?: string;
    category_name?: string;
    subcategory_name?: string;
    rating?: number;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export function BusinessCard({ business }: BusinessCardProps) {
  // Get communityId from URL params
  const params = useParams();
  const communityId = params?.communityId as string || '';
  const [showHoverCard, setShowHoverCard] = useState(false);
  const { t } = useTranslation();

  // Generate business URL for sharing
  const businessUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/community/${communityId}/business/${business.id}`
    : `/community/${communityId}/business/${business.id}`;

  // Function to toggle hover card for mobile
  const toggleHoverCard = () => {
    setShowHoverCard(!showHoverCard);
  };

  return (
    <div 
      className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl shadow-lg p-3 sm:p-5 flex flex-col border border-cyan-100 relative group overflow-hidden"
      onMouseEnter={() => setShowHoverCard(true)}
      onMouseLeave={() => setShowHoverCard(false)}
    >
      {/* Mobile-friendly info button */}
      <button 
        onClick={toggleHoverCard}
        className="absolute top-2 right-2 z-20 bg-white/80 p-1.5 rounded-full shadow-sm md:hidden"
        aria-label={showHoverCard ? "Hide details" : "Show details"}
      >
        <svg className="w-4 h-4 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {showHoverCard ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          )}
        </svg>
      </button>

      <div className="relative mb-2 sm:mb-3">
        <img
          src={
            (business.logo_url && business.logo_url.startsWith('http')) 
              ? business.logo_url 
              : (business.logo_url && business.logo_url.startsWith('/')) 
                ? `${typeof window !== 'undefined' ? window.location.origin : ''}${business.logo_url}`
                : (business.cover_image_url && business.cover_image_url.startsWith('http'))
                  ? business.cover_image_url
                  : (business.cover_image_url && business.cover_image_url.startsWith('/'))
                    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${business.cover_image_url}`
                    : '/placeholder-property.jpg'
          }
          alt={business.name}
          className="w-full h-28 sm:h-36 object-cover rounded-xl border-2 border-sky-100 shadow-sm bg-white"
        />
        {business.is_featured && (
          <span className="absolute top-2 left-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold text-white shadow-md bg-teal-500">{t('directory.featured', 'Featured')}</span>
        )}
      </div>
      <h3 className="font-semibold text-base sm:text-lg mb-1 text-cyan-900 truncate">{business.name || t('business.unnamed', 'Unnamed Business')}</h3>
      <div className="text-cyan-700 text-xs sm:text-sm mb-1 truncate">
        {business.category_name || business.category}
        {business.subcategory_name && (
          <span className="ml-2 text-cyan-500">/ {business.subcategory_name}</span>
        )}
      </div>
      <div className="flex items-center gap-1 mb-1 sm:mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < (business.rating || 0) ? 'text-yellow-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" /></svg>
        ))}
        <span className="ml-1 text-xs text-slate-500">{business.rating?.toFixed(1) || '0.0'}</span>
      </div>
      <div className="text-cyan-600 text-xs mb-2 line-clamp-2 sm:line-clamp-3 whitespace-pre-line">
        {business.description && business.description.length > 0 ? (
          <>{business.description.length > 120 ? business.description.slice(0, 120) + '...' : business.description}</>
        ) : null}
      </div>
      <div className="flex gap-2 mt-auto pt-2 justify-between items-center">
        <a href={`/community/${communityId}/business/${business.id}`} className="flex-1 px-3 py-1.5 rounded bg-teal-100 text-teal-700 text-xs font-medium hover:bg-teal-200 transition text-sm text-center">{t('common.view', 'View')}</a>
        <SocialShareButtons
          url={businessUrl}
          title={business.name}
          description={business.description || ''}
          imageUrl={
            (business.logo_url && business.logo_url.startsWith('http')) 
              ? business.logo_url 
              : (business.logo_url && business.logo_url.startsWith('/')) 
                ? `${typeof window !== 'undefined' ? window.location.origin : ''}${business.logo_url}`
                : (business.cover_image_url && business.cover_image_url.startsWith('http'))
                  ? business.cover_image_url
                  : (business.cover_image_url && business.cover_image_url.startsWith('/'))
                    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${business.cover_image_url}`
                    : ''
          }
          compact={true}
          showLabel={false}
        />
      </div>

      {/* Quick View Hover Card - Modified for mobile accessibility */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-cyan-900/95 to-teal-900/95 rounded-2xl p-3 sm:p-5 flex flex-col text-white z-10 transform transition-all duration-300 ${
          showHoverCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
      >
        <div className="flex items-center mb-2 sm:mb-3">
          <h3 className="font-semibold text-base sm:text-lg truncate">{business.name}</h3>
          {business.rating && business.rating > 0 && (
            <div className="ml-auto bg-yellow-400/20 text-yellow-300 px-1.5 sm:px-2 py-0.5 rounded text-xs font-semibold flex items-center">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 sm:mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" /></svg>
              {business.rating.toFixed(1)}
            </div>
          )}
        </div>
        
        {business.category_name && (
          <div className="inline-block bg-teal-700/50 text-cyan-100 px-2 py-0.5 rounded-full text-xs mb-2 sm:mb-3 truncate">
            {business.category_name}{business.subcategory_name && ` • ${business.subcategory_name}`}
          </div>
        )}
        
        {business.address && (
          <div className="mb-1.5 sm:mb-2 flex">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-cyan-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-xs sm:text-sm text-cyan-50 truncate">{business.address}</div>
          </div>
        )}
        
        {business.phone && (
          <div className="mb-1.5 sm:mb-2 flex">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-cyan-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div className="text-xs sm:text-sm text-cyan-50 truncate">{business.phone}</div>
          </div>
        )}
        
        {business.email && (
          <div className="mb-1.5 sm:mb-2 flex">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-cyan-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div className="text-xs sm:text-sm text-cyan-50 truncate">{business.email}</div>
          </div>
        )}
        
        <div className="mt-auto pt-2 sm:pt-3 flex flex-col gap-2">
          <a 
            href={`/community/${communityId}/business/${business.id}`} 
            className="block w-full py-1.5 sm:py-2 text-center rounded-lg bg-white text-teal-700 font-medium text-xs sm:text-sm hover:bg-cyan-50 transition shadow-md"
          >
            {t('business.viewFullDetails', 'View Full Details')}
          </a>
          
          <div className="flex justify-center">
            <SocialShareButtons
              url={businessUrl}
              title={business.name}
              description={business.description || ''}
              imageUrl={
                (business.logo_url && business.logo_url.startsWith('http')) 
                  ? business.logo_url 
                  : (business.logo_url && business.logo_url.startsWith('/')) 
                    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${business.logo_url}`
                    : (business.cover_image_url && business.cover_image_url.startsWith('http'))
                      ? business.cover_image_url
                      : (business.cover_image_url && business.cover_image_url.startsWith('/'))
                        ? `${typeof window !== 'undefined' ? window.location.origin : ''}${business.cover_image_url}`
                        : ''
              }
              className="justify-center"
              showLabel={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 