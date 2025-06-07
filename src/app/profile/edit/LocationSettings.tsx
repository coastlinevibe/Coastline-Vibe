'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { MapPin, Navigation, Home, Tag } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface LocationSettingsProps {
  userId: string;
  communityId: string;
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

const LocationSettings: React.FC<LocationSettingsProps> = ({ userId, communityId }) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
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
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
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
    setSaving(true);
    setSuccess(false);
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
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Your browser doesn't support geolocation.");
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
      },
      (error) => {
        console.error('Error getting location:', error);
        setGettingLocation(false);
        alert(`Error getting location: ${error.message}`);
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
    return <div className="flex justify-center p-4">Loading location preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-cyan-900 mb-2">Hyperlocal Feed Settings</h2>
      
      {/* Current Location */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block font-medium mb-1">Your Location</label>
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
        <div className="text-sm bg-cyan-50 p-3 rounded">
          {currentLocation.locationName ? (
            <div className="flex items-center text-cyan-700">
              <MapPin className="h-4 w-4 mr-1" />
              {currentLocation.locationName}
            </div>
          ) : (
            <div className="flex items-center text-cyan-500">
              <MapPin className="h-4 w-4 mr-1" />
              No location set
            </div>
          )}
        </div>
      </div>

      {/* Radius Slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block font-medium mb-1">Feed Radius</label>
          <span className="text-sm font-medium">{preferences.feed_radius_km} km</span>
        </div>
        <Slider
          value={[preferences.feed_radius_km]}
          min={1}
          max={50}
          step={1}
          onValueChange={(value: number[]) => setPreferences({ ...preferences, feed_radius_km: value[0] })}
        />
        <p className="text-xs text-gray-500">
          Show posts within {preferences.feed_radius_km} km of your current location
        </p>
      </div>

      {/* Neighborhood Preferences */}
      <div className="space-y-2">
        <label className="block font-medium mb-1">Preferred Neighborhoods</label>
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
        <label className="block font-medium mb-1">Your Interests</label>
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
              <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
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
          <div>
            <label className="block font-medium">Hide Distant Posts</label>
            <p className="text-xs text-gray-500">
              Only show posts within your selected radius
            </p>
          </div>
          <Switch
            checked={preferences.hide_distant_posts}
            onCheckedChange={(checked: boolean) => setPreferences({ ...preferences, hide_distant_posts: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="block font-medium">Verified Locations Only</label>
            <p className="text-xs text-gray-500">
              Show only posts with verified locations
            </p>
          </div>
          <Switch
            checked={preferences.show_only_verified_locations}
            onCheckedChange={(checked: boolean) => setPreferences({ ...preferences, show_only_verified_locations: checked })}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button 
          className="flex-1" 
          onClick={savePreferences}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Location Preferences'}
        </Button>
        {success && <span className="text-green-600 text-sm">Preferences saved!</span>}
      </div>
    </div>
  );
};

export default LocationSettings;
