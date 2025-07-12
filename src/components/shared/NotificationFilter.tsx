'use client';

import React from 'react';
import { Bell, CheckCircle, Star, MessageSquare, Award, BarChart2 } from 'lucide-react';

type NotificationType = 'all' | 'business_verification' | 'review' | 'inquiry' | 'featured_business' | 'analytics_alert';

interface NotificationFilterProps {
  activeFilter: NotificationType;
  onFilterChange: (filter: NotificationType) => void;
  counts: {
    all: number;
    business_verification?: number;
    review?: number;
    inquiry?: number;
    featured_business?: number;
    analytics_alert?: number;
  };
}

const NotificationFilter: React.FC<NotificationFilterProps> = ({ 
  activeFilter, 
  onFilterChange,
  counts
}) => {
  const filters: Array<{
    id: NotificationType;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'all', label: 'All', icon: <Bell className="h-4 w-4" /> },
    { id: 'business_verification', label: 'Verification', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'review', label: 'Reviews', icon: <Star className="h-4 w-4" /> },
    { id: 'inquiry', label: 'Inquiries', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'featured_business', label: 'Featured', icon: <Award className="h-4 w-4" /> },
    { id: 'analytics_alert', label: 'Analytics', icon: <BarChart2 className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
            ${activeFilter === filter.id 
              ? 'bg-teal-100 text-teal-800 font-medium' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {filter.icon}
          <span>{filter.label}</span>
          {counts[filter.id] !== undefined && counts[filter.id]! > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-white rounded-full text-xs font-medium">
              {counts[filter.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default NotificationFilter; 