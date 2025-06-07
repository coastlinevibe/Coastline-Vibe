'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Home, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import LocationPreferences from './LocationPreferences';

interface LocationFiltersProps {
  userId: string;
  communityId: string;
  onLocationFilterChange: (filters: {
    neighborhoods?: string[];
    maxDistance?: number;
    showOnlyVerified?: boolean;
  }) => void;
}

const LocationFilters: React.FC<LocationFiltersProps> = ({
  userId,
  communityId,
  onLocationFilterChange
}) => {
  const supabase = createClient();
  const [preferences, setPreferences] = useState<{
    id?: string;
    feed_radius_km: number;
    preferred_neighborhoods: string[];
    hide_distant_posts: boolean;
    show_only_verified_locations: boolean;
    last_latitude?: number | null;
    last_longitude?: number | null;
    last_location_name?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNeighborhoods, setActiveNeighborhoods] = useState<string[]>([]);
  const [locationEnabled, setLocationEnabled] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [userId, communityId]);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_location_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('community_id', communityId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
      }
      
      if (data) {
        setPreferences(data);
        setLocationEnabled(data.last_latitude !== null && data.last_longitude !== null);
        
        // Initially apply the user's preferences as filters
        onLocationFilterChange({
          neighborhoods: data.preferred_neighborhoods,
          maxDistance: data.hide_distant_posts ? data.feed_radius_km : undefined,
          showOnlyVerified: data.show_only_verified_locations
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleNeighborhood = (neighborhood: string) => {
    let newActiveNeighborhoods;
    
    if (activeNeighborhoods.includes(neighborhood)) {
      newActiveNeighborhoods = activeNeighborhoods.filter(n => n !== neighborhood);
    } else {
      newActiveNeighborhoods = [...activeNeighborhoods, neighborhood];
    }
    
    setActiveNeighborhoods(newActiveNeighborhoods);
    
    onLocationFilterChange({
      neighborhoods: newActiveNeighborhoods.length > 0 ? newActiveNeighborhoods : undefined,
      maxDistance: preferences?.hide_distant_posts ? preferences.feed_radius_km : undefined,
      showOnlyVerified: preferences?.show_only_verified_locations
    });
  };

  const handlePreferencesChanged = () => {
    fetchPreferences();
  };

  if (loading) {
    return <div className="flex justify-center p-2 text-sm">Loading location filters...</div>;
  }

  if (!preferences) {
    return (
      <div className="bg-white rounded-lg shadow p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <MapPin className="inline-block h-4 w-4 mr-1" />
            No location preferences set
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-1" />
                Set Location
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Location Settings</SheetTitle>
                <SheetDescription>
                  Configure your hyperlocal feed preferences
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                <LocationPreferences 
                  userId={userId} 
                  communityId={communityId} 
                  onPreferencesChanged={handlePreferencesChanged}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-sm">
          <MapPin className="h-4 w-4 mr-1 text-blue-500" />
          {locationEnabled ? (
            <span className="font-medium">{preferences.last_location_name || 'Current Location'}</span>
          ) : (
            <span className="text-gray-500">Location not set</span>
          )}
          {preferences.hide_distant_posts && (
            <Badge variant="outline" className="ml-2 text-xs">
              {preferences.feed_radius_km} km radius
            </Badge>
          )}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Location Settings</SheetTitle>
              <SheetDescription>
                Configure your hyperlocal feed preferences
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <LocationPreferences 
                userId={userId} 
                communityId={communityId} 
                onPreferencesChanged={handlePreferencesChanged}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {preferences.preferred_neighborhoods.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500">My Neighborhoods</div>
          <div className="flex flex-wrap gap-2">
            {preferences.preferred_neighborhoods.map((neighborhood) => (
              <Badge 
                key={neighborhood} 
                variant={activeNeighborhoods.includes(neighborhood) ? "default" : "outline"}
                className="cursor-pointer flex items-center gap-1"
                onClick={() => toggleNeighborhood(neighborhood)}
              >
                <Home className="h-3 w-3" />
                {neighborhood}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationFilters; 