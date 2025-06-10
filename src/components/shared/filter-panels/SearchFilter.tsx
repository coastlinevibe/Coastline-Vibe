'use client';

import React, { useState } from 'react';
import { FilterPanelProps } from '../FilterSidebar';
import { Search, Tag } from 'lucide-react';

export default function SearchFilter({ 
  filterKey, 
  value = { term: '', tags: [] }, 
  onChange 
}: FilterPanelProps) {
  const [localValue, setLocalValue] = useState<{ term: string; tags: string[] }>(
    value as { term: string; tags: string[] } || { term: '', tags: [] }
  );
  const [currentTag, setCurrentTag] = useState('');
  
  const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(prev => ({ ...prev, term: e.target.value }));
  };
  
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      const newTag = currentTag.trim();
      if (!localValue.tags.includes(newTag)) {
        setLocalValue(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setCurrentTag('');
    }
  };
  
  const removeTag = (tag: string) => {
    setLocalValue(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  const handleSubmit = () => {
    // Only save if there's a search term or tags
    if (localValue.term.trim() || localValue.tags.length > 0) {
      onChange(localValue);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="search-term" className="block text-sm font-medium text-gray-700 mb-1">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            id="search-term"
            type="text"
            value={localValue.term}
            onChange={handleTermChange}
            placeholder="Search items"
            className="w-full pl-8 pr-3 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="tags-input" className="block text-sm font-medium text-gray-700 mb-1">
          Tags <span className="text-xs text-gray-500">(press Enter to add)</span>
        </label>
        <div className="relative">
          <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            id="tags-input"
            type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add tags"
            className="w-full pl-8 pr-3 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>
        
        {localValue.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {localValue.tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-cyan-600 hover:text-cyan-800 hover:bg-cyan-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="pt-2 flex items-center justify-end space-x-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-md hover:bg-cyan-700 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
} 