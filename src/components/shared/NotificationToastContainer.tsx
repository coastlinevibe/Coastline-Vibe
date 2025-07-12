'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import NotificationToast from './NotificationToast';
import { Notification } from '@/context/NotificationContext';

const NotificationToastContainer: React.FC = () => {
  const { notifications } = useNotifications();
  const [toasts, setToasts] = useState<Notification[]>([]);
  
  // Listen for new notifications and add them to toasts
  useEffect(() => {
    if (notifications.length > 0) {
      // Get the most recent notification
      const latestNotification = notifications[0];
      
      // Check if this notification is already in our toasts
      const isAlreadyShown = toasts.some(toast => toast.id === latestNotification.id);
      
      // If it's a new notification, add it to toasts
      if (!isAlreadyShown && !latestNotification.is_read) {
        setToasts(prev => [latestNotification, ...prev]);
      }
    }
  }, [notifications, toasts]);
  
  // Limit the number of visible toasts to 3
  const visibleToasts = toasts.slice(0, 3);
  
  // Remove a toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50 pointer-events-none">
      <div className="flex flex-col-reverse gap-4">
        {visibleToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <NotificationToast 
              notification={toast} 
              onClose={() => removeToast(toast.id)} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationToastContainer; 