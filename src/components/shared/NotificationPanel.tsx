'use client';

import React from 'react';
import { useNotifications, Notification } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, X, User, Heart, MessageSquare, Calendar, Megaphone, HelpCircle, BarChart2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post_like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'mention':
        return <User className="h-5 w-5 text-purple-500" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'announcement':
        return <Megaphone className="h-5 w-5 text-yellow-500" />;
      case 'question':
        return <HelpCircle className="h-5 w-5 text-orange-500" />;
      case 'poll':
        return <BarChart2 className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    const { type, target_entity_type, target_entity_id, community_id } = notification;
    
    if (!target_entity_id) return '#';
    
    if (target_entity_type === 'posts') {
      if (community_id) {
        return `/community/${community_id}/feed?postId=${target_entity_id}`;
      }
      return `/feed?postId=${target_entity_id}`;
    }
    
    return '#';
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-medium">Notifications</h3>
        <div className="flex space-x-2">
          <button
            onClick={markAllAsRead}
            className="p-1 hover:bg-gray-100 rounded-full"
            title="Mark all as read"
          >
            <Check className="h-5 w-5 text-gray-500" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li 
                key={notification.id}
                className={`hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}
              >
                <Link 
                  href={getNotificationLink(notification)}
                  onClick={() => handleNotificationClick(notification)}
                  className="block p-4"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {notification.actor_profile?.avatar_url ? (
                        <div className="relative h-10 w-10 rounded-full overflow-hidden">
                          <Image 
                            src={notification.actor_profile.avatar_url}
                            alt={notification.actor_profile.username || 'User'}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.content_snippet}
                        </p>
                        <div className="flex-shrink-0 ml-2">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel; 