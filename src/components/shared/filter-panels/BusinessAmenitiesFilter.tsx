'use client';

import React, { useState } from 'react';
import { FilterPanelProps } from '../FilterSidebar';

const amenityOptions = [
  { id: 'wifi', label: 'Free WiFi', icon: '📶' },
  { id: 'parking', label: 'Parking Available', icon: '🅿️' },
  { id: 'accessibility', label: 'Wheelchair Accessible', icon: '♿' },
  { id: 'delivery', label: 'Delivery Service', icon: '🚚' },
  { id: 'takeout', label: 'Takeout Available', icon: '📦' },
  { id: 'outdoor_seating', label: 'Outdoor Seating', icon: '🪑' },
  { id: 'reservations', label: 'Accepts Reservations', icon: '📅' },
  { id: 'credit_cards', label: 'Accepts Credit Cards', icon: '💳' },
  { id: 'family_friendly', label: 'Family Friendly', icon: '👨‍👩‍👧‍👦' },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: '🐾' }
];

export default function BusinessAmenitiesFilter({ 
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
      <div className="grid grid-cols-2 gap-2">
        {amenityOptions.map(option => (
          <div key={option.id} className="flex items-center">
            <input
              id={`amenity-${option.id}`}
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={() => toggleAmenity(option.id)}
              className="h-4 w-4 text-primaryTeal focus:ring-seafoam border-gray-300 rounded"
            />
            <label 
              htmlFor={`amenity-${option.id}`}
              className="ml-2 flex items-center text-sm text-gray-700"
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
            </label>
          </div>
        ))}
      </div>
      
      <div className="pt-2 flex items-center justify-between space-x-2">
        <button
          type="button"
          onClick={() => {
            setSelected([]);
            onChange([]);
          }}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
          disabled={selected.length === 0}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-primaryTeal text-white text-sm font-medium rounded-md hover:bg-seafoam transition-colors"
        >
          Apply ({selected.length})
        </button>
      </div>
    </div>
  );
} 