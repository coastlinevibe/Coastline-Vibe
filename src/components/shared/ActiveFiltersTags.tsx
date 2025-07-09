'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ActiveFiltersTagsProps {
  filters: Record<string, any>;
  onRemoveFilter: (key: string, subKey?: string) => void;
  className?: string;
}

export default function ActiveFiltersTags({
  filters,
  onRemoveFilter,
  className = ''
}: ActiveFiltersTagsProps) {
  // Format filter value for display
  const formatFilterValue = (key: string, value: any): string => {
    switch (key) {
      case 'category':
        return value;
      case 'search':
        return `"${value}"`;
      case 'rating':
        return `${value}+ Stars`;
      case 'amenities':
        // For array values, we'll create separate tags
        return '';
      case 'price':
        if (value.tier) {
          const tiers: Record<string, string> = { '1': '$', '2': '$$', '3': '$$$', '4': '$$$$' };
          return tiers[value.tier as string] || '';
        } else if (value.range) {
          return `$${value.range.min} - $${value.range.max}`;
        }
        return '';
      case 'hours':
        if (value.openNow) {
          return 'Open Now';
        } else if (value.days?.length) {
          return `Open: ${value.days.length} days`;
        }
        return '';
      case 'location':
        if (value.neighborhood) {
          return value.neighborhood;
        } else if (value.radius && value.coordinates) {
          return `Within ${value.radius}km`;
        }
        return '';
      default:
        return typeof value === 'string' ? value : '';
    }
  };

  // Get filter label
  const getFilterLabel = (key: string): string => {
    switch (key) {
      case 'category': return 'Category';
      case 'search': return 'Search';
      case 'rating': return 'Rating';
      case 'amenities': return 'Amenity';
      case 'price': return 'Price';
      case 'hours': return 'Hours';
      case 'location': return 'Location';
      default: return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  // Get amenity label
  const getAmenityLabel = (amenityId: string): string => {
    const amenityMap: Record<string, string> = {
      wifi: 'WiFi',
      parking: 'Parking',
      accessibility: 'Accessible',
      delivery: 'Delivery',
      takeout: 'Takeout',
      outdoor_seating: 'Outdoor Seating',
      reservations: 'Reservations',
      credit_cards: 'Credit Cards',
      family_friendly: 'Family Friendly',
      pet_friendly: 'Pet Friendly'
    };
    
    return amenityMap[amenityId] || amenityId;
  };

  // Generate filter tags
  const generateFilterTags = () => {
    const tags: React.ReactNode[] = [];
    
    // Process each filter
    Object.entries(filters).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0) || 
          (typeof value === 'object' && Object.keys(value).length === 0)) {
        return;
      }

      // Special handling for arrays (amenities)
      if (key === 'amenities' && Array.isArray(value) && value.length > 0) {
        value.forEach((amenityId: string) => {
          tags.push(
            <div 
              key={`${key}-${amenityId}`}
              className="inline-flex items-center px-2 py-1 rounded-full bg-primaryTeal/10 text-primaryTeal text-xs font-medium mr-2 mb-2"
            >
              <span className="mr-1">{getAmenityLabel(amenityId)}</span>
              <button
                onClick={() => onRemoveFilter(key, amenityId)}
                className="p-0.5 hover:bg-primaryTeal/20 rounded-full"
                aria-label={`Remove ${getAmenityLabel(amenityId)} filter`}
              >
                <X size={12} />
              </button>
            </div>
          );
        });
        return;
      }

      // For other filter types
      const displayValue = formatFilterValue(key, value);
      if (!displayValue) return;

      tags.push(
        <div 
          key={key}
          className="inline-flex items-center px-2 py-1 rounded-full bg-primaryTeal/10 text-primaryTeal text-xs font-medium mr-2 mb-2"
        >
          <span className="mr-1">{getFilterLabel(key)}: {displayValue}</span>
          <button
            onClick={() => onRemoveFilter(key)}
            className="p-0.5 hover:bg-primaryTeal/20 rounded-full"
            aria-label={`Remove ${getFilterLabel(key)} filter`}
          >
            <X size={12} />
          </button>
        </div>
      );
    });
    
    return tags;
  };

  const filterTags = generateFilterTags();
  
  if (filterTags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center ${className}`}>
      <span className="text-sm text-gray-500 mr-2">Active Filters:</span>
      {filterTags}
      {filterTags.length > 1 && (
        <button
          onClick={() => Object.keys(filters).forEach(key => onRemoveFilter(key))}
          className="text-xs text-red-500 hover:text-red-700 font-medium underline ml-1"
        >
          Clear All
        </button>
      )}
    </div>
  );
} 