'use client';

import React from 'react';
import { Globe, Lock, Eye, Users, CircleUser } from 'lucide-react';

export type VibeGroupVisibilityFilter = 'all' | 'public' | 'private' | 'secret';

interface VibeGroupFiltersProps {
  activeFilter: VibeGroupVisibilityFilter;
  onFilterChange: (filter: VibeGroupVisibilityFilter) => void;
  counts?: {
    [key in VibeGroupVisibilityFilter]?: number;
  };
}

const VibeGroupFilters: React.FC<VibeGroupFiltersProps> = ({ 
  activeFilter, 
  onFilterChange,
  counts = {}
}) => {
  const filters: Array<{
    id: VibeGroupVisibilityFilter;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'all',
      label: 'All Groups',
      icon: <Users size={20} />
    },
    {
      id: 'public',
      label: 'Public',
      icon: <Globe size={20} />
    },
    {
      id: 'private',
      label: 'Private',
      icon: <Lock size={20} />
    },
    {
      id: 'secret',
      label: 'Secret',
      icon: <Eye size={20} />
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow mb-4 overflow-x-auto">
      <div className="flex min-w-max">
        {filters.map((filter) => {
          const count = counts[filter.id];
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`flex items-center px-4 py-2 border-b-2 whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
              title={filter.label}
            >
              <div className="relative mr-2">
                {filter.icon}
                {count !== undefined && count > 0 && (
                  <span className={`absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center rounded-full text-xs ${
                    activeFilter === filter.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {count}
                  </span>
                )}
              </div>
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VibeGroupFilters; 