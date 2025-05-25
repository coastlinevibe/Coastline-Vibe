'use client';

import React, { useState, useRef, useEffect } from 'react';
// DatePicker might be removed if startDate/endDate filters are removed
// import DatePicker from 'react-datepicker'; 
import { X } from 'lucide-react'; 

// Ensure PostType is available, e.g. by import if FeedFilters uses it.
// This path assumes PostType is exported from PostToolbar in a way that can be imported.
// You might need to adjust this path based on your actual file structure.
import type { PostType } from '@/components/PostToolbar'; 

// This interface MUST match the Filters interface in CommunityFeedPage.tsx
export interface FeedFilters {
  searchTerm: string; // Changed from author?: string - UI will need to adapt
  sortBy: 'newest' | 'oldest' | 'most_liked' | 'most_commented'; // Added
  hashtags: string[]; // Kept
  postType: PostType | 'all'; // Added
  // Removed: containsImage, startDate, endDate, hasPoll as they are not in CommunityFeedPage's Filters type
}

// FeedSortOption is already aligned: 'newest' | 'oldest' | 'most_liked' | 'most_commented';
export type FeedSortOption = FeedFilters['sortBy'];

interface FeedFilterSortBarProps {
  currentFilters: FeedFilters; // This will now use the new unified FeedFilters type
  currentSort: FeedSortOption; // This is correct as it matches FeedFilters['sortBy']
  onFiltersChange: (newFilters: FeedFilters) => void;
  onSortChange: (newSort: FeedSortOption) => void;
  onClearFilters: () => void;
  // communityAuthors prop is removed as the 'author' filter is replaced by 'searchTerm'
  // If searchTerm needs suggestions, that's a different implementation.
}

const FeedFilterSortBar: React.FC<FeedFilterSortBarProps> = ({
  currentFilters,
  currentSort, // currentSort is now consistent with currentFilters.sortBy
  onFiltersChange,
  onSortChange,
  onClearFilters,
}) => {

  // State for searchTerm input (previously authorSearchText)
  const [searchTermInput, setSearchTermInput] = useState(currentFilters.searchTerm || '');
  // Removed authorSuggestions, showAuthorSuggestions, authorInputRef if specific author suggestion UI is removed

  const [currentHashtagInput, setCurrentHashtagInput] = useState('');
  const hashtagInputRef = useRef<HTMLInputElement>(null);

  // Removed localStartDate, localEndDate state as these filters are removed

  useEffect(() => {
    // Sync searchTerm input if filter is cleared externally or changed
    setSearchTermInput(currentFilters.searchTerm || '');
    // No need to sync currentHashtagInput from props
  }, [currentFilters.searchTerm]);

  // Handler for searchTerm input change
  const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTermInput(newSearchTerm);
    // Update filter immediately as user types for searchTerm
    onFiltersChange({
      ...currentFilters,
      searchTerm: newSearchTerm,
    });
  };

  // Removed selectAuthor function

  const handleSortDropdownChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(event.target.value as FeedSortOption);
  };

  // Removed handleContainsImageChange, handleStartDateChange, handleEndDateChange, handleHasPollChange

  const handleCurrentHashtagInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentHashtagInput(event.target.value);
  };

  const handleAddHashtag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const newTag = currentHashtagInput.trim().replace(/^#/, '');
      if (newTag) {
        const currentActiveHashtags = currentFilters.hashtags || [];
        if (!currentActiveHashtags.includes(newTag)) {
          onFiltersChange({
            ...currentFilters,
            hashtags: [...currentActiveHashtags, newTag],
          });
        }
        setCurrentHashtagInput('');
      }
    }
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    const currentActiveHashtags = currentFilters.hashtags || [];
    onFiltersChange({
      ...currentFilters,
      hashtags: currentActiveHashtags.filter(tag => tag !== tagToRemove),
    });
  };
  
  // Handler for PostType filter (e.g., a select dropdown)
  const handlePostTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
        ...currentFilters,
        postType: event.target.value as PostType | 'all',
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Adjusted grid */} 
          {/* Search Term Input (replaces Author Filter) */}
          <div className="p-2">
            <label htmlFor="search-term-filter" className="sr-only">Search posts</label>
            <input 
              type="text"
              id="search-term-filter"
              placeholder="Search by keyword..."
              value={searchTermInput}
              onChange={handleSearchTermChange}
              className="block w-full pl-3 pr-3 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md shadow-sm"
            />
          </div>

          {/* Hashtag Filter Input & Display */}
          <div className="p-2 lg:col-span-1"> 
            <label htmlFor="hashtag-input" className="sr-only">Filter by Hashtags</label>
            <input 
              ref={hashtagInputRef}
              type="text"
              id="hashtag-input"
              placeholder="Type #tag & press Enter"
              value={currentHashtagInput}
              onChange={handleCurrentHashtagInputChange}
              onKeyDown={handleAddHashtag}
              className="block w-full pl-3 pr-3 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md shadow-sm"
            />
            {currentFilters.hashtags && currentFilters.hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {currentFilters.hashtags.map(tag => (
                  <span key={tag} className="flex items-center bg-sky-100 text-sky-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    #{tag} 
                    <button onClick={() => handleRemoveHashtag(tag)} className="ml-1 text-sky-500 hover:text-sky-700 focus:outline-none" aria-label={`Remove hashtag ${tag}`}> <X size={12} /> </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Post Type Filter Dropdown */}
          <div className="p-2">
            <label htmlFor="post-type-filter" className="sr-only">Filter by Post Type</label>
            <select 
              id="post-type-filter"
              value={currentFilters.postType}
              onChange={handlePostTypeChange}
              className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="ask">Ask</option>
              <option value="announce">Announcement</option>
              <option value="event">Event</option>
              <option value="poll">Poll</option>
            </select>
          </div>

          {/* Removed UI for: Contains Image, Date Range, Has Poll */}
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0 flex-shrink-0">
          <div>
            <label htmlFor="sort-options" className="sr-only">Sort posts by</label>
            <select 
              id="sort-options"
              value={currentSort} // This should be currentFilters.sortBy if currentSort prop is removed
              onChange={handleSortDropdownChange}
              className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_liked">Most Liked</option>
              <option value="most_commented">Most Commented</option>
            </select>
          </div>
          <button onClick={onClearFilters} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedFilterSortBar; 