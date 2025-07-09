'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, X, User, Heart, MessageSquare, Calendar, Megaphone, HelpCircle, BarChart2, Smile } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Add reaction type to the existing notification types
type ExtendedNotificationType = 'post_like' | 'comment' | 'event' | 'announcement' | 'question' | 'poll' | 'reaction' | 'rsvp';

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notif => !notif.is_read);
  
  const getNotificationIcon = (type: ExtendedNotificationType) => {
    switch (type) {
      case 'post_like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'announcement':
        return <Megaphone className="h-5 w-5 text-yellow-500" />;
      case 'question':
        return <HelpCircle className="h-5 w-5 text-orange-500" />;
      case 'poll':
        return <BarChart2 className="h-5 w-5 text-indigo-500" />;
      case 'reaction':
        return <Smile className="h-5 w-5 text-teal-500" />;
      case 'rsvp':
        return <Calendar className="h-5 w-5 text-cyan-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

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
      
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-gray-500">No new notifications</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredNotifications.map(notification => (
              <li 
                key={notification.id}
                className={`hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}
              >
                <Link 
                  href={notification.link || '#'}
                  onClick={() => handleNotificationClick(notification)}
                  className="block p-3 rounded-md"
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
                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-teal-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.type === 'rsvp' && notification.actor_profile ? (
                            <span>
                              <span className="font-semibold">{notification.actor_profile.username}</span> RSVP'd {notification.content_snippet?.match(/"(yes|no|maybe)"/)?.[0] || ''} to your event
                            </span>
                          ) : notification.type === 'comment' && notification.actor_profile ? (
                            <span>
                              <span className="font-semibold">{notification.actor_profile.username}</span> commented on your post
                            </span>
                          ) : notification.type === 'post_like' && notification.actor_profile ? (
                            <span>
                              <span className="font-semibold">{notification.actor_profile.username}</span> liked your post
                            </span>
                          ) : notification.type === 'poll' && notification.actor_profile ? (
                            <span>
                              <span className="font-semibold">{notification.actor_profile.username}</span> voted on your poll
                            </span>
                          ) : notification.type === 'reaction' && notification.actor_profile ? (
                            <span>
                              <span className="font-semibold">{notification.actor_profile.username}</span> reacted to your {notification.target_entity_type === 'posts' ? 'post' : notification.target_entity_type === 'comments' ? 'comment' : 'reply'}
                            </span>
                          ) : (
                            notification.content_snippet
                          )}
                        </p>
                        <div className="flex-shrink-0 ml-2">
                          {getNotificationIcon(notification.type as ExtendedNotificationType)}
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