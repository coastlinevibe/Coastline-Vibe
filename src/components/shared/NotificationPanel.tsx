'use client';

import React, { useState, useMemo } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Bell, Check, X } from 'lucide-react';
import NotificationItem from './NotificationItem';
import NotificationFilter from './NotificationFilter';

type NotificationType = 'all' | 'business_verification' | 'review' | 'inquiry' | 'featured_business' | 'analytics_alert';

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<NotificationType>('all');
  
  // Filter notifications based on selected type
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') {
      return notifications;
    }
    return notifications.filter(notif => notif.type === activeFilter);
  }, [notifications, activeFilter]);
  
  // Calculate counts for each notification type
  const notificationCounts = useMemo(() => {
    const counts = {
      all: notifications.length,
      business_verification: 0,
      review: 0,
      inquiry: 0,
      featured_business: 0,
      analytics_alert: 0
    };
    
    notifications.forEach(notification => {
      const type = notification.type as NotificationType;
      if (counts[type] !== undefined) {
        counts[type] += 1;
      }
    });
    
    return counts;
  }, [notifications]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-md">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm text-teal-600 hover:text-teal-800 flex items-center"
          >
            <Check className="h-4 w-4 mr-1" />
            Mark all as read
          </button>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Notification filters */}
      <NotificationFilter 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={notificationCounts}
      />
      
      <div className="max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-gray-500">No notifications</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredNotifications.map(notification => (
              <li 
                key={notification.id}
                className={`hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}
              >
                <NotificationItem 
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel; 