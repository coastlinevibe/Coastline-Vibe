import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, X, Smile, AlertCircle, Check, Zap, Terminal, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MediaUploader from './MediaUploader';
import { moderateContent, generateContentSuggestions, politeRewrite } from '@/utils/aiUtils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface PostCreatorProps {
  communityId: string;
  onPostCreated: () => void;
}

export default function PostCreator({ communityId, onPostCreated }: PostCreatorProps) {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [mediaState, setMediaState] = useState<{ images: string[], video: string | null }>({
    images: [],
    video: null
  });
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [showPoliteRewrite, setShowPoliteRewrite] = useState(false);
  const [politeContent, setPoliteContent] = useState('');
  const [isLoadingPolite, setIsLoadingPolite] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [sensitivityCheck, setSensitivityCheck] = useState<{ isAppropriate: boolean; kindnessSuggestion: string | null } | null>(null);
  const [isCheckingSensitivity, setIsCheckingSensitivity] = useState(false);
  const [currentlyTyping, setCurrentlyTyping] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();
  
  // Location state
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    locationName: string | null;
    neighborhood: string | null;
  }>({
    latitude: null,
    longitude: null,
    locationName: null,
    neighborhood: null
  });

  const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim() && mediaState.images.length === 0 && !mediaState.video) return;

    // Check content sensitivity before posting
    if (!sensitivityCheck) {
      await checkSensitivity();
      return;
    }

    if (!sensitivityCheck.isAppropriate) {
      // Let the user decide if they want to continue despite the warning
      if (!window.confirm(
        `${sensitivityCheck.kindnessSuggestion || 'This content may not be appropriate for the community.'}\n\nDo you still want to post it?`
      )) {
        return;
      }
    }

    setIsPosting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      try {
        // Prepare post data
        const postData = {
          content,
          user_id: user.id,
          community_id: communityId,
          type: 'general',
          is_visible: true,
          images: mediaState.images.length > 0 ? mediaState.images : null,
          video_url: mediaState.video,
          // Add location data if available
          latitude: locationEnabled ? location.latitude : null,
          longitude: locationEnabled ? location.longitude : null,
          location_name: locationEnabled ? location.locationName : null,
          neighborhood: locationEnabled ? location.neighborhood : null,
          location_verified: locationEnabled // All location data added via device GPS is considered verified
        };

        const { data, error } = await supabase.from('posts').insert(postData).select();

        if (error) {
          console.error('Error creating post:', error);
          alert('Failed to create post. Please try again.');
        } else {
          console.log('Post created successfully!', data);
          setContent('');
          setMediaState({ images: [], video: null });
          setSensitivityCheck(null);
          setSuggestions([]);
          // Reset location state
          setLocationEnabled(false);
          onPostCreated();
        }
      } catch (error) {
        console.error('Error in post submission:', error);
        alert('An unexpected error occurred. Please try again.');
      }
    }
    setIsPosting(false);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    setSensitivityCheck(null);
    
    // Show user is typing
    setCurrentlyTyping(true);
    
    // Clear previous timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    
    // Set a new timer
    typingTimerRef.current = setTimeout(() => {
      setCurrentlyTyping(false);
      
      // Only generate suggestions if there's some content but not too much
      if (newValue.trim().length > 10 && newValue.trim().length < 100) {
        generateSuggestions(newValue);
      } else {
        setSuggestions([]);
      }
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setContent(suggestion);
    setSuggestions([]);
  };

  const generateSuggestions = async (text: string) => {
    if (!text.trim() || text.length < 10) return;
    
    setIsLoadingSuggestions(true);
    try {
      const suggestionsData = await generateContentSuggestions(text, communityId);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handlePoliteRewrite = async () => {
    if (!content.trim()) return;
    
    setIsLoadingPolite(true);
    try {
      const rewrittenText = await politeRewrite(content);
      setPoliteContent(rewrittenText);
      setShowPoliteRewrite(true);
    } catch (error) {
      console.error('Error rewriting content:', error);
      alert('Failed to rewrite content. Please try again.');
    } finally {
      setIsLoadingPolite(false);
    }
  };

  const acceptPoliteRewrite = () => {
    setContent(politeContent);
    setShowPoliteRewrite(false);
    setPoliteContent('');
  };

  const checkSensitivity = async () => {
    if (!content.trim()) return;
    
    setIsCheckingSensitivity(true);
    try {
      const result = await moderateContent(content);
      setSensitivityCheck(result);
    } catch (error) {
      console.error('Error checking content sensitivity:', error);
      setSensitivityCheck(null);
    } finally {
      setIsCheckingSensitivity(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get location name via reverse geocoding
        let locationName = null;
        let neighborhood = null;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          locationName = data.display_name || 'Current Location';
          
          // Try to extract neighborhood from the address
          neighborhood = data.address?.suburb || 
                         data.address?.neighbourhood || 
                         data.address?.district ||
                         data.address?.city_district ||
                         null;
        } catch (error) {
          console.error('Error getting location name:', error);
          locationName = 'Current Location';
        }
        
        setLocation({
          latitude,
          longitude,
          locationName,
          neighborhood
        });
        
        setLocationEnabled(true);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert(`Error getting location: ${error.message}`);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const removeLocation = () => {
    setLocationEnabled(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <form onSubmit={handlePostSubmit}>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={3}
          placeholder="What's on your mind?"
          value={content}
          onChange={handleContentChange}
          disabled={isPosting}
        />
        
        {/* Image preview area */}
        {mediaState.images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {mediaState.images.map((url, index) => (
              <div key={index} className="relative">
                <img 
                  src={url} 
                  alt={`Preview ${index}`} 
                  className="h-20 w-20 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    // Remove image from state and revoke URL
                    const urlToRevoke = mediaState.images[index];
                    setMediaState(prev => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index)
                    }));
                    URL.revokeObjectURL(urlToRevoke);
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/3 -translate-y-1/3"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Video preview */}
        {mediaState.video && (
          <div className="mt-3 relative">
            <video 
              src={mediaState.video} 
              controls
              className="w-full rounded max-h-48"
            />
            <button
              type="button"
              onClick={() => {
                // Remove video from state and revoke URL
                const urlToRevoke = mediaState.video as string;
                setMediaState(prev => ({
                  ...prev,
                  video: null
                }));
                URL.revokeObjectURL(urlToRevoke);
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        {/* Location information */}
        {locationEnabled && location.locationName && (
          <div className="mt-2 flex items-center">
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin size={14} className="text-blue-500" />
              <span>
                {location.locationName.length > 30 
                  ? location.locationName.substring(0, 30) + '...' 
                  : location.locationName}
              </span>
              {location.neighborhood && (
                <span className="text-gray-500 text-xs ml-1">({location.neighborhood})</span>
              )}
              <button
                type="button"
                className="ml-1 text-gray-500 hover:text-gray-700"
                onClick={removeLocation}
              >
                <X size={14} />
              </button>
            </Badge>
          </div>
        )}
        
        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center text-sm text-blue-600">
              <Zap size={16} className="mr-1" />
              <span>AI Suggestions:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-full truncate max-w-full"
                >
                  {suggestion.length > 40 ? suggestion.substring(0, 40) + "..." : suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Sensitivity check result */}
        {sensitivityCheck && (
          <div className={`mt-3 p-2 rounded ${
            !sensitivityCheck.isAppropriate 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            <div className="flex items-center">
              {!sensitivityCheck.isAppropriate ? (
                <AlertCircle size={16} className="mr-1" />
              ) : (
                <Check size={16} className="mr-1" />
              )}
              <span>
                {!sensitivityCheck.isAppropriate 
                  ? (sensitivityCheck.kindnessSuggestion || 'This content may be sensitive or inappropriate.') 
                  : 'Content looks good!'}
              </span>
            </div>
          </div>
        )}
        
        {/* Currently typing indicator */}
        {currentlyTyping && (
          <div className="mt-2 text-xs text-gray-500 flex items-center">
            <Terminal size={12} className="mr-1 animate-pulse" />
            <span>AI features are ready to assist you...</span>
          </div>
        )}
        
        {/* Polite rewrite modal */}
        {showPoliteRewrite && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Community-Friendly Version</h3>
                <button 
                  type="button" 
                  onClick={() => setShowPoliteRewrite(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="font-medium text-sm mb-1">Original:</div>
                <div className="p-3 bg-gray-100 rounded text-gray-800">{content}</div>
              </div>
              
              <div className="mb-4">
                <div className="font-medium text-sm mb-1">Polite Version:</div>
                <div className="p-3 bg-blue-50 rounded text-blue-800">{politeContent}</div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPoliteRewrite(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Keep Original
                </button>
                <button
                  type="button"
                  onClick={acceptPoliteRewrite}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Use Polite Version
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex space-x-2">
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              onClick={() => setShowMediaUploader(true)}
              disabled={isPosting}
            >
              <ImageIcon size={20} />
            </button>
            
            <button
              type="button"
              className={`p-2 rounded-full ${
                locationEnabled 
                ? 'text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={getCurrentLocation}
              disabled={isPosting || isGettingLocation}
              title="Add your location to the post"
            >
              <MapPin size={20} />
            </button>

            {/* AI Features */}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handlePoliteRewrite}
                disabled={!content.trim() || isLoadingPolite}
                className={`flex items-center px-2 py-1 rounded ${
                  content.trim() ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <Smile size={16} className="mr-1" />
                <span>{isLoadingPolite ? 'Rewriting...' : 'Polite Rewrite'}</span>
              </button>
              
              <button
                type="button"
                onClick={checkSensitivity}
                disabled={!content.trim() || isCheckingSensitivity}
                className={`flex items-center px-2 py-1 rounded ${
                  content.trim() ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <AlertCircle size={16} className="mr-1" />
                <span>{isCheckingSensitivity ? 'Checking...' : 'Check Content'}</span>
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPosting || isCheckingSensitivity || (!content.trim() && mediaState.images.length === 0 && !mediaState.video)}
          >
            {isPosting || isCheckingSensitivity ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isCheckingSensitivity ? 'Checking...' : 'Posting...'}
              </span>
            ) : (
              <>
                <Send size={18} className="mr-1" />
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Media uploader dialog */}
      {showMediaUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Media</h3>
              <button 
                onClick={() => setShowMediaUploader(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <MediaUploader 
              onMediaSelected={(media) => {
                setMediaState(media);
                setShowMediaUploader(false);
              }}
              onError={(error) => {
                console.error('Media upload error:', error);
                alert('Failed to upload media. Please try again.');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 