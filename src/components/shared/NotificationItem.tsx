'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, User, Heart, MessageSquare, Calendar, Megaphone, HelpCircle, BarChart2, Smile, Award, CheckCircle, AlertCircle, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Notification } from '@/context/NotificationContext';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'business_verification':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'review':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'inquiry':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'featured_business':
        return <Award className="h-5 w-5 text-purple-500" />;
      case 'analytics_alert':
        return <BarChart2 className="h-5 w-5 text-teal-500" />;
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

  // Get notification link based on type and target
  const getNotificationLink = () => {
    const { type, target_entity_type, target_entity_id, community_id } = notification;
    
    if (!target_entity_id) return '#';
    
    if (target_entity_type === 'businesses') {
      if (community_id) {
        return `/community/${community_id}/business/${target_entity_id}`;
      }
      return `/business/${target_entity_id}`;
    }
    
    if (target_entity_type === 'posts') {
      if (community_id) {
        return `/community/${community_id}/feed?postId=${target_entity_id}`;
      }
      return `/feed?postId=${target_entity_id}`;
    }
    
    return '#';
  };

  // Format notification content based on type
  const getFormattedContent = () => {
    if (notification.content_snippet) {
      return notification.content_snippet;
    }

    if (notification.type === 'rsvp' && notification.actor_profile) {
      return (
        <span>
          <span className="font-semibold">{notification.actor_profile.username}</span> RSVP'd to your event
        </span>
      );
    }
    
    if (notification.type === 'comment' && notification.actor_profile) {
      return (
        <span>
          <span className="font-semibold">{notification.actor_profile.username}</span> commented on your post
        </span>
      );
    }
    
    if (notification.type === 'post_like' && notification.actor_profile) {
      return (
        <span>
          <span className="font-semibold">{notification.actor_profile.username}</span> liked your post
        </span>
      );
    }

    return 'New notification';
  };

  return (
    <Link 
      href={getNotificationLink()}
      onClick={() => onClick(notification)}
      className="block p-3 rounded-md hover:bg-gray-50 transition-colors"
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
              {getFormattedContent()}
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
  );
};

export default NotificationItem; 