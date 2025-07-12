'use client';

import React, { useState } from 'react';
import { 
  Filter, Search, MapPin, Clock, DollarSign, 
  Settings, Star, BookmarkPlus, Tag, List 
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// Import filter panels
import BusinessAmenitiesFilter from './filter-panels/BusinessAmenitiesFilter';
import PriceRangeFilter from './filter-panels/PriceRangeFilter';
import OpeningHoursFilter from './filter-panels/OpeningHoursFilter';
import EnhancedLocationFilter from './filter-panels/EnhancedLocationFilter';
import SavedFiltersPanel from './filter-panels/SavedFiltersPanel';
import EnhancedCategoryFilter from './filter-panels/EnhancedCategoryFilter';

interface AdvancedFilterSidebarProps {
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearAllFilters: () => void;
  categories?: any[];
  neighborhoods?: string[];
  isCollapsible?: boolean;
  className?: string;
}

export default function AdvancedFilterSidebar({
  filters,
  onFilterChange,
  onClearAllFilters,
  categories = [],
  neighborhoods = [],
  isCollapsible = true,
  className = ''
}: AdvancedFilterSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(!isCollapsible);
  const [activeFilterPanel, setActiveFilterPanel] = useState<string | null>(null);
  const { t } = useTranslation();

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.amenities && filters.amenities.length > 0) count++;
    if (filters.price && (filters.price.range || filters.price.tier)) count++;
    if (filters.hours && (filters.hours.openNow || filters.hours.days || filters.hours.timeRange)) count++;
    if (filters.location && (filters.location.neighborhood || filters.location.radius)) count++;
    if (filters.rating && filters.rating > 0) count++;
    if (filters.sort && filters.sort !== 'featured') count++;
    
    return count;
  };
  
  const activeFiltersCount = countActiveFilters();
  
  // Filter panels configuration
  const filterPanels = [
    { 
      key: 'category', 
      label: t('directory.categories', 'Categories'), 
      icon: Tag,
      component: (
        <EnhancedCategoryFilter 
          filterKey="category" 
          value={filters.category || {}} 
          onChange={(value) => onFilterChange('category', value)} 
        />
      )
    },
    { 
      key: 'location', 
      label: t('directory.location', 'Location'), 
      icon: MapPin,
      component: (
        <EnhancedLocationFilter 
          filterKey="location" 
          value={filters.location || {}} 
          onChange={(value) => onFilterChange('location', value)} 
        />
      )
    },
    { 
      key: 'amenities', 
      label: t('directory.amenities', 'Amenities'), 
      icon: Settings,
      component: (
        <BusinessAmenitiesFilter 
          filterKey="amenities" 
          value={filters.amenities || []} 
          onChange={(value) => onFilterChange('amenities', value)} 
        />
      )
    },
    { 
      key: 'price', 
      label: t('directory.price', 'Price'), 
      icon: DollarSign,
      component: (
        <PriceRangeFilter 
          filterKey="price" 
          value={filters.price || {}} 
          onChange={(value) => onFilterChange('price', value)} 
        />
      )
    },
    { 
      key: 'hours', 
      label: t('directory.hours', 'Opening Hours'), 
      icon: Clock,
      component: (
        <OpeningHoursFilter 
          filterKey="hours" 
          value={filters.hours || {}} 
          onChange={(value) => onFilterChange('hours', value)} 
        />
      )
    },
    { 
      key: 'saved', 
      label: t('common.savedFilters', 'Saved Filters'), 
      icon: BookmarkPlus,
      component: (
        <SavedFiltersPanel 
          filterKey="saved" 
          value={[]} 
          onChange={(value) => {
            // Apply all filters from the saved filter
            Object.entries(value).forEach(([key, val]) => {
              onFilterChange(key, val);
            });
          }} 
          allFilters={filters}
        />
      )
    }
  ];

  // Toggle filter panel
  const toggleFilterPanel = (key: string) => {
    setActiveFilterPanel(activeFilterPanel === key ? null : key);
    if (!isExpanded && isCollapsible) {
      setIsExpanded(true);
    }
  };

  // Get active filter badge count for a specific filter
  const getFilterBadgeCount = (key: string) => {
    switch (key) {
      case 'category':
        return filters.category && filters.category !== 'All' ? 1 : 0;
      case 'location':
        return filters.location && (filters.location.neighborhood || filters.location.coordinates) ? 1 : 0;
      case 'amenities':
        return filters.amenities?.length || 0;
      case 'price':
        return filters.price && (filters.price.range || filters.price.tier) ? 1 : 0;
      case 'hours':
        return filters.hours && (filters.hours.openNow || filters.hours.days?.length || filters.hours.timeRange) ? 1 : 0;
      default:
        return 0;
    }
  };

  return (
    <div 
      id="advanced-filters-sidebar"
      className={`bg-white rounded-lg shadow-md transition-all duration-300 h-full flex flex-col ${
        isExpanded ? 'w-full lg:w-72' : 'w-14 sm:w-16'
      } ${className}`}
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        {isExpanded && (
          <h2 className="font-bold text-primaryTeal text-sm sm:text-base">{t('common.filters', 'Filters')}</h2>
        )}
        {isCollapsible && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-primaryTeal/10 rounded-full text-primaryTeal hover:bg-primaryTeal/20 transition-colors"
            aria-label={isExpanded ? t('common.collapseFilters', "Collapse filters") : t('common.expandFilters', "Expand filters")}
          >
            <Filter size={16} />
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex-1 overflow-y-auto">
        <ul className="py-2">
          {filterPanels.map((panel) => {
            const Icon = panel.icon;
            const isActive = activeFilterPanel === panel.key;
            const badgeCount = getFilterBadgeCount(panel.key);
            
            return (
              <li key={panel.key} className="mb-1 px-2">
                <button
                  className={`w-full flex items-center ${
                    isExpanded ? 'justify-between px-3 py-2' : 'justify-center py-3'
                  } ${
                    isActive 
                      ? 'bg-primaryTeal/10 text-primaryTeal' 
                      : badgeCount > 0 
                        ? 'bg-gray-50 text-primaryTeal' 
                        : 'text-gray-600 hover:bg-gray-50'
                  } rounded-md transition-colors relative`}
                  onClick={() => toggleFilterPanel(panel.key)}
                >
                  <div className="flex items-center">
                    <Icon size={isExpanded ? 16 : 20} />
                    {isExpanded && (
                      <span className="ml-3 font-medium text-sm sm:text-base">{panel.label}</span>
                    )}
                  </div>
                  {isExpanded && badgeCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center bg-primaryTeal/20 text-primaryTeal text-xs font-semibold rounded-full">
                      {badgeCount}
                    </span>
                  )}
                  {!isExpanded && badgeCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center bg-primaryTeal text-white text-xs font-semibold rounded-full">
                      {badgeCount}
                    </span>
                  )}
                </button>

                {/* Filter Panel (only when expanded and active) */}
                {isExpanded && isActive && (
                  <div className="mt-1 mx-1 p-3 bg-gray-50 rounded-md overflow-x-hidden">
                    {panel.component}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer with Clear All button */}
      {isExpanded && activeFiltersCount > 0 && (
        <div className="p-3 border-t">
          <button
            onClick={onClearAllFilters}
            className="w-full py-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            <span>✕</span>
            <span>{t('common.clearAll', 'Clear All')} ({activeFiltersCount})</span>
          </button>
        </div>
      )}
    </div>
  );
} 