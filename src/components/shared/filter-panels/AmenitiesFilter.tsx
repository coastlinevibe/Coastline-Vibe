'use client';

import React, { useState } from 'react';
import { FilterPanelProps } from '../FilterSidebar';

const amenityOptions = [
  { id: 'furnished', label: 'Furnished' },
  { id: 'parking', label: 'Parking' },
  { id: 'petFriendly', label: 'Pet Friendly' },
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'pool', label: 'Pool' },
  { id: 'gym', label: 'Gym' }
];

export default function AmenitiesFilter({ 
  filterKey, 
  value = [], 
  onChange 
}: FilterPanelProps) {
  const [selected, setSelected] = useState<string[]>(value as string[] || []);
  
  const toggleAmenity = (id: string) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };
  
  const handleSubmit = () => {
    onChange(selected);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {amenityOptions.map(option => (
          <div key={option.id} className="flex items-center">
            <input
              id={`amenity-${option.id}`}
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={() => toggleAmenity(option.id)}
              className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
            />
            <label 
              htmlFor={`amenity-${option.id}`}
              className="ml-2 block text-sm text-gray-700"
            >
              {option.label}
            </label>
          </div>
        ))}
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