'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createBrowserClient } from '@supabase/ssr';
import type { Database, TablesInsert } from '@/types/supabase';
import FeedPostItem, { type FeedPostItemProps as ActualFeedPostItemProps } from '@/components/feed/FeedPostItem';
import { type CommentItemProps } from '@/components/feed/CommentItem';
import { PlusCircle, Image as ImageIcon, AlertCircle, Loader2, MessageCircle, XSquare } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import ImageNext from 'next/image';
import HashtagInput from '@/components/shared/HashtagInput';
import FeedFilterSortBar, { 
  type FeedFilters, 
  type FeedSortOption 
} from '@/components/feed/FeedFilterSortBar';
import PostToolbar, { type PostType as ActualPostType, type ActivePostType } from '@/components/PostToolbar';
import CreatePollModal, { type PollFormValues } from '@/components/modals/CreatePollModal';
import type { PostType } from '@/components/PostToolbar'; // Make sure this import is correct
// Import the new admin post form components
import AskPostForm from '@/components/feed/AskPostForm';
import AnnouncePostForm from '@/components/feed/AnnouncePostForm';
import EventPostForm from '@/components/feed/EventPostForm';
import PollPostForm from '@/components/feed/PollPostForm';
import type { AskPostFormValues } from '@/components/feed/AskPostForm';
import type { AnnouncePostFormValues } from '@/components/feed/AnnouncePostForm';
import type { EventPostFormValues } from '@/components/feed/EventPostForm';
import type { PollPostFormValues } from '@/components/feed/PollPostForm';

// Define a more specific type for posts coming from the view
type CommunityFeedViewRow = Database["public"]["Views"]["community_feed_view"]["Row"] & {
  is_pinned?: boolean;
};

// Type for inserting a new post, reflecting the actual columns we set
interface NewPostInsert {
  user_id: string;
  community_id: string; // UUID
  type: ActualPostType | 'comment' | 'general'; // MODIFIED: Added 'general'
  title?: string | null;
  content?: string | null;
  images?: string[] | null;
  hashtags?: string[] | null;
  mentioned_user_ids?: string[] | null;
  is_visible?: boolean;
  // For polls, these will be set in a separate table
  // For events, similar
  // parent_post_id and depth for comments/threading
  parent_post_id?: string | null;
  depth?: number | null;
  video_url?: string | null;
}

// Update PostData to include postAuthorUserId and currentUserId, exclude onDeletePost handler for now
// Also exclude supabaseClient as it's added at render time
// Add post_type and ensure poll_id is string | null. Remove isLikedByCurrentUser for now.
type PostData = Omit<ActualFeedPostItemProps, 'onToggleLike' | 'fetchComments' | 'onCommentSubmit' | 'supabaseClient' | 'onTogglePin'> & {
  postAuthorUserId: string;
  post_type: ActualPostType | 'general';
  isLikedByCurrentUser: boolean;
  poll_id: string | null;
  is_pinned: boolean;
  title?: string | null;
  event_start_time?: string | null;
  event_location?: string | null;
  event_description?: string | null;
};

// Form values for creating a new post
interface FeedPostFormValues {
  title: string;
  textContent: string;
  imageFile?: FileList | null; // allow multiple
  videoFile?: FileList | null; // add videoFile
}

// ADD new interface for Announcement form values (can be same as FeedPostFormValues for now)
interface AnnouncementFormValues extends FeedPostFormValues {}

// Interface for Event form values
interface EventFormValues extends FeedPostFormValues {
  event_start_time: string; // ISO string or a format that <input type="datetime-local"> provides
  event_end_time: string;
  location_text: string;
}

const FEED_IMAGES_BUCKET = 'feedpostimages';
const FEED_VIDEOS_BUCKET = 'feedpostvideos';
const FEED_POST_LIKES_TABLE: keyof Database["public"]["Tables"] = 'feed_post_likes';
const FEED_POSTS_TABLE: keyof Database["public"]["Tables"] = 'posts';
const COMMENT_LIKES_TABLE = 'comment_likes' as const;
const PROFILES_TABLE: keyof Database["public"]["Tables"] = 'profiles';

interface Filters {
  searchTerm: string;
  sortBy: 'newest' | 'oldest' | 'most_liked' | 'most_commented';
  hashtags: string[]; // Changed from hashtag: string to string[]
  postType: PostType | 'all';
}

const POSTS_PER_PAGE = 10; // Define if not already defined

export default function CommunityFeedPage() {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const params = useParams();
  const communityId = params.communityId as string;
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [fetchPostsError, setFetchPostsError] = useState<string | null>(null); // <<< Define fetchPostsError state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);

  // State for current community UUID
  const [currentCommunityUuid, setCurrentCommunityUuid] = useState<string | null>(null);
  // State for current user's admin status
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState<boolean>(false); // ADDED: State for admin status

  // State for Post Type
  const [postType, setPostType] = useState<ActivePostType>(null); // MODIFIED: Initialize to null

  // ADD THIS STATE DECLARATION:
  const [communityUniqueHashtags, setCommunityUniqueHashtags] = useState<string[]>([]);

  // State for Feed Filtering and Sorting
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    sortBy: 'newest',
    hashtags: [], // Initialize as empty array
    postType: 'all',
  });

  // State for Create Poll Modal
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FeedPostFormValues>({
    defaultValues: {
      title: '',
      textContent: '',
      imageFile: null,
      videoFile: null, // add videoFile
    }
  });
  const selectedFile = watch("imageFile");
  const selectedVideo = watch("videoFile");
  const [postVideoPreview, setPostVideoPreview] = useState<string | null>(null);

  // Create a separate form instance for announcements if fields differ significantly or to manage separate states
  // For now, we can reuse if structure is identical, but let's prepare for separation:
  const announcementFormMethods = useForm<AnnouncementFormValues>({
    defaultValues: {
      title: '',
      textContent: '',
      imageFile: null,
    }
  });
  const announcementSelectedFile = announcementFormMethods.watch("imageFile");
  const [announcementPostImagePreview, setAnnouncementPostImagePreview] = useState<string | null>(null);

  // Form instance for Events
  const eventFormMethods = useForm<EventFormValues>({
    defaultValues: {
      title: '',
      textContent: '',
      imageFile: null,
      event_start_time: '',
      event_end_time: '',
      location_text: '',
    }
  });
  const eventSelectedFile = eventFormMethods.watch("imageFile");
  const [eventPostImagePreview, setEventPostImagePreview] = useState<string | null>(null);

  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Add a separate useForm instance for the Ask post form
  const askFormMethods = useForm<FeedPostFormValues>({
    defaultValues: {
      title: '',
      textContent: '',
      imageFile: null,
    }
  });

  // Helper function to parse @mentions from text and get user IDs
  const parseMentions = useCallback(async (text: string): Promise<string[]> => {
    if (!text) return [];
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const usernames = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      usernames.push(match[1]);
    }
    if (usernames.length === 0) return [];
    try {
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .select('id, username')
        .in('username', usernames);

      if (error) {
        console.error("Error fetching mentioned user IDs:", error);
        return [];
      }

      // Use 'as unknown as ExpectedType' for robust type assertion after error checking.
      const profiles = data as unknown as ({ id: string; username: string | null; }[] | null);

      if (profiles && profiles.length > 0) {
        return profiles.map((profile) => profile.id);
      }
      return [];
    } catch (e) {
      const err = e as Error;
      console.error("Exception fetching mentioned user IDs:", err);
      return [];
    }
  }, [supabase]);

  // Helper function to parse #hashtags from text
  const parseHashtags = useCallback((text: string): string[] => {
    if (!text) return [];
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(hashtagRegex);
    if (!matches) return [];
    return Array.from(new Set(matches.map(tag => tag.substring(1))));
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;
    console.log("Selected file changed (main form):", selectedFile);
    if (selectedFile && selectedFile.length > 0) {
      objectUrl = URL.createObjectURL(selectedFile[0]);
      setPostImagePreview(objectUrl);
    } else {
      setPostImagePreview(null);
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedFile]);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (announcementSelectedFile && announcementSelectedFile.length > 0) {
      objectUrl = URL.createObjectURL(announcementSelectedFile[0]);
      setAnnouncementPostImagePreview(objectUrl);
    } else {
      setAnnouncementPostImagePreview(null);
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setAnnouncementPostImagePreview(null);
      }
    };
  }, [announcementSelectedFile]);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (eventSelectedFile && eventSelectedFile.length > 0) {
      objectUrl = URL.createObjectURL(eventSelectedFile[0]);
      setEventPostImagePreview(objectUrl);
    } else {
      setEventPostImagePreview(null);
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setEventPostImagePreview(null);
      }
    };
  }, [eventSelectedFile]);

  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user && user.id) {
        // Fetch profile to check for admin status
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching user profile for admin check:", profileError);
          setIsCurrentUserAdmin(false); // Default to false if profile fetch fails
        } else if (profileData) {
          setIsCurrentUserAdmin(profileData.is_admin || false);
        }
      }
    };
    getUserAndProfile();
  }, [supabase]);

  // Fetch current community UUID based on slug from params
  useEffect(() => {
    if (communityId && supabase) { // communityId is the slug from params
      const fetchCommunityDetails = async () => {
        setSubmitError(null); // Clear previous errors
        try {
          const { data, error } = await supabase
            .from('communities')
            .select('id')
            .eq('name', communityId as string) 
            .single();
          if (error) throw error;
          if (data) {
            setCurrentCommunityUuid(data.id);
          } else {
            console.error('Community not found by slug:', communityId);
            setSubmitError(`Community '${communityId}' not found.`);
            // Consider redirecting or disabling posting if community UUID can't be found
          }
        } catch (error) {
          const e = error as Error;
          console.error('Failed to fetch community UUID:', e);
          setSubmitError(`Error fetching community details: ${e.message}`);
        }
      };
      fetchCommunityDetails();
    }
  }, [communityId, supabase]);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (selectedVideo && selectedVideo.length > 0) {
      objectUrl = URL.createObjectURL(selectedVideo[0]);
      setPostVideoPreview(objectUrl);
    } else {
      setPostVideoPreview(null);
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedVideo]);

  const fetchFeedPosts = useCallback(async (
    communityId: string,
    currentUserIdForLikes: string | null, // Renamed to avoid conflict if currentUser is also a param
    currentFilters: Filters,
    pageToFetch: number,
    pageSize: number
  ): Promise<{ posts: PostData[], totalCount: number, error?: string }> => {
    console.log('[FETCH_POSTS] Called with page:', pageToFetch, 'Filters:', currentFilters);
    if (!supabase) {
      console.error("Supabase client not available in fetchFeedPosts");
      return { posts: [], totalCount: 0, error: "Supabase client not available." };
    }

    try {
      let query = supabase
        .from('community_feed_view')
        .select('*', { count: 'exact' })
        .eq('community_id', communityId)
        .not('type', 'eq', 'comment'); // Exclude comments from feed

      // Apply search term filter (searches title and content)
      if (currentFilters.searchTerm) {
        query = query.or(`title.ilike.%${currentFilters.searchTerm}%,content.ilike.%${currentFilters.searchTerm}%`);
      }

      // Apply hashtag filter
      if (currentFilters.hashtags && currentFilters.hashtags.length > 0) { 
        // NEW LOGIC (OR): Use .overlaps to find posts that have ANY of the selected hashtags.
        query = query.overlaps('hashtags', currentFilters.hashtags);
      }
      
      // Apply post type filter
      if (currentFilters.postType && currentFilters.postType !== 'all') {
        query = query.eq('post_type', currentFilters.postType);
      }


// Always show pinned posts first, then apply the selected sort
      switch (currentFilters.sortBy) {
        case 'oldest':
    query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: true });
          break;
        case 'most_liked':
    query = query.order('is_pinned', { ascending: false }).order('like_count', { ascending: false });
          break;
        case 'most_commented':
    query = query.order('is_pinned', { ascending: false }).order('comment_count', { ascending: false });
          break;
        case 'newest':
        default:
    query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
          break;
      }

      // Pagination
      const startIndex = (pageToFetch - 1) * pageSize;
      query = query.range(startIndex, startIndex + pageSize - 1);

      const { data: postsData, error, count } = await query;

      if (error) {
        console.error("Error fetching feed posts:", error.message);
        return { posts: [], totalCount: 0, error: error.message };
      }

      const typedViewData = postsData as CommunityFeedViewRow[] | null;
      if (!typedViewData) {
        return { posts: [], totalCount: 0, error: "Unexpected format from server" };
      }

      // Fetch like statuses for the fetched posts
      let likedPostIdsForPage: Set<string> = new Set();
      if (currentUserIdForLikes && typedViewData.length > 0) {
        // Ensure postIds are definitely strings and non-null before using in .in()
        const postIds = typedViewData.map(p => p.id).filter(id => id != null) as string[];
        if (postIds.length > 0) { // Only query if there are valid IDs
          const { data: likesData, error: likesError } = await supabase
            .from('feed_post_likes')
            .select('post_id')
            .eq('user_id', currentUserIdForLikes)
            .in('post_id', postIds); // Now postIds is guaranteed string[]

          if (likesError) {
            console.error("Error fetching likes for page:", likesError);
          } else if (likesData) {
            likesData.forEach(like => likedPostIdsForPage.add(like.post_id));
          }
        }
      }

      const fetchedData: PostData[] = typedViewData.map(post => {
        // Debug: log the post object before skip check
        console.log('Post object before skip:', post);
        // Map correct field names from view
        const postAuthorUserId = post.author_id || post.user_id || post.post_author_user_id;
        const postType = post.type || post.post_type;
        if (!post.id || !postAuthorUserId || !postType) {
          console.warn("Skipping post due to missing id, author id, or type:", post);
          return null; 
        }
        // Ensure post_type is correctly typed before assignment
        const currentPostType = postType as ActualPostType | 'general' | 'comment' | null | undefined;
        if (!currentPostType || !(['ask', 'announce', 'event', 'poll', 'general', 'comment'] as (ActualPostType | 'general' | 'comment')[]).includes(currentPostType)) {
            console.warn("Skipping post due to unrecognized type:", post);
            return null;
        }

        return {
            id: post.id,
            postAuthorUserId: postAuthorUserId,
            authorName: post.author_username || 'Unknown User',
            authorAvatarUrl: post.author_avatar_url,
            timestamp: post.created_at || new Date(0).toISOString(),
            textContent: post.content || '',
            images: post.images || [],
            imageUrl: post.image_url,
            poll_id: postType === 'poll' ? post.id : post.poll_id, // FIX: use post.id for poll posts
            is_pinned: (post as any).is_pinned || false, // Type assertion for is_pinned
            likeCount: post.like_count || 0,
            isLikedByCurrentUser: currentUserIdForLikes ? likedPostIdsForPage.has(post.id) : false, // Populate based on fetched likes
            commentCount: post.comment_count || 0,
            updated_at: post.updated_at || null,
            post_type: currentPostType,
            title: post.title, // Add title from post data
            event_start_time: post.event_start_time,
            event_location: post.event_location,
            event_description: post.event_description,
            video_url: post.video_url,
        };
      }).filter(Boolean) as PostData[];

      // Ensure totalCount is number
      return { posts: fetchedData, totalCount: count ?? 0 };
    } catch (error) {
      const err = error as Error;
      console.error("Error fetching feed posts:", err.message);
      return { posts: [], totalCount: 0, error: err.message };
    }
  }, [supabase]); // Removed userLikes from dependency array as it's not directly used for querying posts

  useEffect(() => {
    if (currentCommunityUuid && currentUser !== undefined) { // Ensure currentUser is resolved
      setIsLoadingPosts(true);
      setFetchPostsError(null); // Clear previous error
      setPosts([]); // Clear existing posts

      fetchFeedPosts(currentCommunityUuid, currentUser ? currentUser.id : null, filters, 1, POSTS_PER_PAGE)
        .then(result => {
          if (result.error) {
            setFetchPostsError(result.error);
            setPosts([]);
          } else {
            // `result.posts` is already PostData[] as returned by `fetchFeedPosts`.
            // No further mapping should be needed here if `fetchFeedPosts` does its job correctly.
            const processedPosts = result.posts; // Assign directly
            setPosts(processedPosts);
            if (result.totalCount !== null) {
              console.log(`[FETCH_POSTS_EFFECT] Total server count: ${result.totalCount}, Fetched: ${processedPosts.length}`);
            }
            setFetchPostsError(null);
          }
        })
        .catch(e => {
          console.error("Error in initial post fetch useEffect:", e);
          setFetchPostsError("Failed to load feed.");
          setPosts([]);
        })
        .finally(() => {
          setIsLoadingPosts(false);
        });
    }
  }, [currentCommunityUuid, currentUser, filters, fetchFeedPosts]);

  useEffect(() => {
    if (!communityId || !supabase) return;
    const channel = supabase
      .channel(`realtime-community-feed-${communityId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `community_id=eq.${communityId}`},
        async (payload) => {
          const newPostRecord = payload.new as Database["public"]["Tables"]["posts"]["Row"];
          if (newPostRecord && newPostRecord.id && newPostRecord.parent_post_id === null) {
            try {
              const { data: viewData, error: viewError } = await supabase
                .from('community_feed_view').select('*').eq('id', newPostRecord.id).single();
              if (viewError) return;
              if (viewData) {
                const typedViewData = viewData as CommunityFeedViewRow;
                if (typedViewData.id && typedViewData.author_id && typedViewData.type) {
                  const newPostForState: PostData = {
                    id: typedViewData.id,
                    postAuthorUserId: typedViewData.author_id,
                    authorName: typedViewData.author_username || 'Unknown User',
                    authorAvatarUrl: typedViewData.author_avatar_url,
                    timestamp: typedViewData.created_at || new Date(0).toISOString(),
                    textContent: typedViewData.content || '',
                    images: typedViewData.images || [],
                    imageUrl: typedViewData.image_url,
                    poll_id: typedViewData.type === 'poll' ? typedViewData.id : typedViewData.poll_id, // FIX: use id for poll posts
                    is_pinned: (typedViewData as any).is_pinned || false, // Type assertion for is_pinned
                    likeCount: typedViewData.like_count || 0,
                    isLikedByCurrentUser: posts.find(p => p.id === typedViewData.id)?.isLikedByCurrentUser || false, // Preserve if already known, else false
                    commentCount: typedViewData.comment_count || 0,
                    updated_at: typedViewData.updated_at || null,
                    post_type: typedViewData.type as ActualPostType | 'general',
                    title: typedViewData.title, // Add title from post data
                    event_start_time: typedViewData.event_start_time,
                    event_location: typedViewData.event_location,
                    event_description: typedViewData.event_description,
                    video_url: typedViewData.video_url,
                  };
                  setPosts(currentPosts => 
                    currentPosts.find(p => p.id === newPostForState.id) ? currentPosts : [newPostForState, ...currentPosts]
                    // Reverted sort for pinning
                  );
                }
              }
            } catch (e) { 
              const err = e as Error; // Type assertion
              console.error("[REALTIME] Exception processing new post:", err); 
            }
          } else if (newPostRecord && newPostRecord.parent_post_id !== null) {
            setPosts(currentPosts => currentPosts.map(p => 
              p.id === newPostRecord.parent_post_id 
              ? { ...p, commentCount: (p.commentCount || 0) + 1 } 
              : p
            ));
          }
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: FEED_POST_LIKES_TABLE }, (payload) => {
        const newLike = payload.new as Database["public"]["Tables"]["feed_post_likes"]["Row"];
        if (newLike && newLike.post_id) {
          setPosts(currentPosts => currentPosts.map(p => {
            if (p.id === newLike.post_id) {
              const newLikeCount = (p.likeCount || 0) + 1;
              // Client-side update for isLikedByCurrentUser
              const likedByCurrentUser = currentUser?.id === newLike.user_id;
              return { ...p, likeCount: newLikeCount, isLikedByCurrentUser: likedByCurrentUser };
            } return p; }) );
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: FEED_POST_LIKES_TABLE }, (payload) => {
        const oldLike = payload.old as Database["public"]["Tables"]["feed_post_likes"]["Row"];
        if (oldLike && oldLike.post_id) {
          setPosts(currentPosts => currentPosts.map(p => {
            if (p.id === oldLike.post_id) {
              const newLikeCount = Math.max(0, (p.likeCount || 0) - 1);
              let likedByCurrentUser = p.isLikedByCurrentUser;
              // If the deleted like was by the current user, set to false
              if (currentUser?.id === oldLike.user_id) { 
                likedByCurrentUser = false; 
              }
              return { ...p, likeCount: newLikeCount, isLikedByCurrentUser: likedByCurrentUser };
            } return p; }) );
        }
      })
      .subscribe();
    return () => { if (channel) { supabase.removeChannel(channel); } };
  }, [supabase, communityId, setPosts, currentUser, fetchFeedPosts]);

  const handleToggleLike = useCallback(async (postId: string) => {
    if (!currentUser) { setActionError("You must be logged in to like posts."); setTimeout(() => setActionError(null), 3000); return; }
    setActionError(null);
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const postToUpdate = posts[postIndex];
    const currentlyLiked = postToUpdate.isLikedByCurrentUser;
    const currentLikeCount = postToUpdate.likeCount;
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, isLikedByCurrentUser: !currentlyLiked, likeCount: currentlyLiked ? Math.max(0, currentLikeCount - 1) : currentLikeCount + 1 } : p));
    try {
      if (currentlyLiked) {
        const { error } = await supabase.from('feed_post_likes').delete().match({ user_id: currentUser.id, post_id: postId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('feed_post_likes').insert({ user_id: currentUser.id, post_id: postId });
        if (error) throw error;
      }
    } catch (error) {
      const e = error as Error;
      setActionError(`Failed to ${currentlyLiked ? 'unlike' : 'like'} post. ${e.message}`);
      setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...postToUpdate } : p ));
      setTimeout(() => setActionError(null), 3000);
    }
  }, [supabase, currentUser, posts, setActionError]);

  const fetchCommentsForPost = useCallback(async (postId: string): Promise<CommentItemProps[]> => {
    if (!currentUser) { console.warn("[COMMENTS] No current user for like status with fetched comments."); }
    console.log(`[COMMENTS] Fetching comments for post ID: ${postId}`);
    
    // Fetch all comments for this post (including replies at any depth)
    const { data: commentData, error: commentError } = await supabase
      .from('posts')
      .select('*')
      .eq('type', 'comment')
      .order('created_at', { ascending: true });

    if (commentError) { 
      console.error(`[COMMENTS] Error fetching comments for post ID ${postId}:`, commentError);
      return []; 
    }
    if (!commentData) return [];
    // Filter comments that are part of this thread (parent_post_id chain leads to postId)
    // We'll include all comments where parent_post_id is the postId or any comment under this post
    // But for now, just pass all comments and let the thread builder handle it
    const commentsData = Array.isArray(commentData) ? commentData : [commentData];
    const commentsWithLikes = await Promise.all(
      commentsData.map(async (comment) => {
        const authorId = comment.author_id || comment.user_id;
        if (!comment.id || !authorId) {
          console.warn("[COMMENTS] Skipping comment due to missing id or author id in like processing:", comment);
          return null;
        }
        let likeCount = 0;
        let isLikedByCurrentUser = false;
        const { count, error: countError } = await supabase
          .from('comment_likes')
          .select('id', { count: 'exact', head: true })
          .eq('comment_id', comment.id);
        if (!countError) likeCount = count || 0;
        if (currentUser && currentUser.id) {
          const { data: userLikeData } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', currentUser.id)
            .maybeSingle();
          isLikedByCurrentUser = !!userLikeData;
        }
        return { 
          id: comment.id,
          authorName: comment.author_username || 'Unknown User',
          authorAvatarUrl: comment.author_avatar_url || null, 
          timestamp: comment.created_at || new Date(0).toISOString(), 
          textContent: comment.content || '', 
          commentAuthorId: authorId, 
          updated_at: comment.updated_at || null, 
          depth: comment.depth === undefined || comment.depth === null ? 1 : Number(comment.depth),
          parent_id: comment.parent_post_id, // This is key for replies
          likeCount: likeCount,
          isLikedByCurrentUser: isLikedByCurrentUser,
        } as CommentItemProps;
      })
    );
    // Only return comments that are part of this post's thread (parent_post_id chain leads to postId)
    // The thread builder will handle nesting
    const finalComments = commentsWithLikes.filter(Boolean) as (CommentItemProps & { replies: any[] })[];
    // Filter to only comments that are in this thread (direct or indirect)
    // We'll keep all comments where parent_post_id is postId or any comment whose ancestor is postId
    // But the thread builder will handle this, so just return all comments for now
    return finalComments;
  }, [supabase, currentUser]);

  const handleLikeCommentCallback = useCallback(async (commentId: string): Promise<void> => {
    console.log(`[LIKE_COMMENT_CB] Attempting to like comment ID: ${commentId}`);
    if (!currentUser) { 
      console.error("[LIKE_COMMENT_CB] User not logged in.");
      setActionError("You must be logged in to like comments."); 
      setTimeout(() => setActionError(null), 3000); 
      return; // Explicitly return to satisfy Promise<void> if error occurs before throw
    }
    console.log(`[LIKE_COMMENT_CB] User ID: ${currentUser.id} liking comment ID: ${commentId}`);
    const { error } = await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: currentUser.id });
    if (error) { 
      console.error(`[LIKE_COMMENT_CB] Failed to like comment ID ${commentId}:`, error);
      setActionError(`Failed to like comment: ${error.message}`); 
      setTimeout(() => setActionError(null), 3000); 
      throw error; 
    }
    console.log(`[LIKE_COMMENT_CB] Successfully liked comment ID: ${commentId}`);
  }, [supabase, currentUser, setActionError]);

  const handleUnlikeCommentCallback = useCallback(async (commentId: string): Promise<void> => {
    console.log(`[UNLIKE_COMMENT_CB] Attempting to unlike comment ID: ${commentId}`);
    if (!currentUser) { 
      console.error("[UNLIKE_COMMENT_CB] User not logged in.");
      setActionError("You must be logged in to unlike comments."); 
      setTimeout(() => setActionError(null), 3000); 
      return; // Explicitly return
    }
    console.log(`[UNLIKE_COMMENT_CB] User ID: ${currentUser.id} unliking comment ID: ${commentId}`);
    const { error } = await supabase.from('comment_likes').delete().match({ comment_id: commentId, user_id: currentUser.id });
    if (error) { 
      console.error(`[UNLIKE_COMMENT_CB] Failed to unlike comment ID ${commentId}:`, error);
      setActionError(`Failed to unlike comment: ${error.message}`); 
      setTimeout(() => setActionError(null), 3000); 
      throw error; 
    }
    console.log(`[UNLIKE_COMMENT_CB] Successfully unliked comment ID: ${commentId}`);
  }, [supabase, currentUser, setActionError]);

  const handleCommentSubmitCallback = useCallback(async (postId: string, commentText: string): Promise<boolean> => {
    console.log("[COMMENT_SUBMIT] Attempting. PostID:", postId, "Text:", commentText);
    if (!currentUser) { 
      console.error("[COMMENT_SUBMIT] User not logged in.");
      setActionError("You must be logged in to comment."); 
      setTimeout(() => setActionError(null), 3000); 
      return false; 
    }
    if (!currentCommunityUuid) {
      console.error("[COMMENT_SUBMIT] Community UUID not found.");
      setActionError("Community information not found. Cannot submit comment.");
      setTimeout(() => setActionError(null), 3000);
      return false;
    }
    
    console.log("[COMMENT_SUBMIT] User ID:", currentUser.id, "Community UUID:", currentCommunityUuid);

    const mentionedUserIds = await parseMentions(commentText);
    const hashtags = parseHashtags(commentText);

    const commentDataToInsert = {
      user_id: currentUser.id,
      community_id: currentCommunityUuid,
      content: commentText,
      parent_post_id: postId,
      type: 'comment' as const, // Ensure type is explicitly 'comment'
      mentioned_user_ids: mentionedUserIds.length > 0 ? mentionedUserIds : null,
      hashtags: hashtags.length > 0 ? hashtags : null,
      depth: 1, // Assuming top-level comments are depth 1
      // title is not typically set for comments
      // image_url is not typically set for comments
      is_visible: true, // Default to visible
    };

    console.log("[COMMENT_SUBMIT] Data to insert:", JSON.stringify(commentDataToInsert, null, 2));

    const { error } = await supabase.from('posts').insert(commentDataToInsert);
    
    if (error) { 
      console.error("[COMMENT_SUBMIT] Supabase insert error:", error);
      setActionError(`Failed to submit comment: ${error.message}`); 
      setTimeout(() => setActionError(null), 3000); 
      return false; 
    }
    console.log("[COMMENT_SUBMIT] Success. Updating local state.");
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
    return true;
  }, [supabase, currentUser, currentCommunityUuid, setPosts, setActionError, parseMentions, parseHashtags]);

  const handleReplySubmitCallback = useCallback(async (parentCommentId: string, replyText: string, parentDepth: number): Promise<boolean> => {
    if (!currentUser) { setActionError("You must be logged in to reply."); setTimeout(() => setActionError(null), 3000); return false; }
    if (!currentCommunityUuid) {
      setActionError("Community information not found. Cannot submit reply.");
      setTimeout(() => setActionError(null), 3000);
      return false;
    }
    const mentionedUserIds = await parseMentions(replyText);
    const hashtags = parseHashtags(replyText);

    const replyDataToInsert = {
      user_id: currentUser.id,
      community_id: currentCommunityUuid,
      content: replyText,
      parent_post_id: parentCommentId, // This should be the comment's ID
      type: 'comment',
      mentioned_user_ids: mentionedUserIds.length > 0 ? mentionedUserIds : null,
      hashtags: hashtags.length > 0 ? hashtags : null,
      depth: parentDepth + 1, // Replies should have depth = parent + 1
    };
    console.log('[REPLY_SUBMIT] Inserting reply:', JSON.stringify(replyDataToInsert, null, 2));

    const { error } = await supabase.from('posts').insert(replyDataToInsert);
    if (error) { setActionError(`Failed to submit reply: ${error.message}`); setTimeout(() => setActionError(null), 3000); return false; }
    return true;
  }, [supabase, currentUser, currentCommunityUuid, setActionError, parseMentions, parseHashtags]);

  const onSubmit: SubmitHandler<FeedPostFormValues> = async (formData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!currentUser?.id) {
      setSubmitError("User not authenticated. Please log in.");
      setIsSubmitting(false);
      return;
    }

    if (!currentCommunityUuid) {
      setSubmitError("Community not found. Cannot create post.");
      setIsSubmitting(false);
      return;
    }

    try {
      let imageUrls: string[] = [];
      let videoUrl: string | null = null;
      const files = formData.imageFile ? Array.from(formData.imageFile).slice(0, 10) : [];
      const videoFiles = formData.videoFile ? Array.from(formData.videoFile).slice(0, 1) : [];

      for (const file of files) {
        const fileName = `Miami/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(FEED_IMAGES_BUCKET)
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from(FEED_IMAGES_BUCKET)
          .getPublicUrl(uploadData.path);
        
        if (publicUrlData?.publicUrl) {
          imageUrls.push(publicUrlData.publicUrl);
        }
      }

      // Handle video upload
      if (videoFiles.length > 0) {
        const video = videoFiles[0];
        const videoName = `Miami/${Date.now()}_${video.name}`;
        const { data: videoUploadData, error: videoUploadError } = await supabase.storage
          .from(FEED_VIDEOS_BUCKET)
          .upload(videoName, video);
        if (videoUploadError) {
          throw new Error(`Video upload failed: ${videoUploadError.message}`);
          }
        const { data: videoPublicUrlData } = supabase.storage
          .from(FEED_VIDEOS_BUCKET)
          .getPublicUrl(videoUploadData.path);
        if (videoPublicUrlData?.publicUrl) {
          videoUrl = videoPublicUrlData.publicUrl;
        }
      }

      // Parse hashtags from the text content
      const postHashtags = parseHashtags(formData.textContent);
      // Parse mentions from the text content
      const mentionedIds = await parseMentions(formData.textContent);
      
      const newPostData: NewPostInsert & { video_url?: string | null } = {
        user_id: currentUser!.id,
        community_id: currentCommunityUuid!,
        type: postType || 'general',
        title: (postType === 'ask' && formData.title && formData.title.trim() !== '') ? formData.title.trim() : null,
        content: formData.textContent,
        images: imageUrls.length > 0 ? imageUrls : null,
        hashtags: postHashtags.length > 0 ? postHashtags : null,
        mentioned_user_ids: mentionedIds.length > 0 ? mentionedIds : null,
        is_visible: true,
        video_url: videoUrl,
      };

      const { error: insertError } = await supabase.from('posts').insert(newPostData);

      if (insertError) {
        throw new Error(`Failed to create post: ${insertError.message}`);
      }

      setSubmitSuccess("Post created successfully!");
      reset({ title: '', textContent: '', imageFile: null, videoFile: null });
      setPostImagePreview(null); 
      await fetchFeedPosts(communityId, currentUser?.id, filters, 1, POSTS_PER_PAGE);

    } catch (error) {
      const e = error as Error;
      setSubmitError(e.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePost = useCallback(async (postId: string, newContent: string, isPoll: boolean) => { // <<< Added isPoll parameter
    setActionError(null);
    if (!currentCommunityUuid) {
      console.error("[CMT_UPDATE_PAGE] Community UUID not found.");
      setActionError("Community information not found. Cannot update post.");
      setTimeout(() => setActionError(null), 3000);
      return false;
    }
    if (!currentUser) { setActionError("You must be logged in to edit posts."); setTimeout(() => setActionError(null), 3000); return false; }
    const originalPost = posts.find(p => p.id === postId);
    if (!originalPost) { setActionError("Could not find the post to update locally."); return false; }
    const newUpdatedAt = new Date().toISOString();
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, textContent: newContent, updated_at: newUpdatedAt } : p));
    try {
      const { error } = await supabase.from('posts').update({ content: newContent, updated_at: newUpdatedAt }).match({ id: postId, user_id: currentUser.id });
      if (error) { setActionError(`Failed to update post: ${error.message}`); setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...originalPost } : p)); setTimeout(() => setActionError(null), 3000); return false; }
      return true;
    } catch (e) {
      const err = e as Error; setActionError(`An unexpected error occurred while updating the post: ${err.message}`);
      setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...originalPost } : p)); setTimeout(() => setActionError(null), 3000); return false;
    }
  }, [supabase, currentUser, posts, setPosts, setActionError, currentCommunityUuid]);

  const handleDeletePost = useCallback(async (postId: string) => {
    if (!currentUser) { setActionError("You must be logged in to delete posts."); setTimeout(() => setActionError(null), 3000); return; }
    try {
      const { error } = await supabase.from('posts').delete().match({ id: postId, user_id: currentUser.id });
      if (error) { setActionError(`Failed to delete post: ${error.message}`); setTimeout(() => setActionError(null), 3000); return; }
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    } catch (e) { const err = e as Error; setActionError("An unexpected error occurred while deleting the post."); setTimeout(() => setActionError(null), 3000); }
  }, [supabase, currentUser, setPosts, setActionError]);

  const handleActualDeleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!currentUser) { setActionError("You must be logged in to delete comments."); setTimeout(() => setActionError(null), 3000); return false; }
    try {
      const { error } = await supabase.from('posts').delete().match({ id: commentId, user_id: currentUser.id });
      if (error) { setActionError(`Failed to delete comment: ${error.message}`); setTimeout(() => setActionError(null), 3000); return false; }
      return true;
    } catch (e) { const err = e as Error; setActionError("An unexpected error occurred while deleting the comment."); setTimeout(() => setActionError(null), 3000); return false; }
  }, [supabase, currentUser, setActionError]);

  const handleActualUpdateComment = useCallback(async (commentId: string, newContent: string): Promise<boolean> => {
    console.log(`[Page_UpdateComment] Called with commentId: ${commentId}, newContent: '${newContent}'`);
    if (!currentUser) {
      console.warn('[Page_UpdateComment] User not logged in.');
      setActionError("You must be logged in to edit comments.");
      setTimeout(() => setActionError(null), 3000);
      return false;
    }
    const newUpdatedAt = new Date().toISOString();
    try {
      console.log(`[Page_UpdateComment] Attempting Supabase update for commentId: ${commentId}, userId: ${currentUser.id}`);
      const { data, error, count, status } = await supabase // Destructure data, count, status for more info
        .from('posts') 
        .update({ content: newContent, updated_at: newUpdatedAt })
        .match({ id: commentId, user_id: currentUser.id });
      
      console.log('[Page_UpdateComment] Supabase update result - Error:', error, 'Data:', data, 'Count:', count, 'Status:', status);

      if (error) {
        console.error("[Page_UpdateComment] Error updating comment in DB:", error);
        setActionError(`Failed to update comment: ${error.message}`);
        setTimeout(() => setActionError(null), 3000);
        return false;
      }
      // Check if any row was actually updated if Supabase doesn't error on non-match for .update()
      // For `update`, `data` is usually null unless you use .select(). Count might be more reliable if RLS allows.
      // However, if .match fails due to RLS (trying to edit someone else's post), error should be populated.
      // If .match finds no rows (e.g., wrong commentId or already deleted), error might be null and count 0.
      console.log("[Page_UpdateComment] Comment update DB operation seems successful (no error thrown). CommentId:", commentId);
      return true; 
    } catch (e) {
      const err = e as Error;
      console.error("[Page_UpdateComment] Unexpected exception during comment update:", err);
      setActionError("An unexpected error occurred while updating the comment.");
      setTimeout(() => setActionError(null), 3000);
      return false;
    }
  }, [supabase, currentUser, setActionError]);

  const handleFiltersChange = (updatedFilters: Filters) => {
    // Pass the complete new filter object to setFilters.
    // The useEffect that depends on `filters` should handle page reset if filters changed.
    setFilters(updatedFilters);
  };

  const handleSortChange = useCallback((newSortOption: Filters['sortBy']) => {
    setFilters(prevFilters => ({ 
      ...prevFilters,
      sortBy: newSortOption 
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      sortBy: 'newest',
      hashtags: [],
      postType: 'all',
    });
    // Reset to default sort or keep current?
    // setFeedSortOption('most_recent'); 
    console.log("Filters cleared");
  }, []);

  // Function to fetch unique hashtags for the current community
  const fetchCommunityUniqueHashtags = useCallback(async () => {
    // console.log("[DEBUG_FETCH_HT] Called fetchCommunityUniqueHashtags. currentCommunityUuid:", currentCommunityUuid);
    if (!currentCommunityUuid) {
      // console.log("[DEBUG_FETCH_HT] Exiting early, currentCommunityUuid is null/undefined.");
      return;
    } 
    try {
      const { data, error } = await supabase
        .from('posts') 
        .select('hashtags')
        .eq('community_id', currentCommunityUuid)
        .not('hashtags', 'is', null); 

      // console.log("[DEBUG_FETCH_HT] Supabase query result - data:", data, "error:", error);

      if (error) {
        // console.error("[DEBUG_FETCH_HT] Error fetching community hashtags:", error);
        setCommunityUniqueHashtags([]);
        return;
      }
      if (data) {
        const allHashtags = data.flatMap(item => item.hashtags || []);
        // console.log("[DEBUG_FETCH_HT] allHashtags after flatMap:", allHashtags);
        const distinctHashtags = Array.from(new Set(allHashtags.filter(Boolean) as string[]));
        // console.log("[DEBUG_FETCH_HT] distinctHashtags after Set and filter:", distinctHashtags);
        setCommunityUniqueHashtags(distinctHashtags.sort());
      }
    } catch (e) {
      const err = e as Error;
      // console.error("[DEBUG_FETCH_HT] Unexpected error fetching community hashtags:", err);
      setCommunityUniqueHashtags([]);
    }
  }, [supabase, currentCommunityUuid]);

  // useEffect to fetch authors when component mounts or communityId changes
  useEffect(() => {
    if (currentCommunityUuid) { 
      fetchCommunityUniqueHashtags(); 
    }
  }, [fetchCommunityUniqueHashtags, currentCommunityUuid]); 

  const displayCommunityName = communityId
    ? communityId.charAt(0).toUpperCase() + communityId.slice(1)
    : 'Community';

  // console.log("[DEBUG] Page: communityUniqueHashtags:", communityUniqueHashtags);

  const areFiltersActive = Object.values(filters).some(value => value !== undefined);

  // Handler for the PostToolbar's "+ Post" button is now removed as per new design.
  // The PostToolbar buttons for 'ask', 'event', 'announcement' will set postType.
  // The 'poll' button in PostToolbar will directly open the poll modal.

  const handleOpenPollModal = () => {
    if (!currentUser) {
      setSubmitError("You must be logged in to create a poll.");
      // Potentially add admin check here if poll creation is admin-only
      return;
    }
    setShowCreatePollModal(true);
  };

  const handlePollSubmit = async (data: PollFormValues) => {
    if (!currentUser || !currentCommunityUuid) {
      setSubmitError("User or community information is missing. Please try again.");
      return;
    }
    // Optional: Add admin check here if needed

    setIsSubmittingPoll(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    let newPostId: string | null = null; // To store the ID of the post created

    try {
      // 1. Insert into 'posts' table first
      const { data: newPostData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          community_id: currentCommunityUuid,
          title: data.question, // Use poll question as post title
          content: data.question, // Use poll question as post content (or a summary)
          type: 'poll',
          is_visible: true,
          depth: 0,
          // poll_id_ref is not used with the new schema where polls table links back to posts
        })
        .select('id') // Only select the id
        .single();

      if (postError) throw new Error(`Failed to create post entry for poll: ${postError.message}`);
      if (!newPostData || !newPostData.id) throw new Error('Post creation for poll returned no ID.');
      newPostId = newPostData.id;

      // 2. Insert into 'polls' table, linking to the new post
      const { error: pollTableError } = await supabase
        .from('polls')
        .insert({
          post_id: newPostId,       // Link to the created post
          question: data.question,  // Poll specific question
          // expires_at: null, // Set if you add expiry to your PollFormValues
        });

      if (pollTableError) throw new Error(`Failed to create poll data in polls table: ${pollTableError.message}`);

      // 3. Insert options into 'poll_options' table
      const optionsToInsert = data.options.map(opt => ({
        poll_post_id: newPostId!, // newPostId is guaranteed to be set if we reach here
        option_text: opt.text,
      }));

      if (optionsToInsert.length > 0) {
        const { error: optionsError } = await supabase
          .from('poll_options')
          .insert(optionsToInsert);
        if (optionsError) throw new Error(`Failed to insert poll options: ${optionsError.message}`);
      }
      
      setSubmitSuccess('Poll created successfully!');
      setShowCreatePollModal(false);
      fetchFeedPosts(communityId, currentUser?.id, filters, 1, POSTS_PER_PAGE); // Refresh feed
    } catch (error) {
      const e = error as Error;
      console.error("Error creating poll:", e);
      setSubmitError(e.message || "An unexpected error occurred during poll creation.");
      // If post was created but subsequent steps failed, consider cleanup
      if (newPostId && (e.message.includes('poll data') || e.message.includes('poll options'))) {
        console.warn('Cleaning up orphaned post due to poll creation error for post ID:', newPostId);
        await supabase.from('posts').delete().match({ id: newPostId });
      }
    } finally {
      setIsSubmittingPoll(false);
    }
  };

  const handleAnnouncePostSubmit = async (values: AnnouncePostFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!currentUser?.id) {
      setSubmitError('User not authenticated. Please log in.');
      setIsSubmitting(false);
      return;
    }
    if (!currentCommunityUuid) {
      setSubmitError('Community not found. Cannot create post.');
      setIsSubmitting(false);
      return;
    }
    try {
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: currentUser.id, 
        community_id: currentCommunityUuid,
        type: 'announce',
        title: values.title,
        content: values.content,
        is_visible: true,
      });
      if (insertError) throw new Error(`Failed to create announcement: ${insertError.message}`);
      setSubmitSuccess('Announcement created successfully!');
      await fetchFeedPosts(communityId, currentUser?.id, filters, 1, POSTS_PER_PAGE);
    } catch (error) {
      const e = error as Error;
      setSubmitError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false); 
    }
  };

  const handleEventPostSubmit = async (values: EventPostFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!currentUser?.id) {
      setSubmitError('User not authenticated. Please log in.');
      setIsSubmitting(false); 
      return;
    }
    if (!currentCommunityUuid) {
      setSubmitError('Community not found. Cannot create post.');
      setIsSubmitting(false);
      return;
    }
    const event_start_time = values.date && values.time
      ? new Date(`${values.date}T${values.time}`).toISOString()
      : undefined;
    if (!event_start_time) {
      setSubmitError('Event date and time are required.');
      setIsSubmitting(false);
      return;
    }
    try {
      const { data: postData, error: postError } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        community_id: currentCommunityUuid,
        type: 'event',
        title: values.name,
        content: values.description,
        is_visible: true,
      }).select('id').single();
      if (postError || !postData || !postData.id) throw new Error(`Failed to create event post: ${postError?.message || 'No post ID returned'}`);
      const { error: eventError } = await supabase.from('events').insert({
        post_id: postData.id,
        event_start_time,
        location_text: values.location,
      });
      if (eventError) throw new Error(`Failed to create event details: ${eventError.message}`);
      setSubmitSuccess('Event created successfully!');
      await fetchFeedPosts(communityId, currentUser?.id, filters, 1, POSTS_PER_PAGE);
    } catch (error) {
      const e = error as Error;
      setSubmitError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePollPostSubmit = async (values: PollPostFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!currentUser?.id) {
      setSubmitError('User not authenticated. Please log in.');
        setIsSubmitting(false);
        return;
      }
    if (!currentCommunityUuid) {
      setSubmitError('Community not found. Cannot create post.');
      setIsSubmitting(false);
      return;
    }
    try {
      const { data: postData, error: postError } = await supabase.from('posts').insert({
      user_id: currentUser.id,
      community_id: currentCommunityUuid, 
        type: 'poll',
        title: values.question,
        content: values.question,
      is_visible: true,
      }).select('id').single();
      if (postError || !postData || !postData.id) throw new Error(`Failed to create poll post: ${postError?.message || 'No post ID returned'}`);
      const { error: pollError } = await supabase.from('polls').insert({
        post_id: postData.id,
        question: values.question,
      });
      if (pollError) throw new Error(`Failed to create poll details: ${pollError.message}`);
      const { error: optionsError } = await supabase.from('poll_options').insert([
        { poll_post_id: postData.id, option_text: values.option1 },
        { poll_post_id: postData.id, option_text: values.option2 },
      ]);
      if (optionsError) throw new Error(`Failed to create poll options: ${optionsError.message}`);
      setSubmitSuccess('Poll created successfully!');
      await fetchFeedPosts(communityId, currentUser?.id, filters, 1, POSTS_PER_PAGE);
    } catch (error) {
      const e = error as Error;
      setSubmitError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = useCallback(async (postId: string, currentPinStatus: boolean): Promise<boolean> => {
    if (!currentUser) {
      setActionError("You must be logged in to pin posts.");
      setTimeout(() => setActionError(null), 3000);
      return false;
    }

    try {
      // Check if user is admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUser.id)
      .single();

      if (profileError || !profileData?.is_admin) {
        setActionError("Only admins can pin posts.");
        setTimeout(() => setActionError(null), 3000);
        return false;
      }

      // Call the update_post_pin_status function
      const { data, error } = await supabase
        .rpc('update_post_pin_status', {
          post_id_to_update: postId,
          new_pin_status: !currentPinStatus
        });

      if (error || !data || !Array.isArray(data) || data.length === 0) {
        setActionError(`Failed to ${currentPinStatus ? 'unpin' : 'pin'} post: ${error?.message || 'No data returned'}`);
        setTimeout(() => setActionError(null), 3000);
        return false;
      }

      // Update the posts state with the new pin status from data[0]
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, is_pinned: data[0].is_pinned }
            : post
        )
      );

      return true;
    } catch (e) {
      const err = e as Error;
      setActionError(`An unexpected error occurred: ${err.message}`);
      setTimeout(() => setActionError(null), 3000);
      return false;
    }
  }, [supabase, currentUser, setActionError]);

  // Handler to summarize last 5 posts
  const handleSummarizePosts = async () => {
    setIsSummarizing(true);
    setSummaryError(null);
    setSummary(null);
    try {
      // Get the last 5 posts (already sorted by pinned/created_at)
      const last5 = posts.slice(0, 5);
      if (last5.length === 0) {
        setSummaryError('No posts to summarize.');
        setIsSummarizing(false);
        return;
    }
      // Prepare the text for the AI
      const prompt = `Summarize the following 5 community posts in a concise paragraph for a busy person. Each post includes the author and title.\n\n` +
        last5.map((p, i) => `Post ${i+1}:\nTitle: ${p.title || '(no title)'}\nAuthor: ${p.authorName}\nContent: ${p.textContent}`).join('\n\n');

      // Call OpenAI API
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        setSummaryError('OpenAI API key not found.');
        setIsSummarizing(false);
        return;
      }
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that summarizes community posts.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 180,
        }),
      });
      if (!response.ok) {
        setSummaryError('Failed to summarize posts.');
        setIsSummarizing(false);
        return;
      }
      const data = await response.json();
      const summaryText = data.choices?.[0]?.message?.content?.trim();
      setSummary(summaryText || 'No summary returned.');
    } catch (e) {
      setSummaryError('Failed to summarize posts.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAskPostSubmit = async (values: AskPostFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!currentUser?.id) {
      setSubmitError('User not authenticated. Please log in.');
      setIsSubmitting(false);
      return;
    }
    if (!currentCommunityUuid) {
      setSubmitError('Community not found. Cannot create post.');
      setIsSubmitting(false);
      return;
    }
    try {
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        community_id: currentCommunityUuid,
        type: 'ask',
        title: values.title,
        content: values.content,
        is_visible: true,
      });
      if (insertError) throw new Error(`Failed to create ask post: ${insertError.message}`);
      setSubmitSuccess('Ask post created successfully!');
      await fetchFeedPosts(communityId, currentUser?.id, filters, 1, POSTS_PER_PAGE);
    } catch (error) {
      const e = error as Error;
      setSubmitError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [highlightedPost, setHighlightedPost] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#post-')) {
      const postId = window.location.hash.replace('#post-', '');
      setTimeout(() => {
        const el = postRefs.current[postId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedPost(postId);
          setTimeout(() => setHighlightedPost(null), 2000);
        }
      }, 300);
    }
  }, [posts]);

  return (
    <div className="min-h-screen bg-sky-50 p-4 sm:p-6 md:p-8">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-sky-800">
            {displayCommunityName} - Coastline Chatter
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            See what's new and join the conversation!
          </p>
        </div>
        <Link 
            href={`/community/${communityId}`}
            className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline"
          >
            &larr; Back to {displayCommunityName} Dashboard
        </Link>
      </header>

      {actionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{actionError}</span>
        </div>
      )}
      {submitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{submitError}</span>
        </div>
      )}
      {submitSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{submitSuccess}</span>
        </div>
      )}

      {/* Feed Filter and Sort Bar */}
      <FeedFilterSortBar 
        currentFilters={filters}
        currentSort={filters.sortBy}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
      />

      {/* AI Summary Button and Output */}
      <div className="w-full max-w-4xl mx-auto my-6 bg-white border-2 border-cyan-200 rounded-xl shadow p-6 flex flex-col items-start">
        <h2 className="text-lg font-bold text-cyan-700 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0H3m9 0a8 8 0 100-16 8 8 0 000 16z" /></svg>
          Feed AI Summarizer
        </h2>
        <button
          onClick={handleSummarizePosts}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-60 font-semibold mb-3"
          disabled={isSummarizing || posts.length === 0}
        >
          {isSummarizing ? 'Summarizing...' : 'Summarize Last 5 Posts'}
        </button>
        {summaryError && <div className="text-red-600 mt-2">{summaryError}</div>}
        {summary && (
          <div className="mt-2 p-4 bg-cyan-50 border border-cyan-200 rounded w-full text-cyan-900">
            <strong className="block mb-1 text-cyan-700">Summary:</strong>
            <div className="whitespace-pre-line text-base">{summary}</div>
          </div>
        )}
      </div>

      {/* Original Simple Post Form - Keep this */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded-lg p-4 sm:p-5 my-6">
        <HashtagInput
          value={watch("textContent") || ''}
          onChange={(newValue) => setValue("textContent", newValue, { shouldValidate: true, shouldDirty: true })}
          placeholder={`What's on your mind, ${currentUser?.email || displayCommunityName}?`}
          rows={3}
          className={`w-full ${errors.textContent ? 'border-red-500' : 'border-slate-300'} disabled:bg-slate-100 focus:ring-cyan-500 focus:border-cyan-500`}
        />
        {errors.textContent && <p className="text-xs text-red-500 mt-1">{errors.textContent.message}</p>}
        <div className="mt-3 flex flex-col sm:flex-row justify-between items-center">
          <div className="relative flex items-center">
            {/* Image upload input */}
            <label 
              htmlFor="imageFile-upload-multi"
              className={`cursor-pointer text-cyan-600 hover:text-cyan-700 p-2 rounded-md hover:bg-cyan-50 transition-colors group flex items-center ${selectedVideo && selectedVideo.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <ImageIcon size={20} className="mr-2 text-cyan-500 group-hover:text-cyan-600" />
              <span className="text-sm font-medium">{selectedFile && selectedFile.length > 0 ? `${selectedFile.length} image(s) selected` : 'Add Images'}</span>
            </label>
            <input 
              id="imageFile-upload-multi" type="file" className="sr-only" accept="image/png, image/jpeg, image/gif" 
              multiple
              {...register("imageFile", {
                validate: (files: FileList | null | undefined) => {
                  if (!files || files.length === 0) return true;
                  if (files.length > 10) return "You can upload up to 10 images.";
                  return true;
                }
              })}
              disabled={isSubmitting || !!(selectedVideo && selectedVideo.length > 0)}
            />
            {selectedFile && selectedFile.length > 0 && postImagePreview && (
                <button type="button" onClick={() => { setValue("imageFile", null); setPostImagePreview(null); }} 
                    className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors" aria-label="Remove image"
                ><XSquare size={18} /></button>
            )}
            {/* Video upload input */}
            <label
              htmlFor="videoFile-upload"
              className={`ml-4 cursor-pointer text-cyan-600 hover:text-cyan-700 p-2 rounded-md hover:bg-cyan-50 transition-colors group flex items-center ${selectedFile && selectedFile.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <svg className="mr-2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6.5A2.5 2.5 0 016.5 4h7A2.5 2.5 0 0116 6.5v11A2.5 2.5 0 0113.5 20h-7A2.5 2.5 0 014 17.5v-11z"/></svg>
              <span className="text-sm font-medium">{selectedVideo && selectedVideo.length > 0 ? '1 video selected' : 'Add Video'}</span>
            </label>
            <input
              id="videoFile-upload"
              type="file"
              className="sr-only"
              accept="video/mp4,video/webm,video/ogg"
              {...register("videoFile", {
                validate: (files: FileList | null | undefined) => {
                  if (!files || files.length === 0) return true;
                  if (files.length > 1) return "You can upload only 1 video.";
                  return true;
                }
              })}
              disabled={isSubmitting || !!(selectedFile && selectedFile.length > 0)}
            />
            {selectedVideo && selectedVideo.length > 0 && postVideoPreview && (
              <button type="button" onClick={() => { setValue("videoFile", null); setPostVideoPreview(null); }}
                className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors" aria-label="Remove video"
                ><XSquare size={18} /></button>
            )}
          </div>
          <button type="submit" className="w-full sm:w-auto mt-3 sm:mt-0 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isSubmitting || (!watch("textContent")?.trim() && (!selectedFile || selectedFile.length === 0) && (!selectedVideo || selectedVideo.length === 0))}
          >
            {isSubmitting ? (<><Loader2 className="animate-spin h-5 w-5 mr-2" /> Posting...</>) : (<><PlusCircle size={18} className="mr-2" /> Post</>)}
          </button>
        </div>
        {errors.imageFile && <p className="text-xs text-red-500 mt-1">{errors.imageFile.message}</p>}
        {errors.videoFile && <p className="text-xs text-red-500 mt-1">{errors.videoFile.message}</p>}
        {selectedFile && selectedFile.length > 0 && (
          <div className="mt-4 border border-slate-200 rounded-lg p-2 bg-slate-50 max-h-72 overflow-x-auto">
            <p className='text-xs text-slate-500 mb-1'>Image Preview:</p>
            <div className="flex gap-2">
              {Array.from(selectedFile).map((file, idx) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={idx} className="relative">
                    <ImageNext
                      src={url}
                      alt={`Image preview ${idx + 1}`}
                      width={120}
                      height={120}
                      className="rounded-md object-contain"
                      style={{ maxHeight: '120px', maxWidth: '120px' }}
                      onLoad={() => URL.revokeObjectURL(url)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {selectedVideo && selectedVideo.length > 0 && postVideoPreview && (
          <div className="mt-4 border border-slate-200 rounded-lg p-2 bg-slate-50">
            <p className='text-xs text-slate-500 mb-1'>Video Preview:</p>
            <video src={postVideoPreview} controls className="rounded-md max-h-72 w-full" />
          </div>
        )}
      </form>

      {/* Admin Post Block (PostToolbar and conditional forms) - Keep this */}
      {currentUser && isCurrentUserAdmin && ( // MODIFIED: Added isCurrentUserAdmin check
        <div className="bg-white p-5 rounded-lg shadow-md my-6">
          <div className="flex items-start space-x-3 mb-4">
            {currentUser.user_metadata?.avatar_url ? (
              <ImageNext
                src={currentUser.user_metadata.avatar_url}
                alt="User Avatar"
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center text-white text-xl">
                {currentUser.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-slate-800">
                {currentUser.user_metadata?.username || currentUser.email}
              </p>
              <p className="text-xs text-slate-500">Posting to {displayCommunityName} (as {postType})</p>
            </div>
          </div>
          
          <PostToolbar 
            setType={setPostType} 
            onOpenPollModal={handleOpenPollModal} 
            currentType={postType} 
          />

          {postType === 'ask' && <AskPostForm onSubmit={handleAskPostSubmit} />}
          {postType === 'announce' && <AnnouncePostForm onSubmit={handleAnnouncePostSubmit} />}
          {postType === 'event' && <EventPostForm onSubmit={handleEventPostSubmit} />}
          {postType === 'poll' && <PollPostForm onSubmit={handlePollPostSubmit} />}
        </div>
      )}
      {/* === END ADMIN POST BLOCK === */}

      {isLoadingPosts ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
          <p className="ml-4 text-slate-600">Loading posts...</p>
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((postItem) => { 
            const {
              id, postAuthorUserId, authorName, authorAvatarUrl, timestamp, 
              textContent, imageUrl, poll_id, likeCount, commentCount, updated_at, 
              isLikedByCurrentUser, post_type, title, is_pinned, event_start_time, event_location, event_description, images, video_url 
            } = postItem; 
            return (
              <div
                key={id}
                id={`post-${id}`}
                ref={el => (postRefs.current[id] = el)}
                className={
                  highlightedPost === id
                    ? 'ring-4 ring-cyan-400 bg-cyan-50 shadow-xl transition-all duration-700 border-2 border-cyan-500'
                    : ''
                }
              >
                <FeedPostItem 
                id={id}
                postAuthorUserId={postAuthorUserId}
                currentUserId={currentUser?.id}
                authorName={authorName}
                authorAvatarUrl={authorAvatarUrl}
                timestamp={timestamp}
                title={title} 
                textContent={textContent}
                imageUrl={imageUrl}
                poll_id={poll_id}
                  post_type={post_type}
                likeCount={likeCount}
                commentCount={commentCount}
                isLikedByCurrentUser={isLikedByCurrentUser} 
                  is_pinned={is_pinned}
                  onToggleLike={handleToggleLike}
                  fetchComments={fetchCommentsForPost}
                onCommentSubmit={handleCommentSubmitCallback}
                onDeletePost={handleDeletePost}
                onUpdatePost={(postIdToUpdate, updatedContent) => handleUpdatePost(postIdToUpdate, updatedContent, postItem.post_type === 'poll')} 
                onActualDeleteComment={handleActualDeleteComment}
                onActualUpdateComment={handleActualUpdateComment}
                onReplySubmit={handleReplySubmitCallback} 
                onLikeComment={handleLikeCommentCallback}
                onUnlikeComment={handleUnlikeCommentCallback}
                  onTogglePin={handleTogglePin}
                supabaseClient={supabase} 
                  event_start_time={event_start_time}
                  event_location_text={event_location}
                  event_description={event_description}
                  images={images || []}
                  video_url={video_url}
              />
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Create Poll Modal */}
      {showCreatePollModal && communityId && (
        <CreatePollModal 
          isOpen={showCreatePollModal}
          onClose={() => setShowCreatePollModal(false)}
          onSubmit={handlePollSubmit}
          communityId={communityId} // Pass the actual community slug or name for display
          isSubmitting={isSubmittingPoll}
        />
      )}
    </div>
  );
}
