'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Map } from 'lucide-react';
import { FilterPanelProps } from '../FilterSidebar';
import { danangNeighborhoods, getAllDistricts, getNeighborhoodsByDistrict, getPopularNeighborhoods, Neighborhood } from '@/data/danang-neighborhoods';
import { useTranslation } from '@/hooks/useTranslation';

interface LocationFilterValue {
  neighborhoodId?: string;
  district?: string;
  radius?: number;
  coordinates?: { lat: number; lng: number };
}

export default function EnhancedLocationFilter({ 
  filterKey, 
  value = {}, 
  onChange
}: FilterPanelProps) {
  const initialValue = value as LocationFilterValue;
  const { t, language } = useTranslation();
  
  // State
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>(
    initialValue.neighborhoodId || ''
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    initialValue.district || ''
  );
  const [radiusEnabled, setRadiusEnabled] = useState<boolean>(
    !!initialValue.coordinates
  );
  const [radius, setRadius] = useState<number>(
    initialValue.radius || 2
  );
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialValue.coordinates || null
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'neighborhoods' | 'districts' | 'radius'>('neighborhoods');
  const [popularNeighborhoods, setPopularNeighborhoods] = useState<Neighborhood[]>([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<Neighborhood[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [mapPreviewUrl, setMapPreviewUrl] = useState<string | null>(null);
  
  // Initialize data
  useEffect(() => {
    setPopularNeighborhoods(getPopularNeighborhoods(5));
    setDistricts(getAllDistricts());
    setFilteredNeighborhoods(danangNeighborhoods);
  }, []);
  
  // Update filtered neighborhoods when district changes
  useEffect(() => {
    if (selectedDistrict) {
      setFilteredNeighborhoods(getNeighborhoodsByDistrict(selectedDistrict));
    } else {
      setFilteredNeighborhoods(danangNeighborhoods);
    }
  }, [selectedDistrict]);
  
  // Update map preview when coordinates change
  useEffect(() => {
    if (coordinates && radiusEnabled) {
      // Generate a static map URL (e.g., Google Maps or Mapbox)
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (mapboxToken) {
        const { lat, lng } = coordinates;
        const zoom = radius <= 1 ? 15 : radius <= 3 ? 14 : radius <= 5 ? 13 : 12;
        const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+1A9CB0(${lng},${lat})/${lng},${lat},${zoom},0/300x150@2x?access_token=${mapboxToken}`;
        setMapPreviewUrl(mapUrl);
      }
    } else {
      setMapPreviewUrl(null);
    }
  }, [coordinates, radius, radiusEnabled]);

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
          setViewMode('radius');
          setIsLocating(false);
          
          // Clear neighborhood and district selections
          setSelectedNeighborhoodId('');
          setSelectedDistrict('');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError(t('errors.locationPermission', 'Could not get your location. Please check your browser permissions.'));
          setIsLocating(false);
        }
      );
    } else {
      setLocationError(t('errors.geolocationNotSupported', 'Geolocation is not supported by your browser.'));
      setIsLocating(false);
    }
  };

  // Handle neighborhood selection
  const handleNeighborhoodChange = (neighborhoodId: string) => {
    setSelectedNeighborhoodId(neighborhoodId);
    
    // If selecting a neighborhood, disable radius filter
    if (neighborhoodId) {
      setRadiusEnabled(false);
      
      // Find the neighborhood and get its coordinates
      const neighborhood = danangNeighborhoods.find(n => n.id === neighborhoodId);
      if (neighborhood) {
        // Set the district if available
        if (neighborhood.district) {
          setSelectedDistrict(neighborhood.district);
        }
        
        // Set coordinates for potential radius filtering later
        setCoordinates({
          lat: neighborhood.coordinates.latitude,
          lng: neighborhood.coordinates.longitude
        });
      }
    }
  };
  
  // Handle district selection
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSelectedNeighborhoodId(''); // Clear neighborhood selection when district changes
  };

  // Apply filters
  const handleSubmit = () => {
    const result: LocationFilterValue = {};
    
    if (selectedNeighborhoodId) {
      result.neighborhoodId = selectedNeighborhoodId;
      
      // Find the neighborhood to get its coordinates
      const neighborhood = danangNeighborhoods.find(n => n.id === selectedNeighborhoodId);
      if (neighborhood) {
        // Include coordinates for map centering
        result.coordinates = {
          lat: neighborhood.coordinates.latitude,
          lng: neighborhood.coordinates.longitude
        };
      }
    } else if (selectedDistrict) {
      result.district = selectedDistrict;
    }
    
    if (radiusEnabled && coordinates) {
      result.radius = radius;
      result.coordinates = coordinates;
    }
    
    onChange(result);
  };

  // Get neighborhood name based on current language
  const getLocalizedName = (neighborhood: Neighborhood) => {
    return language === 'vi' ? neighborhood.name.vi : neighborhood.name.en;
  };

  return (
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          className={`flex-1 py-2 px-1 text-xs font-medium ${
            viewMode === 'neighborhoods'
              ? 'text-primaryTeal border-b-2 border-primaryTeal'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setViewMode('neighborhoods')}
        >
          <MapPin size={14} className="inline-block mr-1" />
          {t('directory.neighborhoods', 'Neighborhoods')}
        </button>
        <button
          type="button"
          className={`flex-1 py-2 px-1 text-xs font-medium ${
            viewMode === 'districts'
              ? 'text-primaryTeal border-b-2 border-primaryTeal'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setViewMode('districts')}
        >
          <Map size={14} className="inline-block mr-1" />
          {t('directory.districts', 'Districts')}
        </button>
        <button
          type="button"
          className={`flex-1 py-2 px-1 text-xs font-medium ${
            viewMode === 'radius'
              ? 'text-primaryTeal border-b-2 border-primaryTeal'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setViewMode('radius');
            setRadiusEnabled(true);
            if (!coordinates) {
              getCurrentLocation();
            }
          }}
        >
          <Navigation size={14} className="inline-block mr-1" />
          {t('directory.radius', 'Radius')}
        </button>
      </div>

      {/* Neighborhoods View */}
      {viewMode === 'neighborhoods' && (
        <div className="space-y-3">
          {/* District Filter Dropdown */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('directory.filterByDistrict', 'Filter by district')}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
            >
              <option value="">{t('common.all', 'All')}</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
          
          {/* Neighborhoods List */}
          <div className="max-h-48 overflow-y-auto pr-1">
            <div className="space-y-1.5">
              {filteredNeighborhoods.map((neighborhood) => (
                <button
                  key={neighborhood.id}
                  type="button"
                  onClick={() => handleNeighborhoodChange(neighborhood.id)}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm ${
                    selectedNeighborhoodId === neighborhood.id
                      ? 'bg-primaryTeal/10 text-primaryTeal font-medium'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{getLocalizedName(neighborhood)}</span>
                    {neighborhood.district && (
                      <span className="text-xs text-gray-500">{neighborhood.district}</span>
                    )}
                  </div>
                  {selectedNeighborhoodId === neighborhood.id && (
                    <p className="text-xs text-gray-600 mt-1">
                      {language === 'vi' ? neighborhood.description.vi : neighborhood.description.en}
                    </p>
                  )}
                </button>
              ))}
              
              {filteredNeighborhoods.length === 0 && (
                <div className="text-center py-3 text-gray-500 text-sm">
                  {t('directory.noNeighborhoodsFound', 'No neighborhoods found')}
                </div>
              )}
            </div>
          </div>
          
          {/* Popular Neighborhoods */}
          {!selectedDistrict && popularNeighborhoods.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {t('directory.popularNeighborhoods', 'Popular Neighborhoods')}
              </label>
              <div className="flex flex-wrap gap-2">
                {popularNeighborhoods.map((neighborhood) => (
                  <button
                    key={neighborhood.id}
                    type="button"
                    onClick={() => handleNeighborhoodChange(neighborhood.id)}
                    className={`px-2 py-1 text-xs rounded-full ${
                      selectedNeighborhoodId === neighborhood.id
                        ? 'bg-primaryTeal text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getLocalizedName(neighborhood)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Districts View */}
      {viewMode === 'districts' && (
        <div className="space-y-3">
          <div className="max-h-48 overflow-y-auto">
            {districts.map((district) => (
              <button
                key={district}
                type="button"
                onClick={() => handleDistrictChange(district)}
                className={`w-full text-left px-3 py-2 rounded text-sm mb-1 ${
                  selectedDistrict === district
                    ? 'bg-primaryTeal/10 text-primaryTeal font-medium'
                    : 'hover:bg-gray-100'
                }`}
              >
                {district}
                {selectedDistrict === district && (
                  <div className="mt-2 text-xs text-gray-600">
                    {getNeighborhoodsByDistrict(district).length} {t('directory.neighborhoods', 'neighborhoods')}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Radius View */}
      {viewMode === 'radius' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {t('directory.radius', 'Radius')}: <strong>{radius} km</strong>
            </span>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isLocating}
              className="px-2 py-1 text-xs bg-primaryTeal text-white rounded-md hover:bg-seafoam disabled:opacity-50"
            >
              {isLocating ? t('common.locating', 'Locating...') : t('directory.useMyLocation', 'Use My Location')}
            </button>
          </div>
          
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={radius}
            onChange={(e) => setRadius(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primaryTeal"
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>0.5 km</span>
            <span>5 km</span>
            <span>10 km</span>
          </div>
          
          {locationError && (
            <div className="text-xs text-red-500 mt-1">{locationError}</div>
          )}
          
          {coordinates && mapPreviewUrl && (
            <div className="mt-2 rounded-md overflow-hidden">
              <img 
                src={mapPreviewUrl} 
                alt="Location Map" 
                className="w-full h-auto"
                onError={() => setMapPreviewUrl(null)}
              />
              <div className="bg-gray-50 p-2 text-xs text-gray-600">
                {t('directory.searchingWithinRadius', 'Searching within {{radius}} km radius', { radius })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apply Button */}
      <div className="pt-2 flex items-center justify-between space-x-2">
        <button
          type="button"
          onClick={() => {
            setSelectedNeighborhoodId('');
            setSelectedDistrict('');
            setRadiusEnabled(false);
            setRadius(2);
            setCoordinates(null);
            onChange({});
          }}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
        >
          {t('common.clear', 'Clear')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-primaryTeal text-white text-sm font-medium rounded-md hover:bg-seafoam transition-colors"
        >
          {t('common.apply', 'Apply')}
        </button>
      </div>
    </div>
  );
} 