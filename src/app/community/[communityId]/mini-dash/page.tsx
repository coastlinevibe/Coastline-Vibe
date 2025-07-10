"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { UserCircle2, ShieldCheck, MessageSquare, Heart, Sailboat, Store, ExternalLink } from 'lucide-react';
import LocationVerificationForm from '@/components/profile/LocationVerificationForm';

// Define a simplified Profile type for this page's needs
interface Profile {
  id: string;
  username: string;
  community_id: string | null;
  is_admin: boolean | null;
  avatar_url?: string;
  email?: string;
  bio?: string;
  role?: string;
  created_at?: string;
  is_location_verified: boolean;
  is_online?: boolean;
}

// Define a more generic NotificationItem interface
interface GenericNotification {
  id: string;
  type: 'mention' | 'post_like' | 'new_comment' | 'PROPERTY_INQUIRY' | 'MARKET_INTERACTION' | 'BUSINESS_INTERACTION' | 'FRIEND_REQUEST' | string;
  actor: any; // Changed from specific type to any to match the data structure
  target_entity_id: string | null;
  target_entity_type: string | null;
  target_entity_title?: string | null;
  content_snippet?: string | null;
  created_at: string;
  is_read: boolean;
  community_id: string | null;
}

export default function MiniDashPage() {
  const params = useParams();
  const communityId = typeof params?.communityId === 'string' ? params.communityId : null;
  const [communityUuid, setCommunityUuid] = useState<string | null>(null);
  const [communitySlug, setCommunitySlug] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [notifications, setNotifications] = useState<GenericNotification[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [userVerificationRequestStatus, setUserVerificationRequestStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [isVerificationFormVisible, setIsVerificationFormVisible] = useState(false);
  const isAdmin = profile?.role === 'community admin';
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [isActivityCollapsed, setIsActivityCollapsed] = useState<boolean>(true);
  const [isNotificationsCollapsed, setIsNotificationsCollapsed] = useState<boolean>(true);
  const [members, setMembers] = useState<any[]>([]);
  const [membersCollapsed, setMembersCollapsed] = useState(true);
  
  // Fetch basic user and community data
  useEffect(() => {
    async function fetchBasicData() {
      if (!communityId) return;
      setLoading(true);
      setError(null);
      
      try {
        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setError('Not logged in');
          setLoading(false);
          router.push('/login');
          return;
        }
        
        // Get community info
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isUuid = uuidPattern.test(communityId);

        let query = supabase.from('communities').select('id, name, slug');
        if (isUuid) {
          query = query.eq('id', communityId);
        } else {
          query = query.eq('slug', communityId);
        }
        
        const { data: communityData, error: communityError } = await query.single();
        
        if (communityError) {
          console.error(`Error fetching community: ${communityError.message}`);
          setError(`Community '${communityId}' not found or error loading.`);
        } else if (communityData) {
          setCommunityUuid(communityData.id);
          setCommunitySlug(communityData.slug);
          
          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, community_id, is_admin, avatar_url, email, bio, role, created_at, is_location_verified')
            .eq('id', authUser.id)
            .single();
            
          if (profileError) {
            console.error("Profile fetch error:", profileError);
            setProfile(null);
          } else if (profileData) {
            // Augment profile with online status
            setProfile({
              ...profileData,
              is_online: true,
            } as Profile);
            
            // Check verification status
            const { data: verificationData } = await supabase
              .from('location_verifications')
              .select('status')
              .eq('user_id', authUser.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
              
            if (verificationData) {
              setUserVerificationRequestStatus(verificationData.status as any);
            }
            
            // Fetch friend requests
            fetchPendingRequests(authUser.id);
            
            // Fetch notifications
            fetchNotifications(authUser.id, communityData.id);
            
            // Fetch activity
            fetchUserActivity(authUser.id, communityData.id);
            
            // Fetch community members
            fetchCommunityMembers(communityData.id);
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError('Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchBasicData();
  }, [communityId, router, supabase]);
  
  // Fetch pending friend requests
  const fetchPendingRequests = async (userId: string) => {
    setPendingLoading(true);
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          reason,
          created_at,
          profiles:user_id (username, avatar_url)
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'pending');
        
      if (error) throw error;
      setPendingRequests(data || []);
    } catch (err) {
      console.error("Error fetching friend requests:", err);
      setPendingError("Could not load friend requests");
    } finally {
      setPendingLoading(false);
    }
  };
  
  // Fetch user notifications
  const fetchNotifications = async (userId: string, communityId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id, type, actor:actor_id (id, username, avatar_url),
          target_entity_id, target_entity_type, target_entity_title,
          content_snippet, created_at, is_read, community_id
        `)
        .eq('recipient_id', userId)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      setNotifications(data as GenericNotification[] || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };
  
  // Fetch user activity
  const fetchUserActivity = async (userId: string, communityId: string) => {
    try {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, title, content, created_at, type')
        .eq('user_id', userId)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (postsError) throw postsError;
      
      const formattedActivity = posts.map(post => ({
        id: post.id,
        type: 'post',
        title: post.title || 'Untitled Post',
        content: post.content,
        created_at: post.created_at
      }));
      
      setActivity(formattedActivity || []);
    } catch (err) {
      console.error("Error fetching user activity:", err);
    }
  };
  
  // Fetch community members
  const fetchCommunityMembers = async (communityId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_online, role')
        .eq('community_id', communityId)
        .order('is_online', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error("Error fetching community members:", err);
    }
  };
  
  // Handle verification success
  const handleVerificationSubmitSuccess = () => {
    setUserVerificationRequestStatus('pending');
    setIsVerificationFormVisible(false);
  };
  
  // Handle verification cancel
  const handleVerificationCancel = () => {
    setIsVerificationFormVisible(false);
  };
  
  // Handle cancel friend request
  async function handleCancelRequest(requestId: string) {
    setCancelLoading(requestId);
    try {
      await supabase.from('friend_requests').delete().eq('id', requestId);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } finally {
      setCancelLoading(null);
    }
  }
  
  // Handle accept friend request
  async function handleAcceptFriendRequest(requestId: string, userId: string, friendId: string) {
    if (!profile) return;
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  }
  
  // Handle reject friend request
  async function handleRejectFriendRequest(requestId: string) {
    if (!profile) return;
    await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  }

  // Helper function to get avatar URL
  const getAvatarUrl = (username: string | null | undefined, avatarUrl: string | null | undefined) => {
    if (avatarUrl) return avatarUrl;
    const name = username || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
  
  return (
    <div className="min-h-screen bg-slate-100">
      <main className="container mx-auto p-4 pt-20">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-lg shadow-lg mb-6">
          <h1 className="text-3xl font-bold text-center">
            Welcome to {communitySlug ? communitySlug.charAt(0).toUpperCase() + communitySlug.slice(1) : 'Your Community'}
          </h1>
          <p className="text-center mt-2">Discover local businesses and connect with your community</p>
        </div>
        
        {/* Main Content in Single Column */}
        <div className="max-w-3xl mx-auto space-y-6">
          {/* User Profile Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="relative group flex items-center space-x-4 mb-4">
              <Image 
                src={profile.avatar_url || getAvatarUrl(profile.username, null)} 
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
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4">
              {isAdmin && communityUuid && (
                <Link href={`/community/${communityUuid}/admin`} className="flex-grow">
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out shadow-md">
                    Admin Dashboard
                  </button>
                </Link>
              )}
              
              {/* Edit Profile Button */}
              <Link href="/profile/edit" className="flex-grow">
                <button className="w-full bg-transparent hover:bg-primaryTeal text-primaryTeal hover:text-offWhite font-semibold py-2 px-4 border-2 border-primaryTeal rounded-lg transition duration-150 ease-in-out">
                  Edit Profile
                </button>
              </Link>
              
              {/* Directory Link Button */}
              {communitySlug && (
                <Link href={`/community/${communitySlug}/business/directory`} className="flex-grow">
                  <button className="w-full bg-primaryTeal hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out shadow-md flex items-center justify-center">
                    <Store className="mr-2 h-4 w-4" />
                    Directory
                  </button>
                </Link>
              )}
            </div>
            
            {/* Verification Status */}
            {!profile.is_location_verified && userVerificationRequestStatus === 'pending' && (
              <p className="text-sm text-yellow-600 bg-yellow-100 p-2 rounded-md mt-3">Location Verification Pending</p>
            )}
            
            {!profile.is_location_verified && userVerificationRequestStatus === 'rejected' && (
              <div className="p-2 bg-red-100 rounded-md mt-3">
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
                className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-150"
              >
                Verify My Location
              </button>
            )}
            
            {profile.is_location_verified && (
              <p className="text-sm text-green-600 bg-green-100 p-2 rounded-md mt-3">Verified Resident</p>
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
          
          {/* Notifications Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Notifications</h2>
              <button 
                onClick={() => setIsNotificationsCollapsed(!isNotificationsCollapsed)}
                className="text-slate-500 hover:text-slate-700"
              >
                {isNotificationsCollapsed ? '▼' : '▲'}
              </button>
            </div>
            
            {!isNotificationsCollapsed && (
              <div className="space-y-2">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div key={notification.id} className="flex items-start p-2 border-b">
                      <div className="mr-3">
                        <Image 
                          src={notification.actor?.avatar_url || getAvatarUrl(notification.actor?.username, null)} 
                          alt={notification.actor?.username || 'User'} 
                          width={40} 
                          height={40} 
                          className="rounded-full" 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-semibold">{notification.actor?.username || 'Someone'}</span>
                          <span className="text-xs text-slate-500">{formatDate(notification.created_at)}</span>
                        </div>
                        <p className="text-sm">
                          {notification.type === 'mention' && 'mentioned you in a post.'}
                          {notification.type === 'post_like' && 'liked your post.'}
                          {notification.type === 'new_comment' && 'commented on your post.'}
                          {notification.type === 'FRIEND_REQUEST' && 'sent you a friend request.'}
                          {notification.content_snippet && (
                            <span className="text-xs block text-slate-500 mt-1">"{notification.content_snippet}"</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500">No notifications yet.</p>
                )}
              </div>
            )}
          </div>
          
          {/* Recent Activity Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Recent Activity</h2>
              <button 
                onClick={() => setIsActivityCollapsed(!isActivityCollapsed)}
                className="text-slate-500 hover:text-slate-700"
              >
                {isActivityCollapsed ? '▼' : '▲'}
              </button>
            </div>
            
            {!isActivityCollapsed && (
              <div className="space-y-2">
                {activity.length > 0 ? (
                  activity.map(item => (
                    <div key={item.id} className="p-2 border-b">
                      <div className="flex justify-between">
                        <span className="font-semibold">{item.title}</span>
                        <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span>
                      </div>
                      {item.content && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.content}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500">No recent activity.</p>
                )}
              </div>
            )}
          </div>
          
          {/* Pending Friend Requests Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Pending Friend Requests</h2>
            {pendingLoading && <p>Loading requests...</p>}
            {pendingError && <p className="text-red-500">{pendingError}</p>}
            {pendingRequests.length > 0 ? (
              <ul className="space-y-2">
                {pendingRequests.map(req => (
                  <li key={req.id} className="flex items-center justify-between p-2 border-b">
                    <div className="flex items-center space-x-2">
                      <Image 
                        src={req.profiles?.avatar_url || getAvatarUrl(req.profiles?.username, null)} 
                        alt={req.profiles?.username || 'User'} 
                        width={32} 
                        height={32} 
                        className="rounded-full" 
                      />
                      <div>
                        <span>{req.profiles?.username || 'A user'}</span>
                        {req.reason && (
                          <div className="text-xs text-slate-500 mt-1 max-w-xs break-words">
                            Reason: {req.reason}
                          </div>
                        )}
                      </div>
                    </div>
                    {profile && req.user_id === profile.id && (
                      <button
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                        onClick={() => handleCancelRequest(req.id)}
                        disabled={cancelLoading === req.id}
                      >
                        {cancelLoading === req.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                    {profile && req.friend_id === profile.id && (
                      <div className="flex gap-2">
                        <button
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded"
                          onClick={() => handleAcceptFriendRequest(req.id, req.user_id, req.friend_id)}
                        >
                          Accept
                        </button>
                        <button
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                          onClick={() => handleRejectFriendRequest(req.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">No pending friend requests.</p>
            )}
          </div>
          
          {/* Community Members Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Community Members</h2>
              <div className="flex items-center gap-2">
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded text-sm">
                  Show
                </button>
                <button 
                  onClick={() => setMembersCollapsed(!membersCollapsed)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  {membersCollapsed ? '▼' : '▲'}
                </button>
              </div>
            </div>
            
            {!membersCollapsed && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-2 p-2 border rounded-lg">
                    <div className="relative">
                      <Image 
                        src={member.avatar_url || getAvatarUrl(member.username, null)} 
                        alt={member.username || 'User'} 
                        width={36} 
                        height={36} 
                        className="rounded-full" 
                      />
                      {member.is_online && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm truncate">{member.username}</p>
                      <p className="text-xs text-slate-500">{member.role || 'Resident'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 