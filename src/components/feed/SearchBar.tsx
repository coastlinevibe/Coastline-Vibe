'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Hash } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onHashtagSelect?: (hashtag: string) => void;
  popularHashtags?: string[];
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onHashtagSelect,
  popularHashtags = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchQuery]);

  // Trigger search on debounced query change
  useEffect(() => {
    if (debouncedQuery !== undefined) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery]); // Remove onSearch from dependencies

  const handleClear = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const handleHashtagClick = (hashtag: string) => {
    if (onHashtagSelect) {
      onHashtagSelect(hashtag);
    } else {
      setSearchQuery(`#${hashtag}`);
      setDebouncedQuery(`#${hashtag}`);
    }
  };

  return (
    <div className="mb-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
          placeholder="Search posts, hashtags, or users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        />
        {searchQuery && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={handleClear}
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {isFocused && popularHashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {popularHashtags.map((hashtag) => (
            <button
              key={hashtag}
              onClick={() => handleHashtagClick(hashtag)}
              className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded-full"
            >
              <Hash className="h-3 w-3 mr-1" />
              {hashtag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 