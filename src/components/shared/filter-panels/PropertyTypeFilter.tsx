'use client';

import React, { useState } from 'react';
import { FilterPanelProps } from '../FilterSidebar';
import { Check } from 'lucide-react';

const propertyTypes = [
  'Apartment / Flat',
  'House / Villa',
  'Studio',
  'Townhouse',
  'Condo / Condominium',
  'Duplex',
  'Penthouse',
  'Loft',
  'Bungalow',
  'Cottage',
  'Commercial Space',
  'Land / Plot',
  'Other'
];

export default function PropertyTypeFilter({ 
  filterKey, 
  value = '', 
  onChange 
}: FilterPanelProps) {
  const [selectedType, setSelectedType] = useState<string>(value as string || '');
  
  const handleSubmit = () => {
    if (selectedType) {
      onChange(selectedType);
    }
  };

  return (
    <div className="space-y-3">
      <select
        className="w-full border rounded px-2 py-1"
        value={selectedType}
        onChange={e => setSelectedType(e.target.value)}
      >
        <option value="">All Types</option>
        {propertyTypes.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
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