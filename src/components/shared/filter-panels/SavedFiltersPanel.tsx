'use client';

import React, { useState, useEffect } from 'react';
import { FilterPanelProps } from '../FilterSidebar';

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, any>;
  createdAt: string;
}

export default function SavedFiltersPanel({ 
  filterKey, 
  value = [], 
  onChange,
  allFilters = {}
}: FilterPanelProps & { allFilters?: Record<string, any> }) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [newFilterName, setNewFilterName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  
  // Load saved filters from localStorage on mount
  useEffect(() => {
    const storedFilters = localStorage.getItem('businessDirectorySavedFilters');
    if (storedFilters) {
      try {
        setSavedFilters(JSON.parse(storedFilters));
      } catch (e) {
        console.error('Failed to parse saved filters:', e);
      }
    }
  }, []);
  
  // Save filters to localStorage when they change
  useEffect(() => {
    if (savedFilters.length > 0) {
      localStorage.setItem('businessDirectorySavedFilters', JSON.stringify(savedFilters));
    }
  }, [savedFilters]);
  
  // Generate a unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };
  
  // Save current filters
  const saveCurrentFilters = () => {
    if (!newFilterName.trim()) return;
    
    const newFilter: SavedFilter = {
      id: generateId(),
      name: newFilterName.trim(),
      filters: { ...allFilters },
      createdAt: new Date().toISOString()
    };
    
    setSavedFilters(prev => [newFilter, ...prev]);
    setNewFilterName('');
    setShowSaveForm(false);
  };
  
  // Apply a saved filter
  const applySavedFilter = (filter: SavedFilter) => {
    onChange(filter.filters);
  };
  
  // Delete a saved filter
  const deleteSavedFilter = (id: string) => {
    setSavedFilters(prev => prev.filter(filter => filter.id !== id));
    
    // If localStorage has no more filters, remove the key
    if (savedFilters.length <= 1) {
      localStorage.removeItem('businessDirectorySavedFilters');
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Save Current Filters Form */}
      {!showSaveForm ? (
        <button
          type="button"
          onClick={() => setShowSaveForm(true)}
          className="w-full px-4 py-2 flex items-center justify-center gap-2 bg-primaryTeal text-white rounded-md hover:bg-seafoam transition-colors"
        >
          <span>➕</span> Save Current Filters
        </button>
      ) : (
        <div className="space-y-2 p-3 bg-primaryTeal/10 rounded-md">
          <label className="block text-sm font-medium text-gray-700">Filter Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFilterName}
              onChange={e => setNewFilterName(e.target.value)}
              placeholder="My favorite filters"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={saveCurrentFilters}
              disabled={!newFilterName.trim()}
              className="px-3 py-1 bg-primaryTeal text-white rounded-md disabled:opacity-50"
            >
              Save
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowSaveForm(false)}
            className="w-full text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
      
      {/* Saved Filters List */}
      {savedFilters.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Saved Filters</h3>
          <div className="space-y-2">
            {savedFilters.map(filter => (
              <div 
                key={filter.id} 
                className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
              >
                <button
                  type="button"
                  onClick={() => applySavedFilter(filter)}
                  className="flex-1 text-left text-sm font-medium text-gray-700 hover:text-primaryTeal"
                >
                  {filter.name}
                </button>
                <button
                  type="button"
                  onClick={() => deleteSavedFilter(filter.id)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Delete filter"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No saved filters yet.</p>
      )}
      
      {/* Recently Used Filters - Placeholder for future enhancement */}
      <div className="space-y-2 pt-3 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">Recently Used</h3>
        <p className="text-sm text-gray-500 italic">Your recent filter combinations will appear here.</p>
      </div>
    </div>
  );
} 