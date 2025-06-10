'use client';

import React, { useState } from 'react';
import { FilterPanelProps } from '../FilterSidebar';

interface PriceValue {
  min?: number;
  max?: number;
}

export default function PriceFilter({ 
  filterKey, 
  value = { min: undefined, max: undefined }, 
  onChange 
}: FilterPanelProps) {
  const [localValue, setLocalValue] = useState<PriceValue>(value as PriceValue);
  
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? parseInt(e.target.value) : undefined;
    setLocalValue(prev => ({ ...prev, min: val }));
  };
  
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? parseInt(e.target.value) : undefined;
    setLocalValue(prev => ({ ...prev, max: val }));
  };
  
  const handleSubmit = () => {
    // Only apply if at least one value is provided
    if (localValue.min !== undefined || localValue.max !== undefined) {
      onChange(localValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="min-price" className="block text-sm font-medium text-gray-700 mb-1">
            Min Price
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              id="min-price"
              type="number"
              min="0"
              value={localValue.min === undefined ? '' : localValue.min}
              onChange={handleMinChange}
              placeholder="Min"
              className="w-full pl-6 pr-3 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="max-price" className="block text-sm font-medium text-gray-700 mb-1">
            Max Price
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              id="max-price"
              type="number"
              min="0"
              value={localValue.max === undefined ? '' : localValue.max}
              onChange={handleMaxChange}
              placeholder="Max"
              className="w-full pl-6 pr-3 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 pt-1">
        {[500, 1000, 2000, 5000].map(amount => (
          <button
            key={amount}
            type="button"
            onClick={() => setLocalValue(prev => ({ ...prev, max: amount }))}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            ${amount}
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