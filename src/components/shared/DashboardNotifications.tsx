'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Bell, ChevronDown, ChevronUp } from 'lucide-react';
import NotificationItem from './NotificationItem';

interface DashboardNotificationsProps {
  maxItems?: number;
  initiallyExpanded?: boolean;
}

const DashboardNotifications: React.FC<DashboardNotificationsProps> = ({ 
  maxItems = 5,
  initiallyExpanded = false
}) => {
  const { notifications, loading, markAsRead } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  const displayedNotifications = isExpanded 
    ? notifications 
    : notifications.slice(0, maxItems);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Bell className="h-5 w-5 mr-2 text-teal-600" />
          My Notifications
        </h2>
        <button 
          onClick={toggleExpand} 
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={isExpanded ? "Show less" : "Show more"}
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-teal-500 border-t-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <>
            {displayedNotifications.map(notification => (
              <div key={notification.id} className={notification.is_read ? '' : 'bg-blue-50'}>
                <NotificationItem 
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              </div>
            ))}
            
            {!isExpanded && notifications.length > maxItems && (
              <div className="p-3 text-center border-t border-gray-100">
                <button 
                  onClick={toggleExpand}
                  className="text-sm text-teal-600 hover:text-teal-800 font-medium"
                >
                  Show {notifications.length - maxItems} more notifications
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardNotifications; 