'use client';

import React, { useState } from 'react';
import { FilterPanelProps } from '../FilterSidebar';
import { Check } from 'lucide-react';

const bedroomOptions = [
  { value: 'Any', label: 'Any' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5+', label: '5+' }
];

export default function BedroomsFilter({ 
  filterKey, 
  value = 'Any', 
  onChange 
}: FilterPanelProps) {
  const [selected, setSelected] = useState<string>(value as string || 'Any');
  
  const handleSubmit = () => {
    onChange(selected);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {bedroomOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSelected(option.value)}
            className={`flex items-center justify-center p-2 text-sm rounded-md ${
              selected === option.value 
                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' 
                : 'bg-white hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span>{option.label}</span>
            {selected === option.value && (
              <Check size={14} className="ml-1 text-cyan-600" />
            )}
          </button>
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