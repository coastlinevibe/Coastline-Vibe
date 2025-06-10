'use client';

import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { FilterPanelProps } from '../FilterSidebar';

interface LocationValue {
  city: string;
  area?: string;
}

export default function LocationFilter({ 
  filterKey, 
  value = { city: '', area: '' }, 
  onChange 
}: FilterPanelProps) {
  const [localValue, setLocalValue] = useState<LocationValue>(value as LocationValue);
  
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(prev => ({ ...prev, city: e.target.value }));
  };
  
  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(prev => ({ ...prev, area: e.target.value }));
  };
  
  const handleSubmit = () => {
    // Only save if city is provided
    if (localValue.city.trim()) {
      onChange(localValue);
    }
  };
  
  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, this would convert coordinates to a city name
          // using a geocoding service
          setLocalValue({ 
            city: 'Current Location',
            area: `${position.coords.latitude.toFixed(4)},${position.coords.longitude.toFixed(4)}`
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="city-input" className="block text-sm font-medium text-gray-700 mb-1">
          City
        </label>
        <div className="relative">
          <input
            id="city-input"
            type="text"
            value={localValue.city}
            onChange={handleCityChange}
            placeholder="Enter city"
            className="w-full pl-8 pr-3 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      <div>
        <label htmlFor="area-input" className="block text-sm font-medium text-gray-700 mb-1">
          Area (optional)
        </label>
        <input
          id="area-input"
          type="text"
          value={localValue.area || ''}
          onChange={handleAreaChange}
          placeholder="Area or neighborhood"
          className="w-full px-3 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
        />
      </div>
      
      <button
        type="button"
        onClick={handleUseMyLocation}
        className="flex items-center text-xs text-cyan-600 hover:text-cyan-700"
      >
        <MapPin size={12} className="mr-1" />
        Use my current location
      </button>
      
      <div className="pt-2 flex items-center justify-end space-x-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-md hover:bg-cyan-700 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
} 