'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Clock, Flame, ThumbsUp, MessageSquare, MapPin, Map } from 'lucide-react';

export type SortOption = 'newest' | 'trending' | 'most_liked' | 'most_commented' | 'nearest' | 'neighborhood';

interface SortDropdownProps {
  onSortChange: (sortOption: SortOption) => void;
  currentSort: SortOption;
  hasLocationData?: boolean;
}

const SortDropdown: React.FC<SortDropdownProps> = ({ onSortChange, currentSort, hasLocationData = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions: Array<{
    id: SortOption;
    label: string;
    icon: React.ReactNode;
    disabled?: boolean;
    tooltip?: string;
  }> = [
    {
      id: 'newest',
      label: 'Newest',
      icon: <Clock size={16} />
    },
    {
      id: 'trending',
      label: 'Trending',
      icon: <Flame size={16} />
    },
    {
      id: 'most_liked',
      label: 'Most Liked',
      icon: <ThumbsUp size={16} />
    },
    {
      id: 'most_commented',
      label: 'Most Commented',
      icon: <MessageSquare size={16} />
    },
    {
      id: 'nearest',
      label: 'Nearest',
      icon: <MapPin size={16} />,
      disabled: !hasLocationData,
      tooltip: !hasLocationData ? 'Enable location to use this feature' : undefined
    },
    {
      id: 'neighborhood',
      label: 'My Neighborhoods',
      icon: <Map size={16} />,
      disabled: !hasLocationData,
      tooltip: !hasLocationData ? 'Enable location to use this feature' : undefined
    }
  ];

  const currentSortOption = sortOptions.find(option => option.id === currentSort) || sortOptions[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option: SortOption) => {
    if (sortOptions.find(o => o.id === option)?.disabled) {
      return;
    }
    onSortChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <span className="mr-2">{currentSortOption.icon}</span>
          <span>{currentSortOption.label}</span>
        </div>
        <ChevronDown size={16} className={`ml-2 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-full bg-white rounded-md shadow-lg">
          <div className="py-1">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                className={`flex items-center w-full px-4 py-2 text-sm text-left ${
                  option.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100'
                } ${
                  currentSort === option.id ? 'bg-gray-50 text-blue-600' : 'text-gray-700'
                }`}
                onClick={() => handleSelect(option.id)}
                title={option.tooltip}
                disabled={option.disabled}
              >
                <span className="mr-2">{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown; 