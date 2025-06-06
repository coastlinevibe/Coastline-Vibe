'use client';

import React from 'react';
import { BarChart2, Calendar, Megaphone, HelpCircle, MessageSquare, LayoutGrid } from 'lucide-react';

export type FeedContentType = 'all' | 'poll' | 'event' | 'announce' | 'ask' | 'general';

interface FeedFiltersProps {
  activeFilter: FeedContentType;
  onFilterChange: (filter: FeedContentType) => void;
  counts?: {
    [key in FeedContentType]?: number;
  };
}

const FeedFilters: React.FC<FeedFiltersProps> = ({ 
  activeFilter, 
  onFilterChange,
  counts = {}
}) => {
  const filters: Array<{
    id: FeedContentType;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'all',
      label: 'All',
      icon: <LayoutGrid size={20} />
    },
    {
      id: 'poll',
      label: 'Polls',
      icon: <BarChart2 size={20} />
    },
    {
      id: 'event',
      label: 'Events',
      icon: <Calendar size={20} />
    },
    {
      id: 'announce',
      label: 'Announcements',
      icon: <Megaphone size={20} />
    },
    {
      id: 'ask',
      label: 'Questions',
      icon: <HelpCircle size={20} />
    },
    {
      id: 'general',
      label: 'Posts',
      icon: <MessageSquare size={20} />
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
              className={`flex flex-col items-center justify-center px-4 py-2 border-b-2 whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
              title={filter.label}
            >
              <div className="relative">
                {filter.icon}
                {count !== undefined && count > 0 && (
                  <span className={`absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center rounded-full text-xs ${
                    activeFilter === filter.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FeedFilters; 