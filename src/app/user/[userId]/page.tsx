"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import Image from 'next/image';
import { UserCircle2 } from 'lucide-react';
import FeedPostItem from '@/components/feed/FeedPostItem';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [profile, setProfile] = useState<{ username: string; avatar_url?: string } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
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
        .eq('postAuthorUserId', userId)
        .order('timestamp', { ascending: false });
      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } else {
        setPosts(data || []);
      }
    };

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchPosts()]);
      setLoading(false);
    };

    loadData();
  }, [userId, supabase]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return <div className="flex justify-center items-center min-h-screen">User not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={`${profile.username}'s avatar`} width={80} height={80} className="rounded-full mr-4" />
          ) : (
            <UserCircle2 className="w-20 h-20 text-gray-400 dark:text-gray-500 mr-4" />
          )}
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{profile.username}</h1>
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Past Posts</h2>
      {posts.length > 0 ? (
        posts.map(post => (
          <FeedPostItem
            key={post.id}
            id={post.id}
            postAuthorUserId={post.postAuthorUserId}
            authorName={post.authorName}
            authorAvatarUrl={post.authorAvatarUrl}
            timestamp={post.timestamp}
            title={post.title}
            textContent={post.textContent}
            updated_at={post.updated_at}
            imageUrl={post.imageUrl}
            poll_id={post.poll_id}
            is_pinned={post.is_pinned}
            likeCount={post.likeCount}
            commentCount={post.commentCount}
            isLikedByCurrentUser={post.isLikedByCurrentUser}
            onToggleLike={async () => {}}
            fetchComments={async () => []}
            onCommentSubmit={async () => true}
            supabaseClient={supabase}
            post_type={post.post_type}
            event_start_time={post.event_start_time}
            event_end_time={post.event_end_time}
            event_location_text={post.event_location_text}
            event_description={post.event_description}
            images={post.images}
            video_url={post.video_url}
          />
        ))
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No posts found.</p>
      )}
    </div>
  );
} 