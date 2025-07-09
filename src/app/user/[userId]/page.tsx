"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import { UserCircle2 } from 'lucide-react';
import FeedPostItem from '@/components/feed/FeedPostItem';
import Link from 'next/link';

export default function UserProfilePage() {
  const params = useParams();
  let userId: string | null = null;
  let communityId: string | null = null;
  if (params && typeof params === 'object') {
    if ('userId' in params && params.userId) {
      userId = params.userId as string;
    }
    if ('communityId' in params && params.communityId) {
      if (Array.isArray(params.communityId)) {
        communityId = params.communityId[0];
      } else {
        communityId = params.communityId as string;
      }
    }
  }
  if (!communityId) {
    communityId = 'miami';
  }
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [profile, setProfile] = useState<{ username: string; avatar_url?: string; email?: string; bio?: string; role?: string } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendRequestStatus, setFriendRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected' | 'self'>('none');
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [friendReason, setFriendReason] = useState('');
  const [friendError, setFriendError] = useState('');
  const [friendSuccess, setFriendSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, email, bio, role')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    };

    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('community_feed_view')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } else {
        setPosts(data || []);
      }
    };

    const fetchCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data?.user?.id || null);
    };

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchPosts(), fetchCurrentUser()]);
      setLoading(false);
    };

    loadData();
  }, [userId, supabase]);

  useEffect(() => {
    if (!currentUserId || !userId) return;
    if (currentUserId === userId) {
      setFriendRequestStatus('self');
      return;
    }
    // Check if a friend request already exists
    const checkFriendRequest = async () => {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('status')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`)
        .limit(1);
      if (data && data.length > 0) {
        setFriendRequestStatus(data[0].status);
      } else {
        setFriendRequestStatus('none');
      }
    };
    checkFriendRequest();
  }, [currentUserId, userId, supabase]);

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
    if (!currentUserId || !userId) return;
    if (!friendReason.trim()) {
      setFriendError('Please enter a reason for your friend request.');
      return;
    }
    setFriendRequestStatus('pending');
    const { error } = await supabase.from('friend_requests').insert({
      user_id: currentUserId,
      friend_id: userId,
      status: 'pending',
      reason: friendReason.trim(),
    });
    if (error) {
      setFriendRequestStatus('none');
      setFriendError('Failed to send friend request.');
    } else {
      setFriendRequestStatus('pending');
      setFriendSuccess('Friend request sent!');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!profile || !userId) {
    return <div className="flex justify-center items-center min-h-screen">User not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={`${profile.username}'s avatar`} width={80} height={80} className="rounded-full mr-4" />
            ) : (
              <UserCircle2 className="w-20 h-20 text-gray-400 mr-4" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{profile.username}</h1>
              {profile.role && <div className="text-sm text-cyan-700 font-semibold mt-1">{profile.role}</div>}
              {profile.email && <div className="text-sm text-gray-500">{profile.email}</div>}
              {profile.bio && <div className="text-sm text-gray-600 mt-1">{profile.bio}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold shadow transition disabled:opacity-60"
              onClick={openFriendModal}
              disabled={friendRequestStatus !== 'none'}
            >
              {friendRequestStatus === 'pending' && 'Request Sent'}
              {friendRequestStatus === 'accepted' && 'Friends'}
              {friendRequestStatus === 'rejected' && 'Rejected'}
              {friendRequestStatus === 'self' && 'This is you'}
              {friendRequestStatus === 'none' && 'Add Friend'}
            </button>
            {communityId && (
              <Link
                href={`/community/${communityId}/feed`}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold shadow transition"
              >
                Back to Feed
              </Link>
            )}
          </div>
          {/* Friend Request Modal */}
          {showFriendModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center">
                <h3 className="text-lg font-semibold mb-2">Send Friend Request</h3>
                <textarea
                  className="w-full border rounded px-2 py-1 text-sm mb-2"
                  placeholder="Reason for friend request..."
                  value={friendReason}
                  onChange={e => setFriendReason(e.target.value)}
                  rows={3}
                  maxLength={300}
                  autoFocus
                />
                {friendError && <div className="text-red-500 text-sm mb-2">{friendError}</div>}
                {friendSuccess && <div className="text-green-600 text-sm mb-2">{friendSuccess}</div>}
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={closeFriendModal}
                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >Cancel</button>
                  <button
                    onClick={async () => {
                      await handleAddFriend();
                      if (!friendError && !friendSuccess) return;
                      if (friendSuccess) setTimeout(() => { closeFriendModal(); }, 1200);
                    }}
                    className="px-4 py-2 rounded bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-60"
                    disabled={!friendReason.trim()}
                  >Send</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Past Posts</h2>
      {posts.length > 0 ? (
        posts.map(post => (
          <FeedPostItem
            key={post.id}
            id={post.id}
            postAuthorUserId={post.user_id}
            currentUserId={currentUserId}
            authorName={post.author_username || 'Unknown'}
            authorAvatarUrl={post.author_avatar_url}
            timestamp={post.created_at}
            title={post.title}
            textContent={post.content}
            updated_at={post.updated_at}
            imageUrl={post.image_url}
            poll_id={post.poll_id}
            is_pinned={post.is_pinned}
            likeCount={post.like_count || 0}
            commentCount={post.comment_count || 0}
            isLikedByCurrentUser={post.is_liked_by_current_user}
            onToggleLike={async () => {}}
            fetchComments={async () => []}
            onCommentSubmit={async () => true}
            onDeletePost={async () => {}}
            onUpdatePost={async () => false}
            onTogglePin={async () => false}
            onActualDeleteComment={async () => false}
            onActualUpdateComment={async () => false}
            onReplySubmit={async () => false}
            onLikeComment={async () => {}}
            onUnlikeComment={async () => {}}
            post_type={post.post_type}
            communityId={post.community_id}
            event_start_time={post.event_start_time}
            event_end_time={post.event_end_time}
            event_location_text={post.event_location_text}
            event_description={post.event_description}
            images={post.images}
            video_url={post.video_url}
          />
        ))
      ) : (
        <p className="text-gray-500">No posts found.</p>
      )}
    </div>
  );
} 