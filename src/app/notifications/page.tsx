'use client';

import React from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, User, Heart, MessageSquare, Calendar, Megaphone, HelpCircle, BarChart2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function NotificationsPage() {
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

  const getNotificationLink = (notification: any) => {
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

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center"
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all as read
            </button>
          )}
        </div>
        
        <div>
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-600">No notifications yet</h2>
              <p className="text-gray-500 mt-2">
                When you get notifications, they'll show up here.
              </p>
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
                      <div className="flex-shrink-0 mr-4">
                        {notification.actor_profile?.avatar_url ? (
                          <div className="relative h-12 w-12 rounded-full overflow-hidden">
                            <Image 
                              src={notification.actor_profile.avatar_url}
                              alt={notification.actor_profile.username || 'User'}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
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
    </div>
  );
} 