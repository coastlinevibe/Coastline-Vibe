'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Notification } from '@/context/NotificationContext';
import NotificationItem from './NotificationItem';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  autoCloseDelay?: number; // in milliseconds
}

const NotificationToast: React.FC<NotificationToastProps> = ({ 
  notification, 
  onClose,
  autoCloseDelay = 5000 // default to 5 seconds
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    // Start progress bar countdown
    const startTime = Date.now();
    const endTime = startTime + autoCloseDelay;
    
    const progressInterval = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;
      const newProgress = Math.max(0, (remaining / autoCloseDelay) * 100);
      
      setProgress(newProgress);
      
      if (remaining <= 0) {
        clearInterval(progressInterval);
        setIsVisible(false);
        setTimeout(() => onClose(), 300); // Allow time for exit animation
      }
    }, 50); // Update every 50ms for smooth progress bar
    
    return () => clearInterval(progressInterval);
  }, [autoCloseDelay, onClose]);
  
  // Handle manual close
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); // Allow time for exit animation
  };
  
  // Handle notification click
  const handleNotificationClick = () => {
    onClose();
  };
  
  return (
    <div 
      className={`
        fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg overflow-hidden
        transform transition-all duration-300 ease-in-out z-50
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="relative">
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
          aria-label="Close notification"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
        
        {/* Notification content */}
        <div className="p-1">
          <NotificationItem 
            notification={notification} 
            onClick={handleNotificationClick}
          />
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-teal-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationToast; 