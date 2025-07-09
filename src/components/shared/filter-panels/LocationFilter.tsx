'use client';

import React, { useState, useEffect } from 'react';
import { FilterPanelProps } from '../FilterSidebar';

interface LocationFilterValue {
  neighborhood?: string;
  radius?: number;
  coordinates?: { lat: number; lng: number };
}

export default function LocationFilter({ 
  filterKey, 
  value = {}, 
  onChange,
  neighborhoods = []
}: FilterPanelProps & { neighborhoods?: string[] }) {
  const initialValue = value as LocationFilterValue;
  
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(
    initialValue.neighborhood || ''
  );
  const [radiusEnabled, setRadiusEnabled] = useState<boolean>(
    !!initialValue.coordinates
  );
  const [radius, setRadius] = useState<number>(
    initialValue.radius || 5
  );
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialValue.coordinates || null
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [popularNeighborhoods, setPopularNeighborhoods] = useState<string[]>([]);

  // Set popular neighborhoods (could be based on data in a real app)
  useEffect(() => {
    if (neighborhoods.length > 0) {
      setPopularNeighborhoods(neighborhoods.slice(0, 5));
    }
  }, [neighborhoods]);

  // Get user's current location
  const getCurrentLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lng: longitude });
          setRadiusEnabled(true);
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Could not get your location. Please check your browser permissions.');
          setIsLocating(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };

  // Handle neighborhood selection
  const handleNeighborhoodChange = (neighborhood: string) => {
    setSelectedNeighborhood(neighborhood);
    // If selecting a neighborhood, disable radius filter
    if (neighborhood) {
      setRadiusEnabled(false);
      setCoordinates(null);
    }
  };

  // Apply filters
  const handleSubmit = () => {
    const result: LocationFilterValue = {};
    
    if (selectedNeighborhood) {
      result.neighborhood = selectedNeighborhood;
    }
    
    if (radiusEnabled && coordinates) {
      result.radius = radius;
      result.coordinates = coordinates;
    }
    
    onChange(result);
  };

  return (
    <div className="space-y-4">
      {/* Neighborhood Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Neighborhood</label>
        <select
          value={selectedNeighborhood}
          onChange={(e) => handleNeighborhoodChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Neighborhoods</option>
          {neighborhoods.map((neighborhood) => (
            <option key={neighborhood} value={neighborhood}>
              {neighborhood}
            </option>
          ))}
        </select>
      </div>

      {/* Popular Neighborhoods */}
      {popularNeighborhoods.length > 0 && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Popular Neighborhoods</label>
          <div className="flex flex-wrap gap-2">
            {popularNeighborhoods.map((neighborhood) => (
              <button
                key={neighborhood}
                type="button"
                onClick={() => handleNeighborhoodChange(neighborhood)}
                className={`px-2 py-1 text-xs rounded-full ${
                  selectedNeighborhood === neighborhood
                    ? 'bg-primaryTeal text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {neighborhood}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Distance Filter */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Distance Filter</label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={radiusEnabled}
              onChange={() => {
                setRadiusEnabled(!radiusEnabled);
                if (!radiusEnabled && !coordinates) {
                  getCurrentLocation();
                }
                if (radiusEnabled) {
                  setSelectedNeighborhood('');
                }
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primaryTeal transition-all duration-300 relative">
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-300 ${radiusEnabled ? 'translate-x-5' : ''}`}></div>
            </div>
          </label>
        </div>

        {radiusEnabled && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Radius: <strong>{radius} km</strong></span>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isLocating}
                className="px-2 py-1 text-xs bg-primaryTeal text-white rounded-md hover:bg-seafoam disabled:opacity-50"
              >
                {isLocating ? 'Locating...' : '📍 Use My Location'}
              </button>
            </div>
            
            <input
              type="range"
              min={1}
              max={50}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primaryTeal"
            />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 km</span>
              <span>25 km</span>
              <span>50 km</span>
            </div>
            
            {locationError && (
              <div className="text-xs text-red-500 mt-1">{locationError}</div>
            )}
            
            {coordinates && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs text-gray-700">
                <div>Using your location:</div>
                <div className="font-mono">
                  {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </div>
                {/* Map preview would go here in a real implementation */}
                <div className="mt-2 h-24 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                  Map Preview
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Apply Button */}
      <div className="pt-2 flex items-center justify-between space-x-2">
        <button
          type="button"
          onClick={() => {
            setSelectedNeighborhood('');
            setRadiusEnabled(false);
            setRadius(5);
            setCoordinates(null);
            onChange({});
          }}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-primaryTeal text-white text-sm font-medium rounded-md hover:bg-seafoam transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
} 