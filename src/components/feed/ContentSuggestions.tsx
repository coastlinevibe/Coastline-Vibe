import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { generateContentSuggestions } from '@/utils/aiUtils';
import { useParams } from 'next/navigation';

interface ContentSuggestionsProps {
  inputText: string;
  onSelectSuggestion: (suggestion: string) => void;
  disabled?: boolean;
}

export default function ContentSuggestions({
  inputText,
  onSelectSuggestion,
  disabled = false,
}: ContentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [debug, setDebug] = useState<string | null>(null);
  const params = useParams();
  const communityId = params?.communityId as string;

  // Get the base URL based on current window location
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:3001';
  };

  useEffect(() => {
    // Reset suggestions when input changes significantly
    setSuggestions([]);
    setExpanded(false);
  }, [inputText]);

  const fetchSuggestions = async () => {
    if (!inputText || inputText.length < 5 || disabled || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setDebug(`Fetching suggestions for: "${inputText.substring(0, 30)}..."`);
    
    try {
      const baseUrl = getBaseUrl();
      setDebug(`Using API base URL: ${baseUrl}`);
      
      const newSuggestions = await generateContentSuggestions(inputText, communityId);
      
      if (newSuggestions.length === 0) {
        setDebug('No suggestions returned');
      } else {
        setDebug(`Received ${newSuggestions.length} suggestions`);
        setSuggestions(newSuggestions);
        setExpanded(true);
      }
    } catch (err: any) {
      console.error('Error fetching suggestions:', err);
      setError(err.message || 'Failed to get suggestions. Please try again.');
      setDebug(`Error: ${JSON.stringify(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    setSuggestions([]);
    setExpanded(false);
  };

  // Test the API directly
  const testDirectApi = async () => {
    try {
      const baseUrl = getBaseUrl();
      setDebug(`Testing direct API call to ${baseUrl}/api/ai/suggest...`);
      
      const response = await fetch(`${baseUrl}/api/ai/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          promptStart: inputText,
          communityContext: communityId ? { communityId } : {} 
        }),
      });
      
      const data = await response.json();
      setDebug(`Direct API response: ${JSON.stringify(data)}`);
    } catch (err: any) {
      setDebug(`Direct API error: ${err.message}`);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={fetchSuggestions}
        disabled={disabled || isLoading || inputText.length < 5}
        className={`inline-flex items-center text-xs text-gray-600 hover:text-amber-600 ${
          isLoading || disabled || inputText.length < 5 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Get AI-powered content suggestions"
      >
        <Lightbulb className="w-4 h-4 mr-1" />
        {isLoading ? 'Getting suggestions...' : 'Suggest completions'}
      </button>

      {expanded && suggestions.length > 0 && (
        <div className="mt-2 p-2 bg-white border border-amber-200 rounded-md shadow-sm">
          <div className="text-xs font-medium text-amber-700 mb-1">Suggested completions:</div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSelect(suggestion)}
                className="p-1.5 text-sm bg-amber-50 hover:bg-amber-100 rounded cursor-pointer"
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 mt-1">
          {error}
        </div>
      )}
      
      {debug && process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-1 absolute top-full left-0 bg-white p-1 border border-gray-200 rounded z-10 max-w-xs">
          {debug}
          <button 
            className="block text-blue-500 text-xs mt-1" 
            onClick={testDirectApi}
          >
            Test Direct API
          </button>
        </div>
      )}
    </div>
  );
} 