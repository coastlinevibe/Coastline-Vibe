'use client';

import React from 'react';
import { Bell, MessageSquare, CheckCircle, BarChart2, Star } from 'lucide-react';
import { useNotifications, Notification } from '@/context/NotificationContext';
import NotificationItem from './NotificationItem';

interface BusinessNotificationCategoryProps {
  title: string;
  icon: React.ReactNode;
  type: string;
  emptyMessage: string;
}

const BusinessNotificationCategory: React.FC<BusinessNotificationCategoryProps> = ({
  title,
  icon,
  type,
  emptyMessage
}) => {
  const { notifications, loading, markAsRead } = useNotifications();
  
  // Filter notifications by type
  const filteredNotifications = notifications.filter(
    notification => notification.type === type
  );

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {filteredNotifications.length > 0 && (
          <span className="ml-2 bg-blue-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
            {filteredNotifications.length}
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onClick={handleNotificationClick}
            />
          ))
        ) : (
          <div className="text-gray-500 text-sm py-3">{emptyMessage}</div>
        )}
      </div>
    </div>
  );
};

export default BusinessNotificationCategory; 