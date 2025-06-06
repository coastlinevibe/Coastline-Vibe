"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import MiamiDashboard from '@/components/community/MiamiDashboard';
import Link from 'next/link';
import Image from 'next/image';
import { UserCircle2, ChevronDown, ChevronUp, ShieldCheck, MessageSquare, Heart, AtSign, Sailboat } from 'lucide-react';
import FeedPostItem from '@/components/feed/FeedPostItem';
import LocationVerificationForm from '@/components/profile/LocationVerificationForm';

// Define a more specific Profile type for this page's needs
interface Profile {
  id: string;
  username: string;
  community_id: string | null;
  is_admin: boolean | null;
  avatar_url?: string;
  email?: string;
  bio?: string;
  role?: string;
  hasBusinessDashboard: boolean;
  created_at?: string;
  is_location_verified: boolean;
  is_online?: boolean;
}

// Define wishlist item type
interface WishlistItem {
  id: string;
  item_id: string;
  user_id: string;
  created_at: string;
  market_item: {
    id: string;
    title: string;
    price: number;
    imagefiles?: string[];
    approval_status?: string;
  };
}

// Define a more generic NotificationItem interface
interface GenericNotification {
  id: string;
  type: 'mention' | 'post_like' | 'new_comment' | 'PROPERTY_INQUIRY' | 'MARKET_INTERACTION' | 'BUSINESS_INTERACTION' | string;
  actor: {
    id: string;
    username: string | null;
    avatar_url?: string | null;
  } | null;
  target_entity_id: string | null;
  target_entity_type: string | null;
  target_entity_title?: string | null;
  content_snippet?: string | null;
  created_at: string;
  is_read: boolean;
  community_id: string | null;
}

type PageStatus = 'loading' | 'unauthenticated' | 'unauthorized' | 'authorized' | 'error';

export default function CommunityLandingPage() {
  const params = useParams();
  
  const communityId = typeof params?.communityId === 'string' ? params.communityId : null;
  const [communityUuid, setCommunityUuid] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [community, setCommunity] = useState<{ name: string, id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [notifications, setNotifications] = useState<GenericNotification[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState('');
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userVerificationRequestStatus, setUserVerificationRequestStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [isVerificationFormVisible, setIsVerificationFormVisible] = useState(false);
  const isAdmin = profile?.role === 'community admin';
  const canPin = profile?.role === 'community admin';
  const [friends, setFriends] = useState<any[]>([]);
  const [showBusinessDashPrompt, setShowBusinessDashPrompt] = useState(true);
  const [activeNotificationTab, setActiveNotificationTab] = useState<string>('Chatter');
  const [isActivityCollapsed, setIsActivityCollapsed] = useState<boolean>(true);
  const [isNotificationsCollapsed, setIsNotificationsCollapsed] = useState<boolean>(true);

  // State for user-created properties and market items
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [userMarketItems, setUserMarketItems] = useState<any[]>([]);
  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState<boolean>(true);
  const [isMarketItemsCollapsed, setIsMarketItemsCollapsed] = useState<boolean>(true);

  // Define a type for user activity items
  interface UserActivityItem {
    id: string; // Unique ID for the activity item (e.g., post_id, comment_id)
    type: 'user_created_post' | 'user_made_comment';
    description: string;
    created_at: string;
    link_href?: string;
    // For consistency with existing rendering, we'll add these, populated by current user's info
    avatar_url?: string | null;
    actor_username?: string | null;
    target_entity_id?: string | null; // post_id for posts, parent_post_id for comments for linking
  }

  const fetchUserActivity = useCallback(async () => {
    if (!profile?.id || !communityId || !supabase) {
      setActivity([]);
      return;
    }

    const USER_ACTIVITY_LIMIT = 5;
    let userActivities: UserActivityItem[] = [];

    try {
      // Fetch user's recent posts (non-comments)
      const { data: userPosts, error: postsError } = await supabase
        .from('posts')
        .select('id, title, content, created_at, type, community_id')
        .eq('user_id', profile.id)
        .neq('type', 'comment') // Exclude comments from this query
        .eq('community_id', communityUuid) // Ensure posts are from the current community
        .order('created_at', { ascending: false })
        .limit(USER_ACTIVITY_LIMIT);

      if (postsError) {
        console.error("Error fetching user's posts for activity:", postsError);
      } else if (userPosts) {
        userPosts.forEach(post => {
          const postTypeDisplay = post.type === 'general' ? '' : `${post.type} `;
          userActivities.push({
            id: `post-${post.id}`,
            type: 'user_created_post',
            description: `You created a ${postTypeDisplay}post: "${post.title || (post.content ? post.content.substring(0, 50) + '...' : 'Untitled Post')}"`,
            created_at: post.created_at,
            link_href: `/community/${communityId}/feed#post-${post.id}`,
            avatar_url: profile.avatar_url,
            actor_username: profile.username,
            target_entity_id: post.id, // For potential use by link logic if generalized
          });
        });
      }

      // Fetch user's recent comments
      const { data: userComments, error: commentsError } = await supabase
        .from('posts')
        .select('id, content, created_at, parent_post_id, community_id')
        .eq('user_id', profile.id)
        .eq('type', 'comment')
        .eq('community_id', communityUuid) // Ensure comments are from the current community
        .order('created_at', { ascending: false })
        .limit(USER_ACTIVITY_LIMIT);

      if (commentsError) {
        console.error("Error fetching user's comments for activity:", commentsError);
      } else if (userComments) {
        userComments.forEach(comment => {
          userActivities.push({
            id: `comment-${comment.id}`,
            type: 'user_made_comment',
            description: `You commented: "${comment.content ? comment.content.substring(0, 70) + '...' : 'View comment'}"`,
            created_at: comment.created_at,
            link_href: comment.parent_post_id ? `/community/${communityId}/feed#post-${comment.parent_post_id}` : undefined,
            avatar_url: profile.avatar_url,
            actor_username: profile.username,
            target_entity_id: comment.parent_post_id, // For potential use by link logic
          });
        });
      }

      // Sort all activities by date
      userActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Limit total activities displayed if necessary (though individual queries are limited)
      setActivity(userActivities.slice(0, USER_ACTIVITY_LIMIT * 2)); // Show a mix

    } catch (error) {
      console.error("Error in fetchUserActivity:", error);
      setActivity([]);
    }
  }, [profile, communityId, supabase, communityUuid]);

  // useEffect to update activity state based on user's own actions
  useEffect(() => {
    if (profile?.id && communityUuid) {
      fetchUserActivity();
    }
  }, [profile, communityUuid, fetchUserActivity]);

  const fetchUserProperties = useCallback(async () => {
    if (!profile?.id || !communityUuid || !supabase) {
      setUserProperties([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, type, images, community_id') // Add other fields as needed
        .eq('user_id', profile.id)
        .eq('community_id', communityUuid)
        .order('created_at', { ascending: false })
        .limit(5); // Limit for dashboard display

      if (error) {
        console.error("Error fetching user's properties:", error);
        setUserProperties([]);
      } else {
        setUserProperties(data || []);
      }
    } catch (e) {
      console.error("Exception fetching user's properties:", e);
      setUserProperties([]);
    }
  }, [profile, communityUuid, supabase]);

  const fetchUserMarketItems = useCallback(async () => {
    if (!profile?.id || !communityUuid || !supabase) {
      setUserMarketItems([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('market_items')
        .select('id, title, price, imagefiles, community_id') // Add other fields as needed
        .eq('user_id', profile.id)
        .eq('community_id', communityUuid)
        .order('created_at', { ascending: false })
        .limit(5); // Limit for dashboard display

      if (error) {
        console.error("Error fetching user's market items:", error);
        setUserMarketItems([]);
      } else {
        setUserMarketItems(data || []);
      }
    } catch (e) {
      console.error("Exception fetching user's market items:", e);
      setUserMarketItems([]);
    }
  }, [profile, communityUuid, supabase]);

  useEffect(() => {
    if (profile?.id && communityUuid) {
      fetchUserProperties();
      fetchUserMarketItems();
    }
  }, [profile, communityUuid, fetchUserProperties, fetchUserMarketItems]);

  const fetchAllNotifications = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          content_snippet,
          target_entity_id,
          target_entity_type,
          created_at,
          is_read,
          community_id,
          actor:actor_user_id (id, username, avatar_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Notifications] Error fetching notifications:', error);
        setNotifications([]);
      } else if (data) {
        const formattedNotifications = data.map(n => {
          // Ensure 'actor' is treated as a single object or null.
          const rawActorData = n.actor; // Potentially an array or object from Supabase
          const actorObject = Array.isArray(rawActorData) ? rawActorData[0] : rawActorData;
          const actorProfile = actorObject as { id: string; username: string | null; avatar_url?: string | null; } | null;
          return {
            ...n,
            actor: actorProfile ? { 
              id: actorProfile.id,
              username: actorProfile.username,
              avatar_url: actorProfile.avatar_url
            } : { id: 'unknown', username: 'System', avatar_url: null }
          } as GenericNotification; // Explicit cast to GenericNotification
        });
        setNotifications(formattedNotifications);
      }
    } catch (e) {
      console.error('[Notifications] Exception fetching notifications:', e);
      setNotifications([]);
    }
  }, [supabase]);

  useEffect(() => {
    if (communityId) {
    fetchCommunityAndUserData();
    }
  }, [communityId, supabase]);

  const fetchPendingRequests = async () => {
    if (!profile?.id) return;
    setPendingLoading(true);
    setPendingError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const { data: requests, error: reqError } = await supabase
        .from('friend_requests')
        .select('id, sender_id, reason, status, created_at, profiles:sender_id(username, avatar_url)')
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (reqError) throw reqError;
      setPendingRequests(requests || []);
    } catch (err: any) {
      setPendingError('Failed to load pending friend requests.');
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchFriends = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('friends')
      .select('friend_id, profiles:friend_id(username, avatar_url)')
      .eq('user_id', profile.id)
      .eq('status', 'accepted');
    if (!error && data) {
      setFriends(data);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchPendingRequests();
      fetchFriends();
      fetchAllNotifications(profile.id);
    }
  }, [profile, fetchAllNotifications]);

  async function fetchCommunityAndUserData() {
    if (!communityId) return;
      setLoading(true);
    setError(null);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setError('Not logged in');
        setLoading(false);
        router.push('/login');
        return;
      }
      const userId = authUser.id;

      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidPattern.test(communityId);

      let query = supabase.from('communities').select('id, name');
      if (isUuid) {
        query = query.eq('id', communityId);
      } else {
        query = query.eq('slug', communityId);
      }
      const { data: communityData, error: communityError } = await query.single();

      if (communityError) {
        console.error(`[CommunityPage] Error fetching community by slug '${communityId}':`, communityError);
        setError(`Community '${communityId}' not found or error loading.`);
        setCommunity(null);
        setCommunityUuid(null);
      } else if (communityData) {
        setCommunity({ name: communityData.name, id: communityData.id });
        setCommunityUuid(communityData.id);
        } else {
        setError(`Community '${communityId}' not found.`);
        setCommunity(null);
        setCommunityUuid(null);
          }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, is_location_verified')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        setProfile(null);
      } else if (profileData) {
        // For the currently logged-in user on their community page, assume online.
        const augmentedProfileData = {
          ...profileData,
          is_online: true,
        };
        setProfile(augmentedProfileData as Profile);
      }

      if (profileData) {
        const { data: verificationRequest, error: verificationError } = await supabase
          .from('verification_requests')
          .select('status')
        .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (verificationRequest) {
          setUserVerificationRequestStatus(verificationRequest.status as 'pending' | 'approved' | 'rejected' | null);
        }
      }

    } catch (e: any) {
      console.error("Error in fetchCommunityAndUserData:", e);
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchWishlistItems(userId: string) {
    if (!userId) return;
    setWishlistLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          item_id,
          user_id,
          created_at,
          market_item:market_items!inner(
            id,
            title,
            price,
            imagefiles,
            approval_status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Manually cast the fetched data to ensure type compatibility, especially for the joined market_item
      const typedData = data?.map(item => {
        const marketItemData = item.market_item as any; // Supabase might return array for join, take first if so, or it's an object
        const actualMarketItem = Array.isArray(marketItemData) ? marketItemData[0] : marketItemData;
        return {
          ...item,
          market_item: {
            id: actualMarketItem?.id || '',
            title: actualMarketItem?.title || '',
            price: actualMarketItem?.price || 0,
            imagefiles: actualMarketItem?.imagefiles,
            approval_status: actualMarketItem?.approval_status,
          },
        } as WishlistItem;
      }) || [];
      setWishlistItems(typedData);

    } catch (err: any) {
      setError('Failed to load wishlist.');
    } finally {
      setWishlistLoading(false);
    }
  }

  useEffect(() => {
    if (profile?.id) {
      fetchWishlistItems(profile.id);
    }
  }, [profile?.id]);

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId);
      if (error) throw error;
      setWishlistItems(prevItems => prevItems.filter(item => item.id !== wishlistId));
    } catch (err: any) {
      setError('Failed to remove item from wishlist.');
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
    };
    const textInputs = document.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => input.addEventListener('focus', handleFocus));
    return () => {
      textInputs.forEach(input => input.removeEventListener('focus', handleFocus));
    };
  }, []);

  const handleAccept = async (id: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', id);
    if (!error) {
      const request = pendingRequests.find(r => r.id === id);
      if (request) {
        setFriends([...friends, { friend_id: request.sender_id, profiles: request.profiles }]);
        setPendingRequests(pendingRequests.filter(r => r.id !== id));
      }
    }
  };
  
  const handleReject = async (id: string) => {
    const { error } = await supabase.from('friend_requests').delete().eq('id', id);
    if (!error) setPendingRequests(pendingRequests.filter(r => r.id !== id));
  };

  const handleDeleteAccount = async () => {
    // Logic for deleting account
  };

  const getFilteredNotifications = useCallback(() => {
    if (activeNotificationTab === 'Chatter') {
      return notifications.filter(n => 
        n.type === 'mention' || 
        n.type === 'post_like' || 
        n.type === 'new_comment'
      );
    } else if (activeNotificationTab === 'Property') {
      return notifications.filter(n => n.type === 'PROPERTY_INQUIRY' /* Add other property types */);
    } else if (activeNotificationTab === 'Market') {
      return notifications.filter(n => n.type === 'MARKET_INTERACTION' /* Add other market types */);
    } else if (activeNotificationTab === 'Directory') {
      return notifications.filter(n => n.type === 'BUSINESS_INTERACTION' /* Add other directory types */);
    }
    return [];
  }, [notifications, activeNotificationTab]);

  const handleVerificationSubmitSuccess = () => {
    setIsVerificationFormVisible(false);
    setUserVerificationRequestStatus('pending');
  };

  const handleVerificationCancel = () => {
    setIsVerificationFormVisible(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error && !profile) {
    return <div className="flex justify-center items-center h-screen">Error: {error}. Please try refreshing.</div>;
  }
  
  if (!profile || !communityId) {
    if (!loading) {
        router.push('/login');
        return <div className="flex justify-center items-center h-screen">Redirecting...</div>; 
    }
    return <div className="flex justify-center items-center h-screen">Loading user data...</div>;
  }

  if (communityId && !communityUuid) {
    return (
        <div className="flex flex-col justify-center items-center h-screen">
          <p className="text-red-500">Error: Community "{communityId}" not found or could not be loaded.</p>
          <Link href="/" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Go to Homepage
          </Link>
          </div>
      );
  }
  
  const displayedNotifications = getFilteredNotifications();

  const getAvatarUrl = (actor: GenericNotification['actor']) => {
    if (actor?.avatar_url) return actor.avatar_url;
    const name = actor?.username || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <AtSign className="h-5 w-5 text-blue-500" />;
      case 'post_like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'new_comment':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <UserCircle2 className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="container mx-auto p-4 pt-20">
        {communityId === 'miami' && profile && (
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-lg shadow-lg mb-6 text-center">
            <h1 className="text-3xl font-bold">Welcome to CoastlineVibe Miami, {profile.username}!</h1>
            <p className="mt-2 text-lg">Your hub for all things Miami. Connect, discover, and engage with your community.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="relative group flex items-center space-x-4 mb-4">
                <Image 
                  src={profile.avatar_url || getAvatarUrl(null)} 
                  alt={profile.username}
                  width={80} 
                  height={80} 
                  className="rounded-full cursor-pointer"
                />
                <div>
                  <h1 className="text-2xl font-semibold flex items-center cursor-pointer">
                    {profile.username}
                    {profile.is_online ? (
                      <span title="Online">
                        <Sailboat size={18} className="ml-2 text-green-500" />
                      </span>
                    ) : (
                      <span title="Offline">
                        <Sailboat size={18} className="ml-2 text-slate-400" />
                      </span>
                    )}
                    {profile.is_location_verified && (
                       <ShieldCheck className="ml-2 h-5 w-5 text-blue-500" />
                    )}
                    </h1>
                  <p className="text-slate-600">{profile.role || 'Resident'}</p>
                  {profile.bio && (
                    <div className="mt-1">
                      <span className="text-xs text-slate-400 font-semibold">About Me:</span>
                      <p className="text-sm text-slate-500 italic whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                  )}
                </div>
                {/* Tooltip Content */}
                <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                    <div className="flex flex-col items-center">
                        <Image 
                            src={profile.avatar_url || getAvatarUrl(null)} 
                            alt={profile.username}
                            width={96} 
                            height={96} 
                            className="rounded-full mb-3 border-2 border-blue-300"
                        />
                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                          {profile.username}
                          {profile.is_online ? (
                            <span title="Online">
                              <Sailboat size={16} className="ml-1.5 text-green-500" />
                            </span>
                          ) : (
                            <span title="Offline">
                              <Sailboat size={16} className="ml-1.5 text-slate-400" />
                            </span>
                          )}
                        </h2>
                        {profile.email && <p className="text-sm text-slate-500">{profile.email}</p>}
                    </div>
                    {profile.bio && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-400 font-semibold mb-1">About Me</p>
                            <p className="text-sm text-slate-600 italic whitespace-pre-wrap">{profile.bio}</p>
                        </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Joined</p>
                        <p className="text-sm text-slate-600">
                            {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                        </p>
                    </div>
                </div>
              </div>
              {isAdmin && communityUuid && (
                <Link href={`/community/${communityUuid}/admin`} className="block w-full mb-3">
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 ease-in-out shadow-md">
                    Admin Dashboard
                  </button>
                </Link>
              )}
              {/* Edit Profile Button - Added Below */}
              <Link href="/profile/edit" className="block w-full mb-3">
                <button className="w-full bg-transparent hover:bg-primaryTeal text-primaryTeal hover:text-offWhite font-semibold py-3 px-4 border-2 border-primaryTeal rounded-lg transition duration-150 ease-in-out">
                  Edit Profile
                </button>
              </Link>
              {!profile.is_location_verified && userVerificationRequestStatus === 'pending' && (
                <p className="text-sm text-yellow-600 bg-yellow-100 p-2 rounded-md">Location Verification Pending</p>
              )}
              {!profile.is_location_verified && userVerificationRequestStatus === 'rejected' && (
                <div className="p-2 bg-red-100 rounded-md">
                    <p className="text-sm text-red-600">Location Verification Rejected. Please resubmit.</p>
                    <button 
                        onClick={() => setIsVerificationFormVisible(true)}
                        className="mt-1 text-sm text-blue-600 hover:underline"
                    >
                        Resubmit Verification
                    </button>
                </div>
              )}
              {!profile.is_location_verified && !userVerificationRequestStatus && (
                <button 
                  onClick={() => setIsVerificationFormVisible(true)}
                  className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-150"
                >
                  Verify My Location
                </button>
              )}
              {profile.is_location_verified && (
                <p className="text-sm text-green-600 bg-green-100 p-2 rounded-md">Verified Resident</p>
              )}

              {isVerificationFormVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                    <LocationVerificationForm 
                      userId={profile.id}
                      onSubmitSuccess={handleVerificationSubmitSuccess}
                      onCancel={handleVerificationCancel}
                    />
              </div>
              </div>
              )}
            </div>
            
            {communityId === 'miami' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">My Wishlist</h2>
              {wishlistLoading && <p>Loading wishlist...</p>}
              {error && <p className="text-red-500">{error}</p>}
              {wishlistItems.length > 0 ? (
                <ul className="space-y-3">
                  {wishlistItems.map(item => (
                    <li key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <Image 
                            src={item.market_item.imagefiles?.[0] || 'https://via.placeholder.com/50?text=No+Image'} 
                            alt={item.market_item.title} 
                            width={50} 
                            height={50} 
                            className="rounded object-cover"
                        />
                        <div>
                          <p className="font-medium text-slate-800">{item.market_item.title}</p>
                          <p className="text-sm text-slate-600">${item.market_item.price}</p>
          </div>
                    </div>
                      <div className="flex space-x-2">
                        <Link href={`/community/${communityId}/market/${item.market_item.id}`} legacyBehavior>
                            <a className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">View</a>
                      </Link>
                      <button 
                        onClick={() => removeFromWishlist(item.id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">Your wishlist is empty.</p>
              )}
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Pending Friend Requests</h2>
                {pendingLoading && <p>Loading requests...</p>}
                {pendingError && <p className="text-red-500">{pendingError}</p>}
                {pendingRequests.length > 0 ? (
            <ul className="space-y-2">
                        {pendingRequests.map(req => (
                            <li key={req.id} className="flex items-center justify-between p-2 border-b">
                                <div className="flex items-center space-x-2">
                                    <Image src={req.profiles?.avatar_url || getAvatarUrl({id: req.sender_id, username: req.profiles?.username, avatar_url: null})} alt={req.profiles?.username || 'User'} width={32} height={32} className="rounded-full" />
                                    <span>{req.profiles?.username || 'A user'}</span>
                  </div>
                                <div className="space-x-1">
                                    <button onClick={() => handleAccept(req.id)} className="px-2 py-1 text-xs bg-green-500 text-white rounded">Accept</button>
                                    <button onClick={() => handleReject(req.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded">Reject</button>
                  </div>
                </li>
              ))}
            </ul>
                ) : <p className="text-slate-500">No pending friend requests.</p>}
          </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Friends</h2>
              {friends.length > 0 ? (
            <ul className="space-y-2">
                  {friends.map(friend => (
                    <li key={friend.friend_id} className="flex items-center space-x-2 p-2 border-b">
                       <Image src={friend.profiles?.avatar_url || getAvatarUrl({id: friend.friend_id, username: friend.profiles?.username, avatar_url: null})} alt={friend.profiles?.username || 'User'} width={32} height={32} className="rounded-full" />
                       <span>{friend.profiles?.username || 'A user'}</span>
                </li>
              ))}
            </ul>
              ) : <p className="text-slate-500">No friends yet.</p>}
            </div>

          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div 
                className="flex justify-between items-center cursor-pointer mb-4" 
                onClick={() => setIsNotificationsCollapsed(!isNotificationsCollapsed)}
              >
                <h2 className="text-xl font-semibold">My Notifications</h2>
                {isNotificationsCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </div>

              {!isNotificationsCollapsed && (
                <>
                  <div className="border-b border-slate-200 mb-4">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      {['Chatter', 'Property', 'Market', 'Directory'].map((tabName) => (
                        <button
                          key={tabName}
                          onClick={() => setActiveNotificationTab(tabName)}
                          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                            ${activeNotificationTab === tabName 
                              ? 'border-blue-500 text-blue-600' 
                              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                          `}
                        >
                          {tabName}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="space-y-3">
                    {displayedNotifications.length > 0 ? (
                      displayedNotifications.map(notification => (
                        <div key={notification.id} className={`p-3 rounded-md flex items-start space-x-3 ${notification.is_read ? 'bg-slate-50' : 'bg-blue-50'}`}>
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Image 
                                        src={getAvatarUrl(notification.actor)}
                                        alt={notification.actor?.username || 'User'}
                                        width={24} 
                                        height={24} 
                                        className="rounded-full"
                                    />
                                    <span className="text-sm font-medium text-slate-800 truncate">
                                        {notification.actor?.username || 'Someone'}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                    {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-sm text-slate-700 mt-1 truncate">
                                {notification.content_snippet || ' interacted with you.'}
                            </p>
                            {(notification.type === 'mention' || notification.type === 'post_like' || notification.type === 'new_comment') && notification.target_entity_id && communityId && (
                                <Link href={`/community/${communityId}/feed#post-${notification.target_entity_id}`} legacyBehavior>
                                    <a className="mt-1 text-xs text-blue-600 hover:underline">
                                    View Post
                                    </a>
                                </Link>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-center py-4">No {activeNotificationTab.toLowerCase()} notifications.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <div 
                    className="flex justify-between items-center cursor-pointer mb-4"
                    onClick={() => setIsActivityCollapsed(!isActivityCollapsed)}
                >
                    <h2 className="text-xl font-semibold">My Recent Activity</h2>
                    {isActivityCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </div>
                {!isActivityCollapsed && (
                    <div className="space-y-4">
                        {activity.length > 0 ? (
                            activity.map((act, index) => (
                                <div key={act.id} className="relative flex items-start space-x-4 py-3 group">
                                    {/* Timeline vertical line */} 
                                    <div className={`absolute left-5 top-0 w-0.5 bg-slate-200 ${index === 0 ? 'h-[calc(100%-1.25rem)] top-5' : 'h-full'} group-last:h-5`}></div>

                                    {/* Avatar/Icon Circle on the timeline */} 
                                    <div className="relative z-10 flex-shrink-0">
                                        <Image
                                            src={act.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(act.actor_username || 'U')}&background=random`}
                                            alt={act.actor_username || 'User'}
                                            width={40} // Slightly larger avatar for timeline marker
                                            height={40}
                                            className="rounded-full ring-2 ring-white"
                                        />
                                    </div>

                                    {/* Content */} 
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-slate-800 font-medium">{act.description}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {new Date(act.created_at).toLocaleDateString()} {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        {act.link_href && (
                                            <Link href={act.link_href} legacyBehavior>
                                                <a className="mt-1 inline-block text-xs text-blue-600 hover:underline">
                                                View Details
                                                </a>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-center py-4">No recent activity to display.</p>
                        )}
                    </div>
                )}
            </div>

            {/* User's Created Properties Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div
                    className="flex justify-between items-center cursor-pointer mb-4"
                    onClick={() => setIsPropertiesCollapsed(!isPropertiesCollapsed)}
                >
                    <h2 className="text-xl font-semibold">My Created Properties</h2>
                    {isPropertiesCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </div>
                {!isPropertiesCollapsed && (
                    <div className="space-y-3">
                        {userProperties.length > 0 ? (
                            userProperties.map((prop) => (
                                <div key={`prop-${prop.id}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                                    <div className="flex items-center space-x-3">
                                        <Image
                                            src={prop.images?.[0] || 'https://via.placeholder.com/50?text=No+Image'}
                                            alt={prop.address || 'Property'}
                                            width={50}
                                            height={50}
                                            className="rounded object-cover"
                                        />
                                        <div>
                                            <p className="font-medium text-slate-800 truncate max-w-xs">{prop.address || 'Property Listing'}</p>
                                            <p className="text-sm text-slate-600">{prop.type || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <Link href={`/community/${communityId}/properties/${prop.id}`} legacyBehavior>
                                        <a className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">View</a>
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-center py-4">You haven't created any properties in this community yet.</p>
                        )}
                    </div>
                )}
            </div>

            {/* User's Market Listings Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div
                    className="flex justify-between items-center cursor-pointer mb-4"
                    onClick={() => setIsMarketItemsCollapsed(!isMarketItemsCollapsed)}
                >
                    <h2 className="text-xl font-semibold">My Market Listings</h2>
                    {isMarketItemsCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </div>
                {!isMarketItemsCollapsed && (
                    <div className="space-y-3">
                        {userMarketItems.length > 0 ? (
                            userMarketItems.map((item) => (
                                <div key={`market-${item.id}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                                    <div className="flex items-center space-x-3">
                                        <Image
                                            src={item.imagefiles?.[0] || 'https://via.placeholder.com/50?text=No+Image'}
                                            alt={item.title || 'Market Item'}
                                            width={50}
                                            height={50}
                                            className="rounded object-cover"
                                        />
                                        <div>
                                            <p className="font-medium text-slate-800 truncate max-w-xs">{item.title || 'Market Listing'}</p>
                                            <p className="text-sm text-slate-600">${item.price || '0.00'}</p>
                                        </div>
                                    </div>
                                    <Link href={`/community/${communityId}/market/${item.id}`} legacyBehavior>
                                        <a className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">View</a>
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-center py-4">You haven't listed any items in the market for this community yet.</p>
                        )}
                    </div>
                )}
            </div>

            {profile.hasBusinessDashboard && showBusinessDashPrompt && (
              <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold mb-2">Manage Your Business!</h2>
                <p className="mb-4">Access your business dashboard to update listings, view analytics, and more.</p>
                <Link href={`/community/${communityId}/business/${profile.id}`} legacyBehavior>
                  <a className="inline-block bg-white text-blue-600 font-semibold px-6 py-2 rounded-md hover:bg-blue-100 transition duration-150">
                    Go to Business Dashboard
                  </a>
                </Link>
                <button onClick={() => setShowBusinessDashPrompt(false)} className="mt-3 text-sm text-blue-200 hover:text-white">Dismiss</button>
              </div>
            )}
          </div>
        </div>
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Account</h2>
            <p className="text-slate-700 mb-1">This action is irreversible. All your data will be permanently deleted.</p>
            <p className="text-slate-700 mb-4">Please type your username <strong className="text-slate-900">{profile.username}</strong> and the PIN <strong className="text-slate-900">1234</strong> to confirm.</p>
            
            <input
              type="text"
              placeholder="Your username" 
              value={deleteUsername}
              onChange={(e) => setDeleteUsername(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded mb-3"
            />
            <input
              type="password"
              placeholder="PIN (1234)" 
              value={deletePin}
              onChange={(e) => setDeletePin(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded mb-4"
            />
            
            {deleteError && <p className="text-red-500 text-sm mb-3">{deleteError}</p>}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-slate-700 bg-slate-200 rounded hover:bg-slate-300"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount} 
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-red-300"
                disabled={deleteLoading || deleteUsername !== profile.username || deletePin !== '1234'}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    );
} 