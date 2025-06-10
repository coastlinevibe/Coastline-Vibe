'use client';

import React, { useState } from 'react';
import { FilterPanelProps } from '../FilterSidebar';
import { Check } from 'lucide-react';

const conditions = [
  'All',
  'New',
  'Like New',
  'Good',
  'Used'
];

export default function ConditionFilter({ 
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
        {conditions.map(condition => (
          <div key={condition} className="flex items-center">
            <button
              type="button"
              onClick={() => setSelected(condition)}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md ${
                selected === condition 
                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' 
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span>{condition}</span>
              {selected === condition && (
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