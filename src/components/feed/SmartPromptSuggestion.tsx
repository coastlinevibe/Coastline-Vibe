'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface SmartPromptSuggestionProps {
  inputText: string;
  onSelectSuggestion: (suggestion: string) => void;
}

const SmartPromptSuggestion: React.FC<SmartPromptSuggestionProps> = ({
  inputText,
  onSelectSuggestion,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Only fetch suggestions when input starts with "I'm looking for" or "Im looking for"
      if (
        inputText.toLowerCase().startsWith("i'm looking for") ||
        inputText.toLowerCase().startsWith("im looking for")
      ) {
        setIsLoading(true);
        try {
          const response = await fetch('/api/ai/post-suggestions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputText }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
          }

          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setIsExpanded(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Clear suggestions when input doesn't match the trigger
        setSuggestions([]);
      }
    };

    // Debounce the API call to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputText]);

  // No need to render anything if there are no suggestions
  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div 
      ref={suggestionsRef}
      className="mt-1 bg-blue-50 rounded-md border border-blue-200 overflow-hidden transition-all duration-200"
    >
      {/* Header with toggle */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-blue-100 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center text-blue-700">
          <Lightbulb size={16} className="mr-2" />
          <span className="text-sm font-medium">Smart Suggestions</span>
        </div>
        <button className="text-blue-700">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Suggestions list */}
      {isExpanded && (
        <div className="p-2">
          {isLoading ? (
            <div className="p-2 text-sm text-gray-500 flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              Generating suggestions...
            </div>
          ) : (
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className={`p-2 text-sm rounded-md cursor-pointer hover:bg-blue-100 ${
                    index === activeSuggestionIndex ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => onSelectSuggestion(suggestion)}
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartPromptSuggestion; 