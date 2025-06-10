'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Home, Navigation } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { useToast } from '../ui/toast';

interface LocationPreferencesProps {
  userId: string;
  communityId: string;
  onPreferencesChanged?: () => void;
}

interface LocationPreference {
  id?: string;
  user_id: string;
  community_id: string;
  feed_radius_km: number;
  preferred_neighborhoods: string[];
  interests: string[];
  hide_distant_posts: boolean;
  show_only_verified_locations: boolean;
  last_latitude?: number | null;
  last_longitude?: number | null;
  last_location_name?: string | null;
}

const LocationPreferences: React.FC<LocationPreferencesProps> = ({
  userId,
  communityId,
  onPreferencesChanged
}) => {
  const supabase = createClient();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<LocationPreference>({
    user_id: userId,
    community_id: communityId,
    feed_radius_km: 5,
    preferred_neighborhoods: [],
    interests: [],
    hide_distant_posts: false,
    show_only_verified_locations: false
  });
  const [loading, setLoading] = useState(true);
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    locationName: string | null;
  }>({
    latitude: null,
    longitude: null,
    locationName: null
  });
  const [gettingLocation, setGettingLocation] = useState(false);

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
        setCurrentLocation({
          latitude: data.last_latitude,
          longitude: data.last_longitude,
          locationName: data.last_location_name
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_location_preferences')
        .upsert({
          ...preferences,
          last_latitude: currentLocation.latitude,
          last_longitude: currentLocation.longitude,
          last_location_name: currentLocation.locationName
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data[0]) {
        setPreferences({
          ...preferences,
          id: data[0].id
        });
      }
      
      toast({
        title: "Preferences saved",
        description: "Your location preferences have been updated.",
        variant: "default"
      });
      
      if (onPreferencesChanged) {
        onPreferencesChanged();
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your preferences.",
        variant: "destructive"
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive"
      });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get location name via reverse geocoding
        let locationName = null;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          locationName = data.display_name || 'Current Location';
        } catch (error) {
          console.error('Error getting location name:', error);
          locationName = 'Current Location';
        }
        
        setCurrentLocation({
          latitude,
          longitude,
          locationName
        });
        
        setGettingLocation(false);
        
        toast({
          title: "Location updated",
          description: `Your location has been set to: ${locationName}`,
          variant: "default"
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        setGettingLocation(false);
        
        toast({
          title: "Error getting location",
          description: `${error.message}`,
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const addNeighborhood = () => {
    if (newNeighborhood && !preferences.preferred_neighborhoods.includes(newNeighborhood)) {
      setPreferences({
        ...preferences,
        preferred_neighborhoods: [...preferences.preferred_neighborhoods, newNeighborhood]
      });
      setNewNeighborhood('');
    }
  };

  const removeNeighborhood = (neighborhood: string) => {
    setPreferences({
      ...preferences,
      preferred_neighborhoods: preferences.preferred_neighborhoods.filter(n => n !== neighborhood)
    });
  };

  const addInterest = () => {
    if (newInterest && !preferences.interests.includes(newInterest)) {
      setPreferences({
        ...preferences,
        interests: [...preferences.interests, newInterest]
      });
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setPreferences({
      ...preferences,
      interests: preferences.interests.filter(i => i !== interest)
    });
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading preferences...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
      <div className="border-b pb-4">
        <h3 className="text-lg font-medium">Location Settings</h3>
        <p className="text-sm text-gray-500">Customize your hyperlocal feed experience</p>
      </div>

      <div className="space-y-6">
        {/* Current Location */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Your Location</Label>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={getCurrentLocation}
              disabled={gettingLocation}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {gettingLocation ? 'Getting location...' : 'Update Location'}
            </Button>
          </div>
          <div className="text-sm">
            {currentLocation.locationName ? (
              <div className="flex items-center text-gray-700">
                <MapPin className="h-4 w-4 mr-1" />
                {currentLocation.locationName}
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                No location set
              </div>
            )}
          </div>
        </div>

        {/* Radius Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm font-medium">Feed Radius</Label>
            <span className="text-sm font-medium">{preferences.feed_radius_km} km</span>
          </div>
          <Slider
            value={[preferences.feed_radius_km]}
            min={1}
            max={50}
            step={1}
            onValueChange={(value) => setPreferences({ ...preferences, feed_radius_km: value[0] })}
          />
          <p className="text-xs text-gray-500">
            Show posts within {preferences.feed_radius_km} km of your current location
          </p>
        </div>

        {/* Neighborhood Preferences */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preferred Neighborhoods</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add neighborhood"
              value={newNeighborhood}
              onChange={(e) => setNewNeighborhood(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={addNeighborhood}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.preferred_neighborhoods.length > 0 ? (
              preferences.preferred_neighborhoods.map((neighborhood) => (
                <Badge key={neighborhood} variant="secondary" className="flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  {neighborhood}
                  <button
                    className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                    onClick={() => removeNeighborhood(neighborhood)}
                  >
                    ×
                  </button>
                </Badge>
              ))
            ) : (
              <p className="text-xs text-gray-500">No preferred neighborhoods added</p>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Interests</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add interest"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={addInterest}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.interests.length > 0 ? (
              preferences.interests.map((interest) => (
                <Badge key={interest} variant="outline" className="flex items-center gap-1">
                  {interest}
                  <button
                    className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                    onClick={() => removeInterest(interest)}
                  >
                    ×
                  </button>
                </Badge>
              ))
            ) : (
              <p className="text-xs text-gray-500">No interests added</p>
            )}
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Hide Distant Posts</Label>
              <p className="text-xs text-gray-500">
                Only show posts within your selected radius
              </p>
            </div>
            <Switch
              checked={preferences.hide_distant_posts}
              onCheckedChange={(checked) => setPreferences({ ...preferences, hide_distant_posts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Verified Locations Only</Label>
              <p className="text-xs text-gray-500">
                Show only posts with verified locations
              </p>
            </div>
            <Switch
              checked={preferences.show_only_verified_locations}
              onCheckedChange={(checked) => setPreferences({ ...preferences, show_only_verified_locations: checked })}
            />
          </div>
        </div>

        {/* Save Button */}
        <Button 
          className="w-full" 
          onClick={savePreferences}
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default LocationPreferences; 