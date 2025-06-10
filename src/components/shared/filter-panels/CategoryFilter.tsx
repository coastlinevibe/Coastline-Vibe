'use client';

import React, { useState } from 'react';
import { FilterPanelProps } from '../FilterSidebar';
import { Check } from 'lucide-react';

const categories = [
  'All',
  'Electronics',
  'Sports',
  'Furniture',
  'Fashion',
  'Books',
  'Automotive',
  'Other'
];

export default function CategoryFilter({ 
  filterKey, 
  value = 'All', 
  onChange 
}: FilterPanelProps) {
  const [selected, setSelected] = useState<string>(value as string || 'All');
  
  const handleSubmit = () => {
    onChange(selected);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {categories.map(category => (
          <div key={category} className="flex items-center">
            <button
              type="button"
              onClick={() => setSelected(category)}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md ${
                selected === category 
                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' 
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span>{category}</span>
              {selected === category && (
                <Check size={16} className="text-cyan-600" />
              )}
            </button>
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