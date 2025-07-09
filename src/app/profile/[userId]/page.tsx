'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase';
import { ShieldAlert, ShieldCheck, Sailboat, Mail, CalendarDays } from 'lucide-react';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface UserProfilePageProps {
  params: {
    userId: string;
  };
}

interface ProfileData {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  bio: string | null;
  is_banned: boolean;
  ban_reason?: string;
  email?: string | null;
  created_at?: string | null;
  is_location_verified?: boolean | null;
  last_seen_at?: string | null;
}

interface CurrentAdminContext {
  id: string | null;
  role: string | null;
  isFetching: boolean;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId: viewedUserId } = params;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdminContext>({ 
    id: null, 
    role: null, 
    isFetching: true 
  });
  const [isBanning, setIsBanning] = useState(false);

  // State for friend requests
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // To be set from currentAdmin.id
  const [friendRequestStatus, setFriendRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected' | 'self'>('none');
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [friendReason, setFriendReason] = useState('');
  const [friendError, setFriendError] = useState('');
  const [friendSuccess, setFriendSuccess] = useState('');

  // State for ban reason
  const [showBanReasonModal, setShowBanReasonModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banError, setBanError] = useState<string | null>(null);

  // Fetch current admin data
  const fetchCurrentAdminData = useCallback(async () => {
    console.log("[ProfilePage] fetchCurrentAdminData: Initiated.");
    console.log("[ProfilePage] RAW DOCUMENT COOKIE (inside fetchCurrentAdminData): " + document.cookie);

    setCurrentAdmin(prevState => ({ ...prevState, isFetching: true }));
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('[ProfilePage] supabase.auth.getUser() response (Step 2):', { authData, authError });

      if (authError) {
        console.error('[ProfilePage] Error from supabase.auth.getUser() (Step 3a):', authError);
        setCurrentAdmin({ id: null, role: null, isFetching: false });
        setCurrentUserId(null); // Ensure currentUserId is also null
        return;
      }

      if (authData && authData.user) {
        const user = authData.user;
        console.log('[ProfilePage] Auth user object found (Step 3b):', user);
        console.log('[ProfilePage] Auth user ID:', user.id);
        setCurrentUserId(user.id); // Set currentUserId here
        
        const { data: adminProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .single();
        console.log('[ProfilePage] Admin profile query response (Step 4):', { adminProfile, profileError });

        if (profileError) {
          console.error('[ProfilePage] Error fetching admin profile from DB (Step 5a):', profileError);
          setCurrentAdmin({ id: user.id, role: null, isFetching: false });
          return;
        }

        if (adminProfile) {
          console.log('[ProfilePage] Admin profile data fetched from DB (Step 5b):', adminProfile);
          setCurrentAdmin({ id: adminProfile.id, role: adminProfile.role, isFetching: false });
        } else {
          console.log('[ProfilePage] No admin profile entry in DB for user ID (Step 5c):', user.id);
          setCurrentAdmin({ id: user.id, role: null, isFetching: false });
        }
      } else {
        console.log('[ProfilePage] No user object in authData from supabase.auth.getUser() (Step 3c).');
        setCurrentAdmin({ id: null, role: null, isFetching: false });
        setCurrentUserId(null); // Ensure currentUserId is also null
      }
    } catch (e: any) {
      console.error('[ProfilePage] fetchCurrentAdminData (Unexpected Error in try-catch block):', e);
      console.error('[ProfilePage] fetchCurrentAdminData (Error name):', e.name);
      console.error('[ProfilePage] fetchCurrentAdminData (Error message):', e.message);
      console.error('[ProfilePage] fetchCurrentAdminData (Error stack):', e.stack);
      setCurrentAdmin({ id: null, role: null, isFetching: false });
      setCurrentUserId(null);
    }
  }, [supabase]);

  useEffect(() => {
    // THIS IS THE MOST IMPORTANT LOG
    console.log("RAW DOCUMENT COOKIE (Profile Page Effect): " + document.cookie);
    // END OF MOST IMPORTANT LOG
    fetchCurrentAdminData();
  }, [fetchCurrentAdminData]);

  const fetchViewedProfile = useCallback(async () => {
    if (!viewedUserId) {
      console.log('[ProfilePage] No viewedUserId, skipping fetch.');
      setLoading(false); // Stop loading if no ID
      return;
    }
    console.log('[ProfilePage] Fetching profile for viewedUserId:', viewedUserId);
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, role, bio, is_banned, ban_reason, email, created_at, is_location_verified, last_seen_at')
        .eq('id', viewedUserId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Profile not found.');
      
      console.log('[ProfilePage] Viewed profile data fetched:', data);
      setProfile(data as ProfileData);
    } catch (err) {
      console.error('[ProfilePage] Error fetching viewed profile:', err);
      setError((err as Error).message);
      setProfile(null);
    }
    setLoading(false);
  }, [viewedUserId, supabase]);

  useEffect(() => {
    fetchViewedProfile();
  }, [fetchViewedProfile]);

  // useEffect to check friend request status
  useEffect(() => {
    if (!currentUserId || !viewedUserId) {
      setFriendRequestStatus('none');
      return;
    }
    if (currentUserId === viewedUserId) {
      setFriendRequestStatus('self');
      return;
    }

    const checkFriendRequest = async () => {
      try {
        // Check if a friend request already exists (either direction)
        // Or if they are already friends
        const { data: requestData, error: requestError } = await supabase
          .from('friend_requests')
          .select('status, user_id, friend_id')
          .or(`and(user_id.eq.${currentUserId},friend_id.eq.${viewedUserId}),and(user_id.eq.${viewedUserId},friend_id.eq.${currentUserId})`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (requestError) {
          setFriendRequestStatus('none');
          return;
        }
        if (requestData && requestData.length > 0) {
          const request = requestData[0];
          if (request.status === 'accepted') {
            setFriendRequestStatus('accepted');
          } else if (request.status === 'pending') {
            if (request.user_id === currentUserId) {
              setFriendRequestStatus('pending');
            } else {
              setFriendRequestStatus('none');
            }
          } else if (request.status === 'rejected') {
            setFriendRequestStatus('none');
          } else {
            setFriendRequestStatus('none');
          }
        }
        // No entry in friend_requests, check friends table directly for an accepted friendship
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('status')
          .eq('user_id', currentUserId)
          .eq('friend_id', viewedUserId)
          .eq('status', 'accepted')
          .limit(1);
        if (friendsError) {
          setFriendRequestStatus('none');
          return;
        }
        if (friendsData && friendsData.length > 0) {
          setFriendRequestStatus('accepted');
        } else {
          setFriendRequestStatus('none');
        }
      } catch (err) {
        setFriendRequestStatus('none');
      }
    };
    checkFriendRequest();
  }, [currentUserId, viewedUserId, supabase]);

  // Friend Request Modal Handlers
  const openFriendModal = () => {
    setFriendReason('');
    setFriendError('');
    setFriendSuccess('');
    setShowFriendModal(true);
  };

  const closeFriendModal = () => {
    setShowFriendModal(false);
    setFriendReason('');
    setFriendError('');
    setFriendSuccess('');
  };

  const handleAddFriend = async () => {
    setFriendError('');
    setFriendSuccess('');
    if (!currentUserId || !viewedUserId) {
      setFriendError('Cannot send request: User information missing.');
      return;
    }
    if (currentUserId === viewedUserId) {
      setFriendError('You cannot send a friend request to yourself.');
      return;
    }
    if (!friendReason.trim()) {
      setFriendError('Please enter a reason for your friend request.');
      return;
    }
    try {
      const { error: insertError } = await supabase.from('friend_requests').insert({
        user_id: currentUserId,
        friend_id: viewedUserId,
        status: 'pending',
        reason: friendReason.trim(),
      });
      if (insertError) {
        if (insertError.code === '23505') {
          setFriendError('A friend request already exists or you are already friends.');
        } else {
          setFriendError('Failed to send friend request. Please try again.');
        }
      } else {
        setFriendSuccess('Friend request sent!');
        setFriendRequestStatus('pending');
        setTimeout(() => {
          closeFriendModal();
        }, 1500);
      }
    } catch (e) {
      setFriendError('An unexpected error occurred.');
    }
  };

  // Handle Ban/Unban User
  const confirmAndExecuteBan = async () => {
    if (!profile) return;
    if (!banReason.trim()) {
      setBanError("Ban reason cannot be empty.");
      return;
    }
    setBanError(null);
    setIsBanning(true);

    try {
      // First update the profile to mark as banned
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          is_banned: true, 
          ban_reason: banReason,
          ban_date: new Date().toISOString() // Record the ban date
        })
        .eq('id', profile.id);
      
      if (updateError) {
        throw updateError;
      }

      // Delete user's posts
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .eq('author_id', profile.id);
      
      if (postsError) {
        console.error("Error deleting posts:", postsError);
      }

      // Delete user's comments
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('author_id', profile.id);
      
      if (commentsError) {
        console.error("Error deleting comments:", commentsError);
      }
      
      // Update profile state to reflect ban locally
      setProfile(prevProfile => prevProfile ? { ...prevProfile, is_banned: true, ban_reason: banReason, ban_date: new Date().toISOString() } : null);
      setShowBanReasonModal(false);
      setBanReason(''); 
      alert(`User ${profile.username} has been banned. Reason: ${banReason}. Account will be permanently deleted after 10 days.`);
    } catch (error: any) {
      console.error('Error processing ban:', error);
      alert(`Failed to ban user: ${error.message}`);
      setBanError(`Failed to ban user: ${error.message}`);
    } finally {
      setIsBanning(false);
    }
  };

  const handleInitiateBan = () => {
    if (!profile) return;
    if (profile.is_banned) { // If already banned, consider unbanning (though user said no unbanning for now)
      // For now, unbanning is not implemented as per user's request.
      // If unbanning were to be implemented, it would NOT call 'full_ban_user_and_delete_data'.
      // It would just set is_banned = false and clear ban_reason.
      alert("This user is already banned. Unbanning functionality is not currently implemented.");
      return;
    }
    setBanError(null);
    setShowBanReasonModal(true);
  };

  // Ban logic (conditionally shown)
  const canAdminManage = currentAdmin.role === 'community admin';
  const showBanButton = canAdminManage && profile && currentAdmin.id !== profile.id;

  // Debug logs before returning
  console.log('[ProfilePage] DEBUG STATE (before render):');
  console.log('  viewedUserId:', viewedUserId);
  console.log('  currentAdmin:', JSON.stringify(currentAdmin));
  console.log('  profile:', profile ? JSON.stringify({id: profile.id, username: profile.username, is_banned: profile.is_banned}) : 'null');
  console.log('  loading (viewed profile):', loading);
  console.log('  currentAdmin.isFetching:', currentAdmin.isFetching);
  console.log('  canAdminManage:', canAdminManage);
  console.log('  showBanButton:', showBanButton);

  if (loading || currentAdmin.isFetching) {
    // Add a specific check for currentAdmin.isFetching to differentiate loading states
    if(currentAdmin.isFetching) console.log('[ProfilePage] Rendering loading screen because currentAdmin.isFetching is true.');
    if(loading) console.log('[ProfilePage] Rendering loading screen because viewed profile loading is true.');
    return <div className="container mx-auto p-4 text-center">Loading profile...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!profile) {
    return <div className="container mx-auto p-4 text-center">Profile not found.</div>;
  }

  // Helper function to check if user is online (similar to UserTooltipDisplay)
  const calculateIsOnline = (userId: string, lastSeenAt?: string | null): boolean => {
    // If this is the current user, always show as online
    if (currentUserId && userId === currentUserId) return true;
    
    if (!lastSeenAt) return false;
    const lastSeenDate = new Date(lastSeenAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeenDate > fiveMinutesAgo;
  };

  const isOnline = calculateIsOnline(profile.id, profile.last_seen_at);

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white shadow-md rounded-lg p-6">
        {profile.is_banned && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center">
            <ShieldAlert size={20} className="mr-2" />
            <span>This user is currently banned.</span>
          </div>
        )}
        <div className="flex flex-col items-center md:flex-row md:items-start justify-between">
          <div className="flex flex-col items-center md:flex-row md:items-start">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.username || 'User avatar'}
                width={150}
                height={150}
                className="rounded-full mr-0 md:mr-6 mb-4 md:mb-0 border-4 border-blue-600"
              />
            ) : (
              <div className="w-36 h-36 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-4xl mb-4 md:mb-0 md:mr-6 border-4 border-blue-600">
                {profile.username ? profile.username.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="text-center md:text-left">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-800">{profile.username || 'User'}</h1>
                <div className={`flex items-center ml-3 text-sm ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                  <Sailboat size={18} className="mr-1.5" />
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                {profile.is_location_verified && (
                  <span title="Verified Resident" className="ml-2">
                    <ShieldCheck size={20} className="text-blue-600" />
                  </span>
                )}
              </div>
              {profile.username && <p className="text-md text-gray-500">@{profile.username}</p>}
              {profile.role && (
                <p className="text-sm text-gray-600 mt-1 bg-gray-100 px-2 py-0.5 rounded inline-block capitalize">
                  {profile.role}
                </p>
              )}
              {profile.is_banned && profile.ban_reason && (
                <p className="text-sm text-red-600 mt-1">
                  Reason: {profile.ban_reason}
                </p>
              )}
              
              {/* Email */}
              {profile.email && (
                <div className="flex items-center text-sm text-gray-600 mt-2">
                  <Mail size={14} className="mr-2 text-blue-600" />
                  <span>{profile.email}</span>
                </div>
              )}
              
              {/* Join date */}
              {profile.created_at && (
                <div className="flex items-center text-sm text-gray-600 mt-2">
                  <CalendarDays size={14} className="mr-2 text-blue-600" />
                  <span>
                    Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Action Buttons Container */}
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            {/* Friend Request Button */}
            {friendRequestStatus !== 'self' && profile && (
              <button
                onClick={openFriendModal}
                disabled={friendRequestStatus === 'pending' || friendRequestStatus === 'accepted'}
                className="px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {friendRequestStatus === 'pending' && 'Request Sent'}
                {friendRequestStatus === 'accepted' && 'Friends'}
                {friendRequestStatus === 'none' && 'Add Friend'}
                {/* 'rejected' status will also show 'Add Friend' based on current logic */}
              </button>
            )}

            {/* Ban User Button */}
            {showBanButton && (
              <button
                onClick={handleInitiateBan}
                disabled={isBanning}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors 
                            ${profile.is_banned 
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'}
                            disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isBanning ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : profile.is_banned ? 'User Banned' : 'Ban User'}
              </button>
            )}
          </div>
        </div>
        
        {/* Friend Request Modal */}
        {showFriendModal && friendRequestStatus !== 'self' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Send Friend Request to {profile?.username || 'User'}</h3>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Reason for friend request (optional, but nice!)"
                value={friendReason}
                onChange={e => setFriendReason(e.target.value)}
                rows={3}
                maxLength={300}
                autoFocus
              />
              {friendError && <div className="text-red-500 text-sm mb-3 p-2 bg-red-100 rounded-md">{friendError}</div>}
              {friendSuccess && <div className="text-green-600 text-sm mb-3 p-2 bg-green-100 rounded-md">{friendSuccess}</div>}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={closeFriendModal}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFriend}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={!friendReason.trim() && !friendSuccess} // Disable if no reason OR if already successful to prevent resend
                >
                  {friendSuccess ? 'Sent!' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ban Reason Modal */}
        {showBanReasonModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Reason for Banning {profile?.username}</h3>
              <textarea
                value={banReason}
                onChange={(e) => {
                  setBanReason(e.target.value);
                  if (banError && e.target.value.trim()) {
                    setBanError(null);
                  }
                }}
                placeholder="Enter reason for ban..."
                className="w-full p-2 border border-gray-300 rounded-md h-24 bg-white text-gray-900 placeholder-gray-500"
              />
              {banError && <p className="text-red-500 text-sm mt-2">{banError}</p>}
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowBanReasonModal(false);
                    setBanReason('');
                    setBanError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndExecuteBan}
                  disabled={isBanning || !banReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBanning ? 'Banning...' : 'Confirm Ban'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {profile.bio && (
        <div className="mt-6 border-t pt-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Bio</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
        </div>
      )}
       {/* Placeholder for user's posts or other content */}
    </div>
  );
} 