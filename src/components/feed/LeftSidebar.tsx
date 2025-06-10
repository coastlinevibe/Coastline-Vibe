'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Users, ChevronRight, ChevronLeft, 
  Hash, MapPin, BarChart2, Plus,
  HelpCircle, Megaphone, Calendar, MessageCircle, 
} from 'lucide-react';
import Image from 'next/image';
import { LeftSidebarProps, UserGroup, NearbyActivity } from '@/types/sidebar';

export default function LeftSidebar({ 
  communityId, 
  onHashtagSelect,
  onOpenCreator 
}: LeftSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([]);
  const [hotPoll, setHotPoll] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [nearbyActivities, setNearbyActivities] = useState<NearbyActivity[]>([]);
  const [communityUuid, setCommunityUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClientComponentClient();
  
  // Initialize collapsed state based on screen width
  useEffect(() => {
    setCollapsed(window.innerWidth < 768);
    
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
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
  
  // Fetch user's groups
  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!communityUuid) return;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get user's profile ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (!profile) return;
      
      // Get user's groups in this community
      const { data: groups } = await supabase
        .from('vibe_groups_members')
        .select(`
          group_id,
          role,
          vibe_groups:group_id (
            id,
            name,
            icon_url,
            visibility
          )
        `)
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(5);
        
      if (groups) {
        // Get unread counts for each group
        const groupIds = groups.map(g => g.group_id);
        const { data: unreadCounts } = await supabase
          .from('vibe_groups_members')
          .select('group_id, last_read_at')
          .eq('user_id', profile.id)
          .in('group_id', groupIds);
          
        const unreadCountsMap: Record<string, number> = {};
        
        if (unreadCounts) {
          // For each group, fetch message count after last_read_at
          for (const unread of unreadCounts) {
            const { data: messageCount } = await supabase
              .from('vibe_groups_messages')
              .select('id', { count: 'exact' })
              .eq('group_id', unread.group_id)
              .gt('created_at', unread.last_read_at || new Date(0).toISOString());
              
            unreadCountsMap[unread.group_id] = messageCount || 0;
          }
        }
        
        // Format groups with unread counts
        const formattedGroups = groups.map(g => ({
          id: g.vibe_groups.id,
          name: g.vibe_groups.name,
          iconUrl: g.vibe_groups.icon_url,
          visibility: g.vibe_groups.visibility,
          role: g.role,
          unreadCount: unreadCountsMap[g.group_id] || 0
        }));
        
        setUserGroups(formattedGroups);
      }
    };
    
    if (communityUuid) {
      fetchUserGroups();
    }
  }, [communityUuid, supabase]);
  
  // Fetch trending hashtags
  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      if (!communityUuid) return;
      
      // Get posts from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('content')
        .eq('community_id', communityUuid)
        .gt('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
        
      if (recentPosts) {
        // Extract and count hashtags
        const hashtags: Record<string, number> = {};
        
        recentPosts.forEach(post => {
          if (!post.content) return;
          
          const matches = post.content.match(/#(\w+)/g);
          if (matches) {
            matches.forEach(tag => {
              const cleanTag = tag.substring(1).toLowerCase();
              hashtags[cleanTag] = (hashtags[cleanTag] || 0) + 1;
            });
          }
        });
        
        // Sort by frequency and get top 7
        const trending = Object.entries(hashtags)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 7)
          .map(([tag]) => tag);
          
        setTrendingHashtags(trending);
      }
    };
    
    if (communityUuid) {
      fetchTrendingHashtags();
    }
  }, [communityUuid, supabase]);
  
  // Fetch hot poll
  useEffect(() => {
    const fetchHotPoll = async () => {
      if (!communityUuid) return;
      
      // Get the most active poll from the last 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data: polls } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          created_at,
          user_id,
          polls!inner (
            id,
            question,
            options,
            votes_count
          ),
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('community_id', communityUuid)
        .eq('type', 'poll')
        .gt('created_at', threeDaysAgo.toISOString())
        .order('polls.votes_count', { ascending: false })
        .limit(1);
        
      if (polls && polls.length > 0) {
        // Format the poll
        const hotPoll = {
          id: polls[0].id,
          pollId: polls[0].polls.id,
          question: polls[0].polls.question || polls[0].title,
          options: polls[0].polls.options || [],
          votesCount: polls[0].polls.votes_count || 0,
          authorName: polls[0].profiles?.username,
          authorAvatar: polls[0].profiles?.avatar_url,
          createdAt: polls[0].created_at
        };
        
        setHotPoll(hotPoll);
      }
    };
    
    if (communityUuid) {
      fetchHotPoll();
    }
  }, [communityUuid, supabase]);
  
  // Get user location and nearby activities
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Now fetch nearby activities if we have communityUuid
          if (communityUuid) {
            fetchNearbyActivities(latitude, longitude);
          }
        },
        error => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [communityUuid]);
  
  const fetchNearbyActivities = async (lat: number, lng: number) => {
    if (!communityUuid) return;
    
    // Fetch events with location data
    const { data: events } = await supabase
      .from('posts')
      .select(`
        id, 
        title,
        type,
        created_at,
        location_lat,
        location_lng,
        location_name
      `)
      .eq('community_id', communityUuid)
      .eq('type', 'event')
      .not('location_lat', 'is', null)
      .not('location_lng', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (events) {
      // Calculate distance and filter events within 15 miles (approximately)
      const nearbyEvents = events
        .map(event => {
          if (!event.location_lat || !event.location_lng) return null;
          
          // Simple distance calculation
          const distance = calculateDistance(
            lat, 
            lng, 
            event.location_lat, 
            event.location_lng
          );
          
          return {
            id: event.id,
            title: event.title,
            type: event.type,
            locationName: event.location_name,
            distance: distance,
            lat: event.location_lat,
            lng: event.location_lng
          };
        })
        .filter(Boolean)
        .filter(event => event!.distance <= 15) // Within 15 miles
        .sort((a, b) => a!.distance - b!.distance);
        
      setNearbyActivities(nearbyEvents as NearbyActivity[]);
    }
  };
  
  // Simple distance calculation function (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };
  
  const toRad = (value: number): number => {
    return value * Math.PI / 180;
  };
  
  const renderGroupIcon = (group: any) => {
    if (group.iconUrl) {
      return (
        <Image 
          src={group.iconUrl} 
          alt={group.name} 
          width={32} 
          height={32} 
          className="rounded-full"
        />
      );
    }
    
    // Default icon with first letter
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
        {group.name.charAt(0).toUpperCase()}
      </div>
    );
  };
  
  return (
    <aside 
      className={`bg-white h-full rounded-lg shadow-md transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header with collapse toggle */}
      <div className="p-3 border-b flex items-center justify-between">
        {!collapsed && (
          <h2 className="font-bold text-cyan-900">Discovery</h2>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 bg-cyan-50 rounded-full text-cyan-600 hover:bg-cyan-100 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      
      {/* Sidebar content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* Your Groups module */}
          <div className="mb-6">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-2 py-1'} mb-3`}>
              <Users className="text-cyan-600" size={collapsed ? 22 : 18} />
              {!collapsed && <span className="ml-2 font-medium">Your Groups</span>}
            </div>
            
            {!collapsed && (
              <div className="space-y-2 px-2">
                {userGroups.length > 0 ? (
                  userGroups.map(group => (
                    <Link 
                      key={group.id} 
                      href={`/community/${communityId}/vibe-groups/${group.id}`}
                      className="flex items-center p-2 hover:bg-cyan-50 rounded-md transition-colors"
                    >
                      {renderGroupIcon(group)}
                      <div className="ml-2 flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className="font-medium truncate">{group.name}</span>
                          {group.visibility === 'private' && (
                            <span className="ml-1 text-gray-400">🔒</span>
                          )}
                        </div>
                      </div>
                      {group.unreadCount > 0 && (
                        <span className="bg-cyan-500 text-white rounded-full text-xs px-1.5 py-0.5 min-w-5 text-center">
                          {group.unreadCount > 99 ? '99+' : group.unreadCount}
                        </span>
                      )}
                    </Link>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic px-2">
                    No groups joined yet
                  </div>
                )}
                
                <div className="pt-2">
                  <button
                    onClick={() => onOpenCreator && onOpenCreator('group')}
                    className="flex items-center text-cyan-600 hover:text-cyan-700 px-2 py-1 w-full"
                  >
                    <Plus size={16} className="mr-1" />
                    <span className="text-sm">Create New Group</span>
                  </button>
                </div>
              </div>
            )}
            
            {collapsed && userGroups.length > 0 && (
              <div className="flex flex-col items-center space-y-3 mt-2">
                {userGroups.slice(0, 3).map(group => (
                  <Link 
                    key={group.id} 
                    href={`/community/${communityId}/vibe-groups/${group.id}`}
                    className="relative"
                  >
                    {renderGroupIcon(group)}
                    {group.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-cyan-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
                        {group.unreadCount > 9 ? '9+' : group.unreadCount}
                      </span>
                    )}
                  </Link>
                ))}
                
                <button
                  onClick={() => onOpenCreator && onOpenCreator('group')}
                  className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600 hover:bg-cyan-200 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            )}
          </div>
          
          {/* Trending Hashtags */}
          <div className="mb-6">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-2 py-1'} mb-3`}>
              <Hash className="text-cyan-600" size={collapsed ? 22 : 18} />
              {!collapsed && <span className="ml-2 font-medium">Trending Tags</span>}
            </div>
            
            {!collapsed && (
              <div className="flex flex-wrap gap-1 px-2">
                {trendingHashtags.length > 0 ? (
                  trendingHashtags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => onHashtagSelect && onHashtagSelect(tag)}
                      className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full text-sm transition-colors"
                    >
                      #{tag}
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No trending tags yet
                  </div>
                )}
              </div>
            )}
            
            {collapsed && trendingHashtags.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="text-xs text-cyan-600 font-medium mb-1">
                  #{trendingHashtags[0]}
                </div>
              </div>
            )}
          </div>
          
          {/* Live Mini-Map */}
          <div className="mb-6">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-2 py-1'} mb-3`}>
              <MapPin className="text-cyan-600" size={collapsed ? 22 : 18} />
              {!collapsed && <span className="ml-2 font-medium">Nearby Activity</span>}
            </div>
            
            {!collapsed && (
              <div className="px-2">
                {userLocation ? (
                  <div>
                    {nearbyActivities.length > 0 ? (
                      <div className="space-y-2">
                        {nearbyActivities.map(activity => (
                          <Link
                            key={activity.id}
                            href={`/community/${communityId}/feed?postId=${activity.id}`}
                            className="flex items-center p-2 hover:bg-gray-50 rounded-md text-sm"
                          >
                            <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600 mr-2">
                              <MapPin size={14} />
                            </div>
                            <div>
                              <div className="font-medium truncate max-w-[160px]">{activity.title || 'Event'}</div>
                              <div className="text-gray-500 text-xs">
                                {activity.locationName || 'Location'} • {activity.distance.toFixed(1)} mi
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No nearby activities found
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      navigator.geolocation?.getCurrentPosition(
                        position => {
                          const { latitude, longitude } = position.coords;
                          setUserLocation({ lat: latitude, lng: longitude });
                          if (communityUuid) {
                            fetchNearbyActivities(latitude, longitude);
                          }
                        }
                      );
                    }}
                    className="w-full py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 rounded-md text-sm transition-colors"
                  >
                    Share location to see nearby activity
                  </button>
                )}
              </div>
            )}
            
            {collapsed && userLocation && nearbyActivities.length > 0 && (
              <div className="text-xs text-center text-cyan-600">
                {nearbyActivities.length} nearby
              </div>
            )}
          </div>
          
          {/* Hot Now Poll */}
          <div className="mb-6">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-2 py-1'} mb-3`}>
              <BarChart2 className="text-cyan-600" size={collapsed ? 22 : 18} />
              {!collapsed && <span className="ml-2 font-medium">Hot Poll</span>}
            </div>
            
            {!collapsed && (
              <div className="px-2">
                {hotPoll ? (
                  <Link
                    href={`/community/${communityId}/feed?postId=${hotPoll.id}`}
                    className="block p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-100"
                  >
                    <div className="font-medium mb-2">{hotPoll.question}</div>
                    {hotPoll.options.slice(0, 2).map((option: any, index: number) => {
                      // Calculate percentage if votes exist
                      const percentage = hotPoll.votesCount > 0 
                        ? Math.round((option.votes / hotPoll.votesCount) * 100) 
                        : 0;
                      
                      return (
                        <div key={index} className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{option.text}</span>
                            <span>{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-cyan-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                    {hotPoll.options.length > 2 && (
                      <div className="text-xs text-cyan-600 text-right">
                        +{hotPoll.options.length - 2} more options
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="text-sm text-gray-500 italic px-2">
                    No active polls
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Quick-Action Micro-Composer */}
          <div className="mb-4">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-2 py-1'} mb-3`}>
              <Plus className="text-cyan-600" size={collapsed ? 22 : 18} />
              {!collapsed && <span className="ml-2 font-medium">Create</span>}
            </div>
            
            {!collapsed ? (
              <div className="grid grid-cols-2 gap-2 px-2">
                <button
                  onClick={() => onOpenCreator && onOpenCreator('ask')}
                  className="flex flex-col items-center p-2 bg-cyan-50 hover:bg-cyan-100 rounded-md transition-colors"
                >
                  <HelpCircle size={18} className="text-cyan-600 mb-1" />
                  <span className="text-xs">Ask</span>
                </button>
                
                <button
                  onClick={() => onOpenCreator && onOpenCreator('announce')}
                  className="flex flex-col items-center p-2 bg-cyan-50 hover:bg-cyan-100 rounded-md transition-colors"
                >
                  <Megaphone size={18} className="text-cyan-600 mb-1" />
                  <span className="text-xs">Announce</span>
                </button>
                
                <button
                  onClick={() => onOpenCreator && onOpenCreator('event')}
                  className="flex flex-col items-center p-2 bg-cyan-50 hover:bg-cyan-100 rounded-md transition-colors"
                >
                  <Calendar size={18} className="text-cyan-600 mb-1" />
                  <span className="text-xs">Event</span>
                </button>
                
                <button
                  onClick={() => onOpenCreator && onOpenCreator('poll')}
                  className="flex flex-col items-center p-2 bg-cyan-50 hover:bg-cyan-100 rounded-md transition-colors"
                >
                  <BarChart2 size={18} className="text-cyan-600 mb-1" />
                  <span className="text-xs">Poll</span>
                </button>
                
                <button
                  onClick={() => onOpenCreator && onOpenCreator('general')}
                  className="flex flex-col items-center p-2 bg-cyan-50 hover:bg-cyan-100 rounded-md transition-colors col-span-2"
                >
                  <MessageCircle size={18} className="text-cyan-600 mb-1" />
                  <span className="text-xs">New Post</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onOpenCreator && onOpenCreator('general')}
                  className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600 hover:bg-cyan-200 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
} 