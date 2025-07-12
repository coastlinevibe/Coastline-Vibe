'use client';

import React, { useState, useMemo } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Bell, Check } from 'lucide-react';
import NotificationItem from '@/components/shared/NotificationItem';
import NotificationFilter from '@/components/shared/NotificationFilter';

type NotificationType = 'all' | 'business_verification' | 'review' | 'inquiry' | 'featured_business' | 'analytics_alert';

export default function NotificationsPage() {
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

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-xl font-semibold">Notifications</h1>
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            title="Mark all as read"
          >
            <Check className="h-4 w-4" />
            <span>Mark all as read</span>
          </button>
        </div>
        
        {/* Notification filters */}
        <NotificationFilter 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={notificationCounts}
        />
        
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              You have no notifications
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <li 
                  key={notification.id}
                  className={`py-2 ${!notification.is_read ? 'bg-blue-50 rounded-md' : ''}`}
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
    </div>
  );
} 