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

  const filteredNotifications = notifications.filter(notification => notification.type !== 'mention');

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
                  className={`py-4 ${!notification.is_read ? 'bg-blue-50 rounded-md px-3' : ''}`}
                >
                  <Link 
                    href={getNotificationLink(notification)}
                    onClick={() => handleNotificationClick(notification)}
                    className="block"
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