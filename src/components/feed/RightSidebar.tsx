'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Bell, ChevronRight, ChevronLeft, 
  Users, Calendar, Activity, MapPin,
  Clock, ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import { 
  RightSidebarProps, 
  Notification, 
  SuggestedUser, 
  SuggestedGroup, 
  CommunityStats, 
  Event,
  SponsoredContent 
} from '@/types/sidebar';

export default function RightSidebar({ communityId }: RightSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [sponsoredContent, setSponsoredContent] = useState<SponsoredContent[]>([]);
  const [communityUuid, setCommunityUuid] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  
  // Initialize collapsed state based on screen width
  useEffect(() => {
    setCollapsed(window.innerWidth < 1024);
    
    const handleResize = () => {
      setCollapsed(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Get community UUID from slug if needed
  useEffect(() => {
    const resolveCommunity = async () => {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidPattern.test(communityId);
      
      if (isUuid) {
        setCommunityUuid(communityId);
      } else {
        const { data } = await supabase
          .from('communities')
          .select('id')
          .eq('slug', communityId)
          .single();
          
        if (data) {
          setCommunityUuid(data.id);
        }
      }
    };
    
    resolveCommunity();
  }, [communityId, supabase]);
  
  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Get profile ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
          
        if (profile) {
          setCurrentUserId(profile.id);
        }
      }
    };
    
    getCurrentUser();
  }, [supabase]);
  
  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUserId || !communityUuid) return;
      
      const { data } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (
            username,
            avatar_url
          ),
          target_post:target_entity_id (
            title,
            content
          )
        `)
        .eq('recipient_id', currentUserId)
        .eq('community_id', communityUuid)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (data) {
        setNotifications(data);
      }
    };
    
    if (currentUserId && communityUuid) {
      fetchNotifications();
    }
  }, [currentUserId, communityUuid, supabase]);
  
  // Fetch suggested users and groups
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentUserId || !communityUuid) return;
      
      // Get users in the same community
      const { data: users } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .eq('community_id', communityUuid)
        .neq('id', currentUserId)
        .limit(3);
        
      if (users) {
        setSuggestedUsers(users);
      }
      
      // Get popular groups the user hasn't joined
      const { data: userGroups } = await supabase
        .from('vibe_groups_members')
        .select('group_id')
        .eq('user_id', currentUserId)
        .eq('status', 'active');
        
      const userGroupIds = userGroups?.map(g => g.group_id) || [];
      
      const { data: groups } = await supabase
        .from('vibe_groups')
        .select(`
          id, 
          name, 
          description,
          icon_url,
          visibility,
          member_count:vibe_groups_members(count)
        `)
        .eq('community_id', communityUuid)
        .eq('is_active', true)
        .not('id', 'in', `(${userGroupIds.join(',')})`)
        .eq('visibility', 'public')
        .order('member_count', { ascending: false })
        .limit(2);
        
      if (groups) {
        setSuggestedGroups(groups);
      }
    };
    
    if (currentUserId && communityUuid) {
      fetchSuggestions();
    }
  }, [currentUserId, communityUuid, supabase]);
  
  // Fetch community stats
  useEffect(() => {
    const fetchCommunityStats = async () => {
      if (!communityUuid) return;
      
      // Get posts this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { count: postCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('community_id', communityUuid)
        .gt('created_at', oneWeekAgo.toISOString());
        
      // Get active groups
      const { count: groupCount } = await supabase
        .from('vibe_groups')
        .select('id', { count: 'exact' })
        .eq('community_id', communityUuid)
        .eq('is_active', true);
        
      // Get new members today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: newMembersCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('community_id', communityUuid)
        .gt('created_at', today.toISOString());
        
      setCommunityStats({
        postsThisWeek: postCount || 0,
        activeGroups: groupCount || 0,
        newMembersToday: newMembersCount || 0
      });
    };
    
    if (communityUuid) {
      fetchCommunityStats();
    }
  }, [communityUuid, supabase]);
  
  // Fetch next event
  useEffect(() => {
    const fetchNextEvent = async () => {
      if (!communityUuid || !currentUserId) return;
      
      const now = new Date().toISOString();
      
      // Get events user is invited to
      const { data } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          type,
          event_start_time,
          event_end_time,
          location,
          event_rsvp_users
        `)
        .eq('community_id', communityUuid)
        .eq('type', 'event')
        .gt('event_start_time', now)
        .order('event_start_time', { ascending: true })
        .limit(1);
        
      if (data && data.length > 0) {
        setNextEvent(data[0]);
      }
    };
    
    if (communityUuid && currentUserId) {
      fetchNextEvent();
    }
  }, [communityUuid, currentUserId, supabase]);
  
  // Calculate time remaining to event
  const getTimeRemaining = (startTime: string) => {
    const now = new Date();
    const eventTime = new Date(startTime);
    const diff = eventTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Starting now';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  
  // Fetch sponsored content
  useEffect(() => {
    const fetchSponsored = async () => {
      if (!communityUuid) return;
      
      // In a real app, this would fetch from a sponsored_content table
      // For now, just show some sample directory listings
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .eq('community_id', communityUuid)
        .eq('role', 'business')
        .eq('approval_status', 'approved')
        .limit(2);
        
      if (data) {
        setSponsoredContent(data.map(business => ({
          id: business.id,
          title: business.username,
          image: business.avatar_url,
          description: business.bio?.substring(0, 60) + '...' || 'Local business',
          type: 'business'
        })));
      }
    };
    
    if (communityUuid) {
      fetchSponsored();
    }
  }, [communityUuid, supabase]);
  
  return (
    <aside 
      className={`bg-white h-full rounded-lg shadow-md transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Header with collapse toggle */}
      <div className="p-3 border-b flex items-center justify-between">
        {!collapsed && (
          <h2 className="font-bold text-cyan-900">Updates</h2>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 bg-cyan-50 rounded-full text-cyan-600 hover:bg-cyan-100 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      
      {/* Sidebar content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* Notifications */}
          <div className="mb-6">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-2 py-1'} mb-3`}>
              <Bell className="text-cyan-600" size={collapsed ? 22 : 18} />
              {!collapsed && <span className="ml-2 font-medium">Notifications</span>}
            </div>
            
            {!collapsed && (
              <div className="space-y-3 px-2">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <Link
                      key={notification.id}
                      href={`/community/${communityId}/feed?postId=${notification.target_entity_id}`}
                      className="flex p-2 hover:bg-cyan-50 rounded-md transition-colors"
                    >
                      <div className="flex-shrink-0 mr-2">
                        <Image 
                          src={notification.actor.avatar_url || '/default-avatar.png'} 
                          alt={notification.actor.username}
                          width={36}
                          height={36}
                          className="rounded-full"
                        />
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{notification.actor.username}</span>
                          {' '}
                          {notification.type === 'like' && 'liked your post'}
                          {notification.type === 'comment' && 'commented on your post'}
                          {notification.type === 'mention' && 'mentioned you'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No new notifications
                  </div>
                )}
              </div>
            )}
            
            {collapsed && notifications.length > 0 && (
              <div className="flex justify-center">
                <span className="bg-cyan-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              </div>
            )}
          </div>
          
          {/* People & Groups You May Like */}
          <div className="mb-6">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-2 py-1'} mb-3`}>
              <Users className="text-cyan-600" size={collapsed ? 22 : 18} />
              {!collapsed && <span className="ml-2 font-medium">Suggestions</span>}
            </div>
            
            {!collapsed && (
              <div className="space-y-3 px-2">
                {suggestedUsers.length > 0 && (
                  <div>
                    <h4 className="text-xs text-gray-500 mb-2">People You May Know</h4>
                    {suggestedUsers.map(user => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.id}`}
                        className="flex p-2 hover:bg-cyan-50 rounded-md transition-colors"
                      >
                        <div className="flex-shrink-0 mr-2">
                          <Image 
                            src={user.avatar_url || '/default-avatar.png'} 
                            alt={user.username}
                            width={36}
                            height={36}
                            className="rounded-full"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.username}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {user.bio || 'Community member'}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                
                {suggestedGroups.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs text-gray-500 mb-2">Groups You Might Enjoy</h4>
                    {suggestedGroups.map(group => (
                      <Link
                        key={group.id}
                        href={`/community/${communityId}/vibe-groups/${group.id}`}
                        className="flex p-2 hover:bg-cyan-50 rounded-md transition-colors"
                      >
                        <div className="flex-shrink-0 mr-2">
                          {group.icon_url ? (
                            <Image 
                              src={group.icon_url} 
                              alt={group.name}
                              width={36}
                              height={36}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {group.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{group.name}</p>
                          <p className="text-xs text-gray-500">
                            {group.member_count} members
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Community Stats */}
          {!collapsed && communityStats && (
            <div className="mb-6">
              <div className="px-2 py-1 mb-3">
                <div className="flex items-center">
                  <Activity className="text-cyan-600" size={18} />
                  <span className="ml-2 font-medium">Community Stats</span>
                </div>
              </div>
              
              <div className="bg-cyan-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2">
                    <div className="text-xl font-bold text-cyan-700">{communityStats.postsThisWeek}</div>
                    <div className="text-xs text-cyan-600">Posts this week</div>
                  </div>
                  <div className="text-center p-2">
                    <div className="text-xl font-bold text-cyan-700">{communityStats.activeGroups}</div>
                    <div className="text-xs text-cyan-600">Active groups</div>
                  </div>
                  <div className="text-center p-2 col-span-2">
                    <div className="text-xl font-bold text-cyan-700">{communityStats.newMembersToday}</div>
                    <div className="text-xs text-cyan-600">New members today</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Event Countdown */}
          {!collapsed && nextEvent && (
            <div className="mb-6">
              <div className="px-2 py-1 mb-3">
                <div className="flex items-center">
                  <Calendar className="text-cyan-600" size={18} />
                  <span className="ml-2 font-medium">Upcoming Event</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-cyan-100">
                <h4 className="font-medium mb-1">{nextEvent.title}</h4>
                
                <div className="flex items-center mb-2">
                  <Clock className="text-cyan-600 mr-1" size={14} />
                  <span className="text-sm">
                    {new Date(nextEvent.event_start_time).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {nextEvent.location && (
                  <div className="flex items-center mb-3">
                    <MapPin className="text-cyan-600 mr-1" size={14} />
                    <span className="text-sm">{nextEvent.location}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded-md text-sm flex items-center">
                    <Clock className="mr-1" size={14} />
                    {getTimeRemaining(nextEvent.event_start_time)}
                  </div>
                  
                  <button 
                    className="bg-cyan-600 text-white px-3 py-1 rounded-md text-sm hover:bg-cyan-700 transition-colors"
                    onClick={() => {
                      // This would update the RSVP status in a real implementation
                    }}
                  >
                    RSVP
                  </button>
                </div>
                
                <Link
                  href={`/community/${communityId}/feed?postId=${nextEvent.id}`}
                  className="text-xs text-cyan-600 hover:underline flex items-center justify-end"
                >
                  View details
                  <ExternalLink size={12} className="ml-1" />
                </Link>
              </div>
            </div>
          )}
          
          {/* Sponsored Content */}
          {!collapsed && sponsoredContent.length > 0 && (
            <div className="mb-4">
              <div className="px-2 py-1 mb-3">
                <span className="text-xs text-gray-500">SPONSORED</span>
              </div>
              
              <div className="space-y-3 px-2">
                {sponsoredContent.map(item => (
                  <Link
                    key={item.id}
                    href={`/business/${item.id}`}
                    className="block overflow-hidden rounded-lg border border-gray-200 hover:border-cyan-200 transition-colors"
                  >
                    {item.image && (
                      <div className="h-24 overflow-hidden">
                        <Image 
                          src={item.image} 
                          alt={item.title}
                          width={280}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="p-2">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
} 