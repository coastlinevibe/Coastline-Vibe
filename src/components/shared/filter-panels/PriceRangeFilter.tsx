'use client';

import React, { useState, useEffect } from 'react';
import { FilterPanelProps } from '../FilterSidebar';

type PriceRange = {
  min: number;
  max: number;
};

type PriceTier = '1' | '2' | '3' | '4';

interface PriceFilterValue {
  range?: PriceRange;
  tier?: PriceTier;
}

export default function PriceRangeFilter({ 
  filterKey, 
  value = {}, 
  onChange 
}: FilterPanelProps) {
  const defaultRange = { min: 0, max: 1000 };
  const initialValue = value as PriceFilterValue;
  
  const [priceRange, setPriceRange] = useState<PriceRange>(
    initialValue.range || defaultRange
  );
  const [selectedTier, setSelectedTier] = useState<PriceTier | null>(
    initialValue.tier || null
  );
  const [filterMode, setFilterMode] = useState<'range' | 'tier'>(
    initialValue.tier ? 'tier' : 'range'
  );

  // Handle price range change
  const handleRangeChange = (type: 'min' | 'max', value: number) => {
    setPriceRange(prev => {
      if (type === 'min') {
        return { ...prev, min: Math.min(value, prev.max) };
      } else {
        return { ...prev, max: Math.max(value, prev.min) };
      }
    });
  };

  // Handle tier selection
  const handleTierSelect = (tier: PriceTier) => {
    setSelectedTier(selectedTier === tier ? null : tier);
  };

  // Apply filters
  const handleSubmit = () => {
    if (filterMode === 'range') {
      onChange({ range: priceRange });
    } else {
      onChange({ tier: selectedTier });
    }
  };

  // Price tier options
  const priceTiers = [
    { value: '1', label: '$', description: 'Budget' },
    { value: '2', label: '$$', description: 'Moderate' },
    { value: '3', label: '$$$', description: 'Expensive' },
    { value: '4', label: '$$$$', description: 'Premium' },
  ];

  return (
    <div className="space-y-4">
      {/* Toggle between price range and price tier */}
      <div className="flex rounded-md shadow-sm">
        <button
          type="button"
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-md ${
            filterMode === 'range' 
              ? 'bg-primaryTeal text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilterMode('range')}
        >
          Price Range
        </button>
        <button
          type="button"
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-md ${
            filterMode === 'tier' 
              ? 'bg-primaryTeal text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilterMode('tier')}
        >
          Price Tier
        </button>
      </div>

      {/* Price Range Controls */}
      {filterMode === 'range' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-1">Min Price</label>
              <input
                type="number"
                min={0}
                max={priceRange.max}
                value={priceRange.min}
                onChange={(e) => handleRangeChange('min', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="text-gray-400">to</div>
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-1">Max Price</label>
              <input
                type="number"
                min={priceRange.min}
                value={priceRange.max}
                onChange={(e) => handleRangeChange('max', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          
          <div className="px-1">
            <input
              type="range"
              min={0}
              max={1000}
              value={priceRange.min}
              onChange={(e) => handleRangeChange('min', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primaryTeal"
            />
            <input
              type="range"
              min={0}
              max={1000}
              value={priceRange.max}
              onChange={(e) => handleRangeChange('max', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primaryTeal -mt-2"
            />
          </div>
        </div>
      )}

      {/* Price Tier Controls */}
      {filterMode === 'tier' && (
        <div className="grid grid-cols-4 gap-2">
          {priceTiers.map((tier) => (
            <button
              key={tier.value}
              type="button"
              onClick={() => handleTierSelect(tier.value as PriceTier)}
              className={`flex flex-col items-center justify-center p-2 rounded-md ${
                selectedTier === tier.value
                  ? 'bg-primaryTeal/10 border border-primaryTeal text-primaryTeal'
                  : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg font-semibold">{tier.label}</span>
              <span className="text-xs">{tier.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Apply Button */}
      <div className="pt-2 flex items-center justify-between space-x-2">
        <button
          type="button"
          onClick={() => {
            setPriceRange(defaultRange);
            setSelectedTier(null);
            onChange({});
          }}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-primaryTeal text-white text-sm font-medium rounded-md hover:bg-seafoam transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
} 