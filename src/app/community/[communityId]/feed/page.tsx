'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import FeedPostItem, { type FeedPostItemProps } from '@/components/feed/FeedPostItem';
import { type CommentItemProps } from '@/components/feed/CommentItem';
import { Loader2, Calendar, BarChart3 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import ImageNext from 'next/image';
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
import MentionTextarea from '@/components/mention/MentionTextarea'; // <<< ADD IMPORT
import { useUser } from '@/components/auth/UserContext';
import SiteHeader from '@/components/SiteHeader'; 

// Define a more specific type for posts coming from the view
type CommunityFeedViewRow = Database["public"]["Views"]["community_feed_view"]["Row"] & {
  is_pinned?: boolean;
  author_id?: string;
  post_author_user_id?: string;
  type?: string;
  post_type?: string;
  author_username?: string;
  author_avatar_url?: string;
  author_full_name?: string | null; // ADDED
  author_role?: string | null;      // ADDED
  author_is_location_verified?: boolean | null; // ADDED for verification badge
  images?: string[];
  image_url?: string;
  poll_id?: string;
  comment_count?: number;
  updated_at?: string;
  title?: string;
  event_start_time?: string;
  event_end_time?: string | null;
  event_location?: string;
  event_description?: string;
  video_url?: string;
  documents?: string[];
  author_bio?: string;
  author_email?: string;
  author_profile_created_at?: string;
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
type PostData = Omit<FeedPostItemProps, 'onToggleLike' | 'fetchComments' | 'onCommentSubmit' | 'supabaseClient' | 'onTogglePin'> & {
  postAuthorUserId: string;
  post_type: ActualPostType | 'general';
  isLikedByCurrentUser: boolean;
  poll_id: string | null;
  is_pinned: boolean;
  title?: string | null;
  authorFullName?: string | null; // ADDED
  authorRole?: string | null;     // ADDED
  authorIsLocationVerified?: boolean; // ADDED for verification badge
  event_start_time?: string | null;
  event_end_time?: string | null;
  event_location_text?: string | null;
  event_description?: string | null;
  communityId: string; // <<< ENSURE THIS LINE IS PRESENT AND CORRECT
  authorBio?: string;
  authorEmail?: string;
  authorProfileCreatedAt?: string;
};

// Form values for creating a new post
interface FeedPostFormValues {
  title: string;
  textContent: string;
  imageFile?: FileList | null; // allow multiple
  videoFile?: FileList | null; // add videoFile
  documentFiles?: FileList | null; // NEW: for document uploads
  event_start_time?: string; // for events
  event_end_time?: string; // for events
  location_text?: string; // for events
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
const FEED_DOCUMENTS_BUCKET = 'feeddocuments'; // NEW: bucket for documents

interface Filters {
  searchTerm: string;
  sortBy: 'newest' | 'oldest' | 'most_liked' | 'most_commented';
  hashtags: string[]; // Changed from hashtag: string to string[]
  postType: PostType | 'all';
}

const POSTS_PER_PAGE = 30; // Increased from 10 to 30 to show more posts per page

// Define a more detailed profile type for the map
interface ProfileForMap {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email?: string | null;
  bio?: string | null;
  created_at?: string | null; // This is profile creation date
  role?: string | null;
  is_location_verified?: boolean | null;
  // is_online?: boolean | null; // Will be derived from last_seen_at
  last_seen_at?: string | null; // New field
}

export default function CommunityFeedPage() {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const params = useParams() ?? {};
  const communityId = (params as any).communityId as string;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [fetchPostsError, setFetchPostsError] = useState<string | null>(null); // <<< Define fetchPostsError state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);

  // Pagination and total count state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);

  // State for current community UUID
  const [currentCommunityUuid, setCurrentCommunityUuid] = useState<string | null>(null);
  // State for current user's role
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // State for Post Type
  const [postType, setPostType] = useState<ActivePostType>(null); // MODIFIED: Initialize to null

  // Post type limits state - Assuming this state is managed elsewhere or will be added
  const [postTypeLimits, setPostTypeLimits] = useState<{[key: string]: number}>({
    'event': 1, // Example: 1 available
    'ask': 0,   // Example: 0 available
    'announce': 1,
    'poll': 1
  });
  const [limitExceededError, setLimitExceededError] = useState<string | null>(null);
  
  // Poll options state
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

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
  // State for create post modal
  // const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  const textContentRef = useRef<HTMLTextAreaElement>(null); // <<< ADD REF FOR TEXTAREA

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue, // <<< ENSURE setValue IS DESTUCTURED
    formState: { errors },
  } = useForm<FeedPostFormValues>({
    defaultValues: {
      title: '',
      textContent: '',
      imageFile: null,
      videoFile: null,
      documentFiles: null, // NEW
    }
  });
  const selectedFile = watch("imageFile");
  const selectedVideo = watch("videoFile");
  const selectedDocuments = watch("documentFiles"); // NEW
  const textContentValue = watch("textContent"); // <<< WATCH TEXT CONTENT
  const [postVideoPreview, setPostVideoPreview] = useState<string | null>(null);

  // ADDED: State for file upload specific errors
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  // ADDED: State for staged image files for easier manipulation (add/remove)
  const [stagedImageFiles, setStagedImageFiles] = useState<File[]>([]);

  // Helper function to create a FileList from an array of Files
  const createFileListFromFileArray = (files: File[]): FileList => {
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));
    return dataTransfer.files;
  };

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
    // console.log("Selected file changed (main form):", selectedFile); // Keep for debugging if needed
    if (selectedFile && selectedFile.length > 0) {
      // This useEffect will primarily handle preview generation.
      // The direct onChange handlers on inputs will do initial validation.
      // However, a secondary check here ensures consistency if files are set programmatically.
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
      const invalidFiles = Array.from(selectedFile).filter(file => !allowedTypes.includes(file.type));

      if (invalidFiles.length > 0 && !fileUploadError) { // Only set error if not already set by onChange
        setFileUploadError("File type not supported");
        setPostImagePreview(null);
        // setValue('imageFile', null, { shouldValidate: true }); // Let onChange handle clearing
        return;
      }
      
      // If an error was set by onChange, don't generate a preview.
      if (fileUploadError) {
        setPostImagePreview(null);
      } else {
      objectUrl = URL.createObjectURL(selectedFile[0]);
      setPostImagePreview(objectUrl);
      }
    } else {
      setPostImagePreview(null);
      // Don't clear fileUploadError here, let specific user actions clear it.
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedFile, fileUploadError]); // Removed setValue from dependencies

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
        // Fetch profile to get role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profileError) {
          console.error("Error fetching user profile for role check:", profileError);
          setCurrentUserRole(null);
        } else if (profileData) {
          setCurrentUserRole(profileData.role || null);
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
            .eq('slug', communityId as string)
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
      // This useEffect is now primarily for cleanup if component unmounts with a preview
      // The onChange handler on the input will set the preview.
      // objectUrl = URL.createObjectURL(selectedVideo[0]);
      // setPostVideoPreview(objectUrl);
    } else {
      setPostVideoPreview(null);
    }
    return () => {
      if (postVideoPreview && postVideoPreview.startsWith('blob:')) { // Ensure it's a blob URL
        URL.revokeObjectURL(postVideoPreview);
      }
    };
  }, [selectedVideo]); // Keep selectedVideo dependency for cleanup

  useEffect(() => {
    if (selectedDocuments && selectedDocuments.length > 0) {
      setPostDocumentPreviews(Array.from(selectedDocuments));
    } else {
      setPostDocumentPreviews([]);
    }
  }, [selectedDocuments]);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (stagedImageFiles.length > 0 && !fileUploadError) {
      // Preview the first staged image if no error
      objectUrl = URL.createObjectURL(stagedImageFiles[0]);
      setPostImagePreview(objectUrl);
    } else {
      setPostImagePreview(null);
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [stagedImageFiles, fileUploadError]); // Depend on stagedImageFiles and fileUploadError

  const fetchFeedPosts = useCallback(async (
    communityUuid: string,
    currentUserIdForLikes: string | null, // Renamed to avoid conflict if currentUser is also a param
    currentFilters: Filters,
    pageToFetch: number,
    pageSize: number
  ): Promise<{ posts: PostData[], totalCount: number, error?: string }> => {
    if (!supabase) {
      console.error("Supabase client not available in fetchFeedPosts");
      return { posts: [], totalCount: 0, error: "Supabase client not available." };
    }

    try {
      let query = supabase
        .from('community_feed_view')
        .select('*', { count: 'exact' })
        .eq('community_id', communityUuid)
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
        query = query.eq('type', currentFilters.postType); // Changed 'post_type' to 'type'
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

      const fetchedData: PostData[] = typedViewData
        .map(post => {
        // console.log('[DEBUG_ROLE] Raw post from view in fetchFeedPosts:', post); // REMOVED
        const postAuthorUserId = post.author_id || post.user_id || post.post_author_user_id;
        const postType = post.type || post.post_type;
        // ADDED authorFullName and authorRole mapping
        const authorFullName = (post as any).author_full_name || post.author_username; 
        const authorRole = (post as any).role || (post as any).author_role; // UPDATED: Prefer post.role
        // console.log('[DEBUG_ROLE] Mapped authorRole in fetchFeedPosts:', authorRole); // REMOVED

        if (!post.id || !postAuthorUserId || !postType) {
            return undefined;
        }
        const currentPostType = postType as ActualPostType | 'general' | 'comment' | null | undefined;
        if (!currentPostType || !(['ask', 'announce', 'event', 'poll', 'general', 'comment'] as (ActualPostType | 'general' | 'comment')[]).includes(currentPostType)) {
              return undefined;
          }
        // Fallbacks for avatar and name
        const fallbackName = post.author_username || 'Unknown User';
        const avatarUrl = (typeof post.author_avatar_url === 'string' && post.author_avatar_url)
          ? post.author_avatar_url
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}`;
        let eventEndTime: string | null | undefined = undefined;
        if ('event_end_time' in post) {
          eventEndTime = typeof post.event_end_time === 'string' ? post.event_end_time : null;
        }
        // Add console logs for debugging event data
        if (currentPostType === 'event') {
          console.log(`[DEBUG] Event Post ID: ${post.id}`);
          console.log(`[DEBUG] Event Start Time: ${post.event_start_time}`);
          console.log(`[DEBUG] Event End Time: ${post.event_end_time}`);
          console.log(`[DEBUG] Event Location: ${post.event_location}`);
          console.log(`[DEBUG] Event Description: ${post.event_description}`);
        }
        return {
            id: post.id,
            postAuthorUserId: postAuthorUserId!,
            authorName: fallbackName,
            authorFullName: authorFullName,
            authorRole: authorRole,
            authorAvatarUrl: avatarUrl,
            authorIsOnline: postAuthorUserId === currentUserIdForLikes ? true : undefined,
            timestamp: post.created_at || new Date(0).toISOString(),
            textContent: post.content || '',
            images: post.images || [],
            imageUrl: post.image_url,
            poll_id: postType === 'poll' ? post.id : post.poll_id,
            is_pinned: (post as any).is_pinned || false,
            likeCount: post.like_count || 0,
            isLikedByCurrentUser: currentUserIdForLikes ? likedPostIdsForPage.has(post.id) : false,
            commentCount: post.comment_count || 0,
            updated_at: post.updated_at || null,
            post_type: currentPostType,
            title: post.title,
            event_start_time: post.event_start_time,
            event_end_time: typeof eventEndTime === 'string' ? eventEndTime : null,
            event_location_text: post.event_location,
            event_description: post.event_description,
            video_url: post.video_url,
            documents: post.documents || [],

            // ADDED MAPPINGS FOR MISSING AUTHOR DETAILS
            authorBio: post.author_bio,
            authorEmail: post.author_email,
            authorProfileCreatedAt: post.author_profile_created_at,
            authorIsLocationVerified: post.author_is_location_verified ?? undefined, // Handle potential null

            communityId: communityUuid, // <<< ENSURE THIS IS communityUuid
        } as PostData;
        })
        .filter((p): p is PostData => Boolean(p));

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
      // When filters change, reset to page 1 and clear current posts
      setPosts([]); 
      setCurrentPage(1); 
      setTotalPostsCount(0); // Reset total count until new fetch provides it
      setIsLoadingPosts(true); // Indicate initial loading for the new filter set
      setFetchPostsError(null); // Clear previous error

      fetchFeedPosts(currentCommunityUuid, currentUser ? currentUser.id : null, filters, 1, POSTS_PER_PAGE)
        .then(result => {
          if (result.error) {
            setFetchPostsError(result.error);
            setPosts([]);
            setTotalPostsCount(0);
          } else {
            setPosts(result.posts);
            setTotalPostsCount(result.totalCount || 0); // Set total posts count from the fetch
            setFetchPostsError(null);
          }
        })
        .catch(e => {
          console.error("Error in initial post fetch useEffect:", e);
          setFetchPostsError("Failed to load feed.");
          setPosts([]);
          setTotalPostsCount(0);
        })
        .finally(() => {
          setIsLoadingPosts(false);
        });
    }
  }, [currentCommunityUuid, currentUser, filters, fetchFeedPosts]); // fetchFeedPosts is stable, filters trigger reset

  useEffect(() => {
    if (!communityId || !supabase) return;
    const channel = supabase
      .channel(`realtime-community-feed-${communityId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `community_id=eq.${communityId}`},
        async (payload) => {
          const newPostRecord = payload.new as Database["public"]["Tables"]["posts"]["Row"];
          if (newPostRecord && newPostRecord.id && (newPostRecord as any).parent_post_id === null) {
            try {
              const { data: viewData, error: viewError } = await supabase
                .from('community_feed_view').select('*').eq('id', newPostRecord.id).single();
              if (viewError) return;
              if (viewData) {
                const typedViewData = viewData as CommunityFeedViewRow;
                // console.log('[DEBUG_ROLE] Raw post from view in real-time handler:', typedViewData); // REMOVED
                if (typedViewData.id && typedViewData.author_id && typedViewData.type) {
                  const authorRoleRealtime = (typedViewData as any).role || (typedViewData as any).author_role;
                  // console.log('[DEBUG_ROLE] Mapped authorRole in real-time handler:', authorRoleRealtime); // REMOVED
                  const newPostForState: PostData = {
                    id: typedViewData.id,
                    postAuthorUserId: typedViewData.author_id,
                    authorName: typedViewData.author_username || 'Unknown User',
                    authorFullName: typedViewData.author_full_name,
                    authorRole: authorRoleRealtime, // UPDATED to use local var
                    authorAvatarUrl: typedViewData.author_avatar_url,
                    timestamp: typedViewData.created_at || new Date(0).toISOString(),
                    textContent: typedViewData.content || '',
                    images: typedViewData.images || [],
                    imageUrl: typedViewData.image_url,
                    poll_id: typedViewData.type === 'poll' ? typedViewData.id : (typedViewData.poll_id ?? null), // FIX: use id for poll posts
                    is_pinned: (typedViewData as any).is_pinned || false, // Type assertion for is_pinned
                    likeCount: typedViewData.like_count || 0,
                    isLikedByCurrentUser: posts.find(p => p.id === typedViewData.id)?.isLikedByCurrentUser || false, // Preserve if already known, else false
                    commentCount: typedViewData.comment_count || 0,
                    updated_at: typedViewData.updated_at || null,
                    post_type: typedViewData.type as ActualPostType | 'general',
                    title: typedViewData.title, // Add title from post data
                    event_start_time: typedViewData.event_start_time,
                    event_end_time: typeof typedViewData.event_end_time === 'string' ? typedViewData.event_end_time : null,
                    event_location_text: typedViewData.event_location, // <-- Fix: map event_location to event_location_text
                    event_description: typedViewData.event_description,
                    video_url: typedViewData.video_url,
                    documents: typedViewData.documents || [],
                    
                    // ADDED MAPPINGS FOR MISSING AUTHOR DETAILS IN REALTIME HANDLER
                    authorBio: typedViewData.author_bio,
                    authorEmail: typedViewData.author_email,
                    authorProfileCreatedAt: typedViewData.author_profile_created_at,
                    authorIsLocationVerified: typedViewData.author_is_location_verified ?? undefined, // Handle potential null

                    communityId: currentCommunityUuid!, // <<< FIX: Use currentCommunityUuid
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
          } else if (newPostRecord && (newPostRecord as any).parent_post_id !== null) {
            setPosts(currentPosts => currentPosts.map(p => 
              p.id === (newPostRecord as any).parent_post_id 
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
  }, [supabase, communityId, setPosts, currentUser, fetchFeedPosts, currentCommunityUuid]); // <<< ADD currentCommunityUuid to dependency array

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

  // Helper function to build comment hierarchy
  const buildCommentHierarchyRecursive = async (
    allCommentsInCommunity: (Database["public"]["Tables"]["posts"]["Row"] & { profiles: ProfileForMap | null })[],
    profilesMap: Map<string, ProfileForMap>,
    commentLikesMap: Map<string, { count: number, likedByCurrentUser: boolean }>,
    parentId: string | null,
    currentUserId: string | null,
    pageCommunityId: string,
    currentDepthForLog: number = 0 
  ): Promise<CommentItemProps[]> => {
    const indent = '  '.repeat(currentDepthForLog);
    // console.log(`${indent}[BCHR] Building for parentId: ${parentId}, Depth: ${currentDepthForLog}`);

    const childrenOfParent = allCommentsInCommunity
      .filter(comment => (comment as any).parent_post_id === parentId);
      // .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    // console.log(`${indent}[BCHR] Found ${childrenOfParent.length} children for parentId: ${parentId}`);
    // childrenOfParent.forEach(child => {
    console.log(`${indent}[BCHR] Found ${childrenOfParent.length} children for parentId: ${parentId}`);
    childrenOfParent.forEach(child => {
      console.log(`${indent}  - Child: ${child.id}, Content: "${(child.content || '').substring(0, 20)}...", DB ParentID: ${(child as any).parent_post_id}, DB Depth: ${(child as any).depth}`);
    });

    return Promise.all(childrenOfParent
      .map(async (comment) => {
        const profileData = comment.user_id ? profilesMap.get(comment.user_id) : null;
        
        // Map to CommentItemProps structure
        return {
          id: comment.id!,
          authorName: profileData?.username || 'Unknown User',
          authorAvatarUrl: profileData?.avatar_url,
          textContent: comment.content || '',
          timestamp: comment.created_at || new Date().toISOString(),
          commentAuthorId: comment.user_id!,
          updated_at: comment.updated_at,
          depth: (comment as any).depth || currentDepthForLog, // Use actual depth if available
          parent_id: (comment as any).parent_post_id,
          likeCount: commentLikesMap.get(comment.id!)?.count || 0,
          isLikedByCurrentUser: commentLikesMap.get(comment.id!)?.likedByCurrentUser || false,
          replies: await buildCommentHierarchyRecursive(allCommentsInCommunity, profilesMap, commentLikesMap, comment.id, currentUserId, pageCommunityId, currentDepthForLog + 1),
          communityId: pageCommunityId,
          // Add new author fields for tooltip
          authorEmail: profileData?.email,
          authorBio: profileData?.bio,
          authorProfileCreatedAt: profileData?.created_at, // This is profile creation_at
          authorRole: profileData?.role,
          authorIsLocationVerified: profileData?.is_location_verified,
          authorLastSeenAt: profileData?.last_seen_at, // Pass new field
        } as CommentItemProps;
      }));
  };


  const fetchCommentsForPost = useCallback(async (rootPostId: string): Promise<CommentItemProps[]> => {
    if (!currentCommunityUuid) {
      console.error("[COMMENTS_PAGE] Community UUID not available for fetching comments.");
      return [];
    }
    // console.log(`[COMMENTS_PAGE] Fetching all comments for rootPostId: ${rootPostId} in community: ${currentCommunityUuid}`);

    const { data: allCommentRecords, error: commentsError } = await supabase
      .from('posts')
      .select('*, profiles:user_id!inner(id, username, avatar_url, email, bio, created_at, role, is_location_verified, last_seen_at)') // Added last_seen_at, removed is_online
      .eq('type', 'comment')
      .eq('community_id', currentCommunityUuid);
      // .order('created_at', { ascending: true }); // Keep this commented for now

    if (commentsError) {
      console.error(`[COMMENTS_PAGE] Error fetching all comments for community ${currentCommunityUuid}:`, commentsError);
      return []; 
    }
    if (!allCommentRecords) {
      console.log("[COMMENTS_PAGE] No comment records returned from DB.");
      return [];
    }
    console.log(`[COMMENTS_PAGE] Fetched ${allCommentRecords.length} raw comment records from DB for community ${currentCommunityUuid}.`);
    // Optionally log all raw comments if needed for deep debugging, be mindful of console spam
    // allCommentRecords.forEach(c => console.log(`[RAW_COMMENT] ID: ${c.id}, ParentID: ${(c as any).parent_post_id}, Depth: ${(c as any).depth}, Content: "${(c.content || '').substring(0,20)}..."`));

    const typedCommentRecords = allCommentRecords as (Database["public"]["Tables"]["posts"]["Row"] & { profiles: ProfileForMap | null })[];

    // Create a map of profiles for quick lookup
    const profilesMap = new Map<string, ProfileForMap>();
    typedCommentRecords.forEach(comment => {
      if (comment.user_id && comment.profiles) {
        profilesMap.set(comment.user_id, comment.profiles as ProfileForMap); // Ensure casting if needed
      }
    });
    
    // 2. Fetch all likes for these comments by the current user in a batch
    const commentIds = typedCommentRecords.map(c => c.id).filter(id => id !== null) as string[];
    const commentLikesMap = new Map<string, { count: number, likedByCurrentUser: boolean }>();

    if (commentIds.length > 0) {
      // Batch fetch like counts
      // const { data: likeCountsData, error: likeCountsError } = await supabase
      //   .from('comment_likes')
      //   .select('comment_id, count:id')
      //   .in('comment_id', commentIds)
      //   .groupBy('comment_id'); // Removed groupBy as it caused an error and client-side aggregation is used
      
      const { data: allLikesForComments, error: allLikesError } = await supabase
          .from('comment_likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds);

      if (allLikesError) {
        console.error("[COMMENTS] Error fetching all likes for comments:", allLikesError);
      } else if (allLikesForComments) {
        typedCommentRecords.forEach(comment => {
          const likesForThisComment = allLikesForComments.filter(like => like.comment_id === comment.id);
          const likedByCurrentUser = currentUser?.id ? likesForThisComment.some(like => like.user_id === currentUser.id) : false;
          commentLikesMap.set(comment.id, { count: likesForThisComment.length, likedByCurrentUser });
        });
      }
    }
    
    // 3. Build the hierarchy starting with comments directly under the rootPostId
    const hierarchicalComments = await buildCommentHierarchyRecursive(
      typedCommentRecords,
      profilesMap,
      commentLikesMap,
      rootPostId, 
      currentUser?.id || null,
      currentCommunityUuid
    );
    
    console.log(`[COMMENTS_PAGE] Final hierarchical comments for rootPostId ${rootPostId}:`, JSON.stringify(hierarchicalComments.map(c => ({id: c.id, text: c.textContent.substring(0,10), repliesCount: (c.replies || []).length})), null, 2));
    return hierarchicalComments;
  }, [supabase, currentUser, currentCommunityUuid]);

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
    console.log(`[COMMENT_SUBMIT_CALLBACK] Attempting. PostID: ${postId}, Text: "${commentText}", Current User ID: ${currentUser?.id}`);

    if (!currentUser || !currentUser.id) { 
      console.error("[COMMENT_SUBMIT_CALLBACK] User not logged in or ID missing.");
      setActionError("You must be logged in to comment."); 
      setTimeout(() => setActionError(null), 3000); 
      return false; 
    }
    if (!currentCommunityUuid) {
      console.error("[COMMENT_SUBMIT_CALLBACK] Community UUID not found.");
      setActionError("Community information not found. Cannot submit comment.");
      setTimeout(() => setActionError(null), 3000);
      return false;
    }

    const mentionedUserIds = await parseMentions(commentText);
    const hashtags = parseHashtags(commentText);

    const commentDataToInsert = {
      user_id: currentUser.id,
      community_id: currentCommunityUuid,
      content: commentText,
      parent_post_id: postId, // This should be the ID of the post being commented on
      type: 'comment' as const, 
      mentioned_user_ids: mentionedUserIds.length > 0 ? mentionedUserIds : null,
      hashtags: hashtags.length > 0 ? hashtags : null,
      depth: 1,
      is_visible: true,
    };

    console.log("[COMMENT_SUBMIT_CALLBACK] Data to insert:", JSON.stringify(commentDataToInsert, null, 2));

    const { data: newComment, error } = await supabase.from('posts').insert(commentDataToInsert).select().single();
    
    if (error) { 
      console.error("[COMMENT_SUBMIT_CALLBACK] Supabase insert error:", error);
      setActionError(`Failed to submit comment: ${error.message}`); 
      setTimeout(() => setActionError(null), 3000); 
      return false; 
    }
    console.log("[COMMENT_SUBMIT_CALLBACK] Success. New comment data:", newComment);
    
    const updatedComments = await fetchCommentsForPost(postId);
    setPosts(prevPosts => 
      prevPosts.map(p => 
        p.id === postId 
          ? { ...p, commentCount: updatedComments.length } 
          : p
      )
    );
    return true;
  }, [supabase, currentUser, currentCommunityUuid, setPosts, setActionError, parseMentions, parseHashtags, fetchCommentsForPost]);

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
    setLimitExceededError(null);

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
    
    // Check if the user has reached their weekly limit for this post type
    if (postType && postType !== 'general' && postTypeLimits[postType] <= 0) {
      setLimitExceededError(`You've reached your weekly limit for ${postType} posts. Try again next week.`);
      setIsSubmitting(false);
      return;
    }

    try {
      let imageUrls: string[] = [];
      let videoUrl: string | null = null;
      let documentUrls: string[] = []; // NEW
      const files = formData.imageFile ? Array.from(formData.imageFile).slice(0, 10) : [];
      const videoFiles = formData.videoFile ? Array.from(formData.videoFile).slice(0, 1) : [];
      const docFiles = formData.documentFiles ? Array.from(formData.documentFiles) : []; // NEW

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

      // Handle document uploads
      for (const file of docFiles) {
        // Save documents in the correct community folder (Miami, Da Nang, Nha Trang)
        const folder = communityId ? communityId : 'General';
        const fileName = `${folder}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError }: { data: { path: string } | null, error: any } = await supabase.storage
          .from(FEED_DOCUMENTS_BUCKET)
          .upload(fileName, file);
        if (uploadError) {
          throw new Error(`Document upload failed: ${uploadError.message}`);
        }
        if (uploadData?.path) {
          const { data: publicUrlData } = supabase.storage
            .from(FEED_DOCUMENTS_BUCKET)
            .getPublicUrl(uploadData.path);
          if (publicUrlData?.publicUrl) {
            documentUrls.push(publicUrlData.publicUrl);
          }
        }
      }

      // Parse hashtags from the text content
      const postHashtags = parseHashtags(formData.textContent);
      // Parse mentions from the text content
      const mentionedIds = await parseMentions(formData.textContent);
      
      const newPostData: NewPostInsert & { 
        video_url?: string | null; 
        documents?: string[] | null;
        event_start_time?: string | null;
        event_end_time?: string | null;
        location_text?: string | null;
      } = {
        user_id: currentUser!.id,
        community_id: currentCommunityUuid!,
        type: postType || 'general',
        title: formData.title && formData.title.trim() !== '' ? formData.title.trim() : null,
        content: formData.textContent,
        images: imageUrls.length > 0 ? imageUrls : null,
        hashtags: postHashtags.length > 0 ? postHashtags : null,
        mentioned_user_ids: mentionedIds.length > 0 ? mentionedIds : null,
        is_visible: true,
        video_url: videoUrl,
        documents: documentUrls.length > 0 ? documentUrls : null, // NEW
      };

      // Create the post
      const { data: newPost, error: insertError } = await supabase.from('posts').insert(newPostData).select('id').single();

      if (insertError) {
        throw new Error(`Failed to create post: ${insertError.message}`);
      }

      // Handle special post types
      if (postType === 'event' && newPost?.id) {
        // Create event details
        await supabase.from('events').insert({
          post_id: newPost.id,
          event_start_time: formData.event_start_time,
          event_end_time: formData.event_end_time || null,
          location_text: formData.location_text,
          event_description: formData.textContent
        });
      } else if (postType === 'poll' && newPost?.id) {
        // Create poll and options
        await supabase.from('polls').insert({
          post_id: newPost.id,
          question: formData.title
        });
        
        // Insert poll options
        const validOptions = pollOptions.filter(option => option.trim() !== '');
        if (validOptions.length >= 2) {
          await supabase.from('poll_options').insert(
            validOptions.map(option => ({
              poll_post_id: newPost.id,
              option_text: option.trim()
            }))
          );
        }
      }

      // Update post type usage limit if it's a special post type
      if (postType && postType !== 'general') {
        const { data: existingLimit, error: limitCheckError } = await supabase
          .from('user_post_type_limits')
          .select('id, usage_count')
          .eq('user_id', currentUser.id)
          .eq('community_id', currentCommunityUuid)
          .eq('post_type', postType)
          .single();

        if (limitCheckError && limitCheckError.code !== 'PGRST116') { // Not found error
          console.error('Error checking limit:', limitCheckError);
        }

        if (existingLimit) {
          // Update existing limit
          await supabase
            .from('user_post_type_limits')
            .update({ 
              usage_count: existingLimit.usage_count + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingLimit.id);
        } else {
          // Create new limit record
          await supabase
            .from('user_post_type_limits')
            .insert({
              user_id: currentUser.id,
              community_id: currentCommunityUuid,
              post_type: postType,
              usage_count: 1,
              last_reset_at: new Date().toISOString()
            });
        }

        // Update local limits
        setPostTypeLimits(prev => ({
          ...prev,
          [postType]: Math.max(0, prev[postType] - 1)
        }));
      }

      setSubmitSuccess("Post created successfully!");
      reset({ 
        title: '', 
        textContent: '', 
        imageFile: null, 
        videoFile: null, 
        documentFiles: null,
        event_start_time: '',
        event_end_time: '',
        location_text: ''
      });
      setPostImagePreview(null); 
      setPostDocumentPreviews([]); // NEW
      await fetchFeedPosts(currentCommunityUuid!, currentUser?.id, filters, 1, POSTS_PER_PAGE);
      setShowCreatePostModal(false);
      setPostType(null); // Reset post type after posting
      setPollOptions(['', '']); // Reset poll options

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
    if (!currentCommunityUuid) {
      return;
    } 
    try {
      const { data, error } = await supabase
        .from('posts') 
        .select('hashtags')
        .eq('community_id', currentCommunityUuid)
        .not('hashtags', 'is', null); 

      if (error) {
        setCommunityUniqueHashtags([]);
        return;
      }
      if (data) {
        const allHashtags = data.flatMap(item => item.hashtags || []);
        const distinctHashtags = Array.from(new Set(allHashtags.filter(Boolean) as string[]));
        setCommunityUniqueHashtags(distinctHashtags.sort());
      }
    } catch (e) {
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
      fetchFeedPosts(currentCommunityUuid!, currentUser?.id, filters, 1, POSTS_PER_PAGE); // Refresh feed
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
      await fetchFeedPosts(currentCommunityUuid!, currentUser?.id, filters, 1, POSTS_PER_PAGE);
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
      await fetchFeedPosts(currentCommunityUuid!, currentUser?.id, filters, 1, POSTS_PER_PAGE);
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
      await fetchFeedPosts(currentCommunityUuid!, currentUser?.id, filters, 1, POSTS_PER_PAGE);
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

    // Only allow community admin
    if (!(currentUserRole === 'community admin')) {
        setActionError("Only community admins can pin posts.");
        setTimeout(() => setActionError(null), 3000);
        return false;
      }

    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_pinned: !currentPinStatus })
        .eq('id', postId);

      if (error) {
        setActionError(`Failed to ${currentPinStatus ? 'unpin' : 'pin'} post: ${error.message}`);
        setTimeout(() => setActionError(null), 3000);
        return false;
      }

      // Re-fetch posts to update order after pin/unpin
      if (!currentCommunityUuid) return true;
      await fetchFeedPosts(currentCommunityUuid, currentUser?.id, filters, 1, POSTS_PER_PAGE)        .then(result => {
          if (!result.error) setPosts(result.posts);
        });

      return true;
    } catch (e) {
      const err = e as Error;
      setActionError(`An unexpected error occurred: ${err.message}`);
      setTimeout(() => setActionError(null), 3000);
      return false;
    }
  }, [supabase, currentUser, currentUserRole, setActionError, currentCommunityUuid, filters]);

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
      await fetchFeedPosts(currentCommunityUuid!, currentUser?.id, filters, 1, POSTS_PER_PAGE);
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

  // Add hashchange event listener to scroll to post when hash changes
  useEffect(() => {
    async function handleHashChange() {
      if (window.location.hash.startsWith('#post-')) {
        const postId = window.location.hash.replace('#post-', '');
        // If post is not in the feed, fetch it and add to posts
        if (!posts.some(p => p.id === postId)) {
          try {
            // Ensure currentCommunityUuid is available before fetching and processing the post
            if (!currentCommunityUuid) {
              console.warn("[handleHashChange] currentCommunityUuid is not yet available. Skipping post fetch for hash.");
              return;
            }
            const { data: postData, error } = await supabase
              .from('community_feed_view')
              .select('*')
              .eq('id', postId)
              .single();
            if (!error && postData && postData.id) {
              // Map to PostData type (ensure all required fields for special types)
              const fallbackName = postData.author_username || 'Unknown User';
              const avatarUrl = (typeof postData.author_avatar_url === 'string' && postData.author_avatar_url)
                ? postData.author_avatar_url
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}`;
              const postType = postData.type || postData.post_type || 'general';
              const newPost = {
                id: postData.id,
                postAuthorUserId: postData.author_id || postData.user_id || postData.post_author_user_id,
                authorName: fallbackName,
                authorFullName: (postData as any).author_full_name || postData.author_username, // Ensure authorFullName is included
                authorRole: (postData as any).role || (postData as any).author_role, // Ensure authorRole is included
                authorIsLocationVerified: (postData as any).author_is_location_verified || false, // Ensure authorIsLocationVerified
                authorAvatarUrl: avatarUrl,
                timestamp: postData.created_at || new Date(0).toISOString(),
                textContent: postData.content || '',
                images: postData.images || [],
                imageUrl: postData.image_url || '',
                poll_id: postType === 'poll' ? (postData.id || postData.poll_id || null) : (postData.poll_id || null),
                is_pinned: (postData as any).is_pinned || false,
                likeCount: postData.like_count || 0,
                isLikedByCurrentUser: false, // Or fetch this if necessary for a single post
                commentCount: postData.comment_count || 0,
                updated_at: postData.updated_at || null,
                post_type: postType as ActualPostType | 'general', // Cast to ensure type compatibility
                title: postData.title || '',
                event_start_time: postData.event_start_time || null,
                event_end_time: typeof postData.event_end_time === 'string' ? postData.event_end_time : null,
                event_location_text: postData.event_location || '',
                event_description: postData.event_description || '',
                video_url: postData.video_url || '',
                documents: postData.documents || [],
                communityId: currentCommunityUuid, // <<< THE FIX
              };
              setPosts(prev => [newPost as PostData, ...prev.filter(p => p.id !== newPost.id)]); // Added PostData assertion and filter
              setTimeout(() => {
                const el = postRefs.current[postId];
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setHighlightedPost(postId);
                  setTimeout(() => setHighlightedPost(null), 2000);
                }
              }, 300);
              return;
            }
          } catch (e) { /* ignore */ }
        }
        // If post is already in feed, scroll as before
        setTimeout(() => {
          const el = postRefs.current[postId];
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedPost(postId);
            setTimeout(() => setHighlightedPost(null), 2000);
          }
        }, 300);
      }
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [posts, supabase, currentCommunityUuid]);

  // Modal state for Facebook-style popup
  const [modalPostId, setModalPostId] = useState<string | null>(null);

  // Emoji picker state for post form
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const EMOJIS = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😍','🥰','😘','😗','😚','😙','😋','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾'
  ];
  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showEmojiPicker]);
  // Insert emoji at cursor position
  const handleInsertEmoji = (emoji: string) => {
    const textarea = textContentRef.current;
    if (textarea) {
      const currentContent = watch('textContent') || '';
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newText = currentContent.substring(0, start) + emoji + currentContent.substring(end);
      setValue('textContent', newText, { shouldValidate: true, shouldDirty: true });

      // Set cursor position after the emoji in the next render cycle
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      });
    }
    setShowEmojiPicker(false); // Optionally close picker after selection
  };

  // State for create post modal
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  // Admin Post Creation State
  const [adminPostType, setAdminPostType] = useState<'event' | 'announce' | 'poll' | 'ask'>('event');
  const [adminPostFields, setAdminPostFields] = useState<any>({
    event: { title: '', description: '', date: '', time: '', location: '' },
    announce: { title: '', content: '' },
    poll: { question: '', option1: '', option2: '' },
    ask: { question: '' },
  });
  const [adminPostLoading, setAdminPostLoading] = useState(false);
  const [adminPostError, setAdminPostError] = useState<string | null>(null);
  const [adminPostSuccess, setAdminPostSuccess] = useState<string | null>(null);

  // Admin Post Creation Handler
  const handleAdminPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPostError(null);
    setAdminPostSuccess(null);
    setAdminPostLoading(true);
    try {
      if (!currentUser?.id || !currentCommunityUuid) throw new Error('Not authorized');
      let insertData: any = {
        user_id: currentUser.id,
        community_id: currentCommunityUuid,
        is_visible: true,
      };
      if (adminPostType === 'event') {
        const { title, description, date, time, location } = adminPostFields.event;
        if (!title || !description || !date || !time || !location) throw new Error('All fields required');
        insertData = { ...insertData, type: 'event', title, content: '', };
        const { data: postData, error: postError } = await supabase.from('posts').insert(insertData).select('id').single();
        if (postError || !postData?.id) throw new Error('Failed to create event post');
        await supabase.from('events').insert({ post_id: postData.id, event_start_time: new Date(`${date}T${time}`).toISOString(), location_text: location, event_description: description });
      } else if (adminPostType === 'announce') {
        const { title, content } = adminPostFields.announce;
        if (!title || !content) throw new Error('All fields required');
        insertData = { ...insertData, type: 'announce', title, content };
        await supabase.from('posts').insert(insertData);
      } else if (adminPostType === 'poll') {
        const { question } = adminPostFields.poll;
        // Use adminPollOptions for validation and saving
        const trimmedOptions = adminPollOptions.map(opt => opt.trim());
        if (!question || trimmedOptions.length < 2) throw new Error('At least 2 options required');
        if (trimmedOptions.length > 5) throw new Error('Maximum 5 options allowed');
        if (trimmedOptions.some(opt => !opt)) throw new Error('All option fields must be filled');
        insertData = { ...insertData, type: 'poll', title: question, content: question };
        const { data: postData, error: postError } = await supabase.from('posts').insert(insertData).select('id').single();
        if (postError || !postData?.id) throw new Error('Failed to create poll post');
        await supabase.from('polls').insert({ post_id: postData.id, question });
        await supabase.from('poll_options').insert(
          trimmedOptions.map((optionText: string) => ({ poll_post_id: postData.id, option_text: optionText }))
        );
      } else if (adminPostType === 'ask') {
        const { question, content } = adminPostFields.ask;
        if (!question || !content) throw new Error('Both heading and content required');
        insertData = { ...insertData, type: 'ask', title: question, content };
        await supabase.from('posts').insert(insertData);
      }
      setAdminPostSuccess('Post created!');
      setAdminPostFields({
        event: { title: '', description: '', date: '', time: '', location: '' },
        announce: { title: '', content: '' },
        poll: { question: '', option1: '', option2: '', option3: '', option4: '', option5: '' },
        ask: { question: '', content: '' },
      });
      setAdminPollOptions(['', '']);
      await fetchFeedPosts(currentCommunityUuid!, currentUser?.id, filters, 1, POSTS_PER_PAGE);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setAdminPostError(e.message || 'Error creating post');
      } else {
        setAdminPostError('Error creating post');
      }
    } finally {
      setAdminPostLoading(false);
    }
  };

  // Only show for admin
  const showAdminBox = currentUserRole === 'community admin';

  // For dynamic poll options in admin modal
  const [adminPollOptions, setAdminPollOptions] = useState<string[]>(['', '']);

  // Sync adminPollOptions with adminPostFields.poll
  useEffect(() => {
    setAdminPostFields((f: any) => ({
      ...f,
      poll: {
        ...f.poll,
        ...Object.fromEntries(adminPollOptions.map((opt, i) => [`option${i+1}`, opt]))
      }
    }));
  }, [adminPollOptions]);

  // Helper to add/remove poll options
  const handleAddPollOption = () => {
    if (adminPollOptions.length < 5) setAdminPollOptions(opts => [...opts, '']);
  };
  const handleRemovePollOption = (idx: number) => {
    if (adminPollOptions.length > 2) setAdminPollOptions(opts => opts.filter((_, i) => i !== idx));
  };
  const handlePollOptionChange = (idx: number, value: string) => {
    setAdminPollOptions(opts => opts.map((opt, i) => i === idx ? value : opt));
  };

  const [postDocumentPreviews, setPostDocumentPreviews] = useState<File[]>([]); // NEW

  // Add state for selected media tab
  const [selectedMediaTab, setSelectedMediaTab] = useState<'image' | 'video' | 'document'>('image');

  // Memoized filtered posts for right sidebar (events and questions, random order)
  const mainFeedPosts = useMemo(() => {
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    // The `posts` array is already filtered by `filters.postType` from the server
    // if a specific type was selected in FeedFilterSortBar. If `filters.postType` is 'all',
    // `posts` will contain all types. We just apply the recency filter here.
    const recentPosts = posts.filter(p => {
      const created = new Date(p.timestamp).getTime();
      return now - created <= ninetyDaysMs;
    });
    return recentPosts;
  }, [posts]); // Only depends on `posts`. Changes to `filters.postType` trigger a fetch, updating `posts`.

  // Add this wrapper above the return statement
  const handleUpdatePostWrapper = useCallback(
    (postId: string, newContent: string) => handleUpdatePost(postId, newContent, false),
    [handleUpdatePost]
  );

  // Function to fetch user post type limits
  const fetchUserPostTypeLimits = useCallback(async () => {
    if (!currentUser?.id || !currentCommunityUuid) return;
    
    try {
      // First, check if limits exist for this user
      const { data: existingLimits, error: limitsError } = await supabase
        .from('user_post_type_limits')
        .select('post_type, usage_count')
        .eq('user_id', currentUser.id)
        .eq('community_id', currentCommunityUuid);
      
      if (limitsError) {
        console.error('Error fetching post type limits:', limitsError);
        return;
      }
      
      // If no limits exist, create default limits
      if (!existingLimits || existingLimits.length === 0) {
        const defaultLimits = {
          event: 1,
          announce: 1, 
          poll: 1,
          ask: 1
        };
        
        setPostTypeLimits(defaultLimits);
        return;
      }
      
      // Update state with the limits
      const limits: {[key: string]: number} = {
        event: 1,
        announce: 1,
        poll: 1,
        ask: 1
      };
      
      existingLimits.forEach(limit => {
        // For each post type, calculate remaining posts
        // 1 - usage_count = remaining posts
        const remaining = Math.max(0, 1 - limit.usage_count);
        limits[limit.post_type] = remaining;
      });
      
      setPostTypeLimits(limits);
    } catch (error) {
      console.error('Error fetching post type limits:', error);
    }
  }, [supabase, currentUser, currentCommunityUuid]);
  
  // Poll option functions
  const handleUserAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };
  
  const handleUserRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };
  
  const handleUserPollOptionChange = (idx: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[idx] = value;
    setPollOptions(newOptions);
  };

  // Load post type limits when user or community changes
  useEffect(() => {
    if (currentUser?.id && currentCommunityUuid) {
      fetchUserPostTypeLimits();
    }
  }, [currentUser?.id, currentCommunityUuid, fetchUserPostTypeLimits]);

  // Reset post type when modal is closed
  useEffect(() => {
    if (!showCreatePostModal) {
      setPostType(null);
      setPollOptions(['', '']);
      setLimitExceededError(null);
    }
  }, [showCreatePostModal]);

  // Reset post type and clear limit error when modal is closed or postType changes
  useEffect(() => {
    if (!showCreatePostModal) {
      setPostType(null);
      setPollOptions(['', '']);
      setLimitExceededError(null); // Clear limit error when modal closes
    }
    // Clear limit error if postType changes, and set it if limit is 0 for the new type
    if (postType && postType !== 'general' && postType !== null && postTypeLimits[postType] <= 0) {
      setLimitExceededError(`1 per week limit. Try again next week.`);
    } else {
      setLimitExceededError(null);
    }
  }, [showCreatePostModal, postType, postTypeLimits]); // Added postTypeLimits to dependencies

  const handleLoadMore = useCallback(async () => {
    if (isLoadingPosts || isLoadingMorePosts || posts.length >= totalPostsCount) {
      return; // Don't load if already loading, or if all posts are loaded
    }

    setIsLoadingMorePosts(true);
    const nextPage = currentPage + 1;

    fetchFeedPosts(currentCommunityUuid!, currentUser ? currentUser.id : null, filters, nextPage, POSTS_PER_PAGE)
      .then(result => {
        if (result.error) {
          setFetchPostsError(result.error); // Optionally handle this error specifically for "load more"
        } else {
          setPosts(prevPosts => [...prevPosts, ...result.posts]);
          setCurrentPage(nextPage);
          // totalPostsCount should already be set by the initial load, but good to ensure it's not reset here
          // setTotalPostsCount(result.totalCount || 0); 
        }
      })
      .catch(e => {
        console.error("Error in handleLoadMore:", e);
        setFetchPostsError("Failed to load more posts."); // Optionally handle this error
      })
      .finally(() => {
        setIsLoadingMorePosts(false);
      });
  }, [isLoadingPosts, isLoadingMorePosts, posts.length, totalPostsCount, currentPage, currentCommunityUuid, currentUser, filters, fetchFeedPosts]);

  // useEffect for initial load and filter changes
  useEffect(() => {
    if (currentCommunityUuid && currentUser !== undefined) {
      setPosts([]); 
      setCurrentPage(1); 
      setTotalPostsCount(0);
      setIsLoadingPosts(true);
      setFetchPostsError(null);

      fetchFeedPosts(currentCommunityUuid, currentUser ? currentUser.id : null, filters, 1, POSTS_PER_PAGE)
        .then(result => {
          if (result.error) {
            setFetchPostsError(result.error);
            setPosts([]);
            setTotalPostsCount(0);
          } else {
            setPosts(result.posts);
            setTotalPostsCount(result.totalCount || 0);
            setFetchPostsError(null);
          }
        })
        .catch(e => {
          console.error("Error in initial post fetch useEffect:", e);
          setFetchPostsError("Failed to load feed.");
          setPosts([]);
          setTotalPostsCount(0);
        })
        .finally(() => {
          setIsLoadingPosts(false);
        });
    }
  }, [currentCommunityUuid, currentUser, filters, fetchFeedPosts]);

  // useEffect for real-time subscriptions
  useEffect(() => {
    if (!communityId || !supabase) return;
    const channel = supabase
      .channel(`realtime-community-feed-${communityId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `community_id=eq.${communityId}`},
        async (payload) => {
          const newPostRecord = payload.new as Database["public"]["Tables"]["posts"]["Row"];
          if (newPostRecord && newPostRecord.id && (newPostRecord as any).parent_post_id === null) {
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
                    authorFullName: typedViewData.author_full_name,
                    authorRole: (typedViewData as any).role || (typedViewData as any).author_role, // UPDATED: Prefer typedViewData.role
                    authorAvatarUrl: typedViewData.author_avatar_url,
                    timestamp: typedViewData.created_at || new Date(0).toISOString(),
                    textContent: typedViewData.content || '',
                    images: typedViewData.images || [],
                    imageUrl: typedViewData.image_url,
                    poll_id: typedViewData.type === 'poll' ? typedViewData.id : (typedViewData.poll_id ?? null), // FIX: use id for poll posts
                    is_pinned: (typedViewData as any).is_pinned || false, // Type assertion for is_pinned
                    likeCount: typedViewData.like_count || 0,
                    isLikedByCurrentUser: posts.find(p => p.id === typedViewData.id)?.isLikedByCurrentUser || false, // Preserve if already known, else false
                    commentCount: typedViewData.comment_count || 0,
                    updated_at: typedViewData.updated_at || null,
                    post_type: typedViewData.type as ActualPostType | 'general',
                    title: typedViewData.title, // Add title from post data
                    event_start_time: typedViewData.event_start_time,
                    event_end_time: typeof typedViewData.event_end_time === 'string' ? typedViewData.event_end_time : null,
                    event_location_text: typedViewData.event_location, // <-- Fix: map event_location to event_location_text
                    event_description: typedViewData.event_description,
                    video_url: typedViewData.video_url,
                    documents: typedViewData.documents || [],
                    communityId: typedViewData.community_id,
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
          } else if (newPostRecord && (newPostRecord as any).parent_post_id !== null) {
            setPosts(currentPosts => currentPosts.map(p => 
              p.id === (newPostRecord as any).parent_post_id 
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
  }, [supabase, communityId, setPosts, currentUser, fetchFeedPosts, currentCommunityUuid]); // <<< ADD currentCommunityUuid to dependency array

  // NEW: Handler for RSVP actions
  const handleRsvpAction = useCallback(async (postId: string, rsvpStatus: 'yes' | 'no' | 'maybe'): Promise<boolean> => {
    if (!currentUser) {
      setActionError("You must be logged in to RSVP.");
      setTimeout(() => setActionError(null), 3000);
      return false;
    }
    if (!currentCommunityUuid) {
      setActionError("Community information not found. Cannot RSVP.");
      setTimeout(() => setActionError(null), 3000);
      return false;
    }
    setActionError(null);

    try {
      const { error } = await supabase
        .from('event_rsvps')
        .upsert(
          {
            event_post_id: postId,
            user_id: currentUser.id,
            status: rsvpStatus,
            // created_at and updated_at will be handled by DB defaults/triggers
          },
          {
            onConflict: 'event_post_id,user_id', // This ensures it updates if a record for this user & event exists
          }
        );

      if (error) {
        console.error("Error submitting RSVP:", error);
        setActionError(`Failed to submit RSVP: ${error.message}`);
        setTimeout(() => setActionError(null), 3000);
        return false;
      }
      return true; // Indicate success
    } catch (e) {
      const err = e as Error;
      console.error("Unexpected error submitting RSVP:", err);
      setActionError(`An unexpected error occurred: ${err.message}`);
      setTimeout(() => setActionError(null), 3000);
      return false;
    }
  }, [supabase, currentUser, currentCommunityUuid, setActionError]);

  return (
    <div className="min-h-screen bg-sky-50 p-4 sm:p-6 md:p-8">
      {/* Create Post Modal */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto py-10">
          <div className="bg-white rounded-2xl shadow-2xl border border-cyan-100 w-full max-w-lg p-4 sm:p-8 relative mx-2 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-700"
              onClick={() => setShowCreatePostModal(false)}
              aria-label="Close modal"
            >
              &times;
            </button>
            <div className="text-xl font-bold mb-6 text-cyan-800">Create a new...</div>
            
            {/* Post Type Selection */}
            <div className="flex justify-center items-center gap-4 mb-6">
              {/* FIRST BUTTON - REGULAR POST (SELECTED) */}
              <button 
                type="button"
                onClick={() => setPostType('general')}
                className={`${postType === 'general' || postType === null ? 'bg-cyan-600 text-white' : 'bg-white text-cyan-500'} rounded-full w-14 h-14 flex items-center justify-center shadow transition-all`}
                title="Regular Post"
              >
                {/* List icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* SECOND BUTTON - ASK */}
              <button 
                type="button"
                onClick={() => setPostType('ask')}
                className={`${postType === 'ask' ? 'bg-cyan-600 text-white' : 'bg-cyan-50 text-cyan-500'} rounded-full w-14 h-14 flex items-center justify-center shadow transition-all`}
                title="Ask a Question"
              >
                {/* Question mark icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              {/* THIRD BUTTON - ANNOUNCE */}
              <button 
                type="button"
                onClick={() => setPostType('announce')}
                className={`${postType === 'announce' ? 'bg-cyan-600 text-white' : 'bg-cyan-50 text-cyan-500'} rounded-full w-14 h-14 flex items-center justify-center shadow transition-all`}
                title="Make an Announcement"
              >
                {/* Megaphone icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </button>
              
              {/* FOURTH BUTTON - EVENT */}
              <button 
                type="button"
                onClick={() => setPostType('event')}
                className={`${postType === 'event' ? 'bg-cyan-600 text-white' : 'bg-cyan-50 text-cyan-500'} rounded-full w-14 h-14 flex items-center justify-center shadow transition-all`}
                title="Create an Event"
              >
                {/* Calendar icon */}
                <Calendar className="h-6 w-6 stroke-[2.5px]" />
              </button>
              
              {/* FIFTH BUTTON - POLL */}
              <button 
                type="button"
                onClick={() => setPostType('poll')}
                className={`${postType === 'poll' ? 'bg-cyan-600 text-white' : 'bg-cyan-50 text-cyan-500'} rounded-full w-14 h-14 flex items-center justify-center shadow transition-all`}
                title="Create a Poll"
              >
                {/* Bar chart icon */}
                <BarChart3 className="h-6 w-6 stroke-[2.5px]" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
              {/* Show title field for ask/event/announce/poll types */}
              {(postType === 'ask' || postType === 'event' || postType === 'announce' || postType === 'poll') && (
              <div className="relative">
                  <label className="block font-semibold text-slate-700 mb-2">
                    {postType === 'ask' ? 'Question' : 
                     postType === 'event' ? 'Event Title' : 
                     postType === 'announce' ? 'Announcement Title' : 
                     'Poll Question'}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('title', { required: true })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                    placeholder={
                      postType === 'ask' ? 'Ask your question...' : 
                      postType === 'event' ? 'Event title...' : 
                      postType === 'announce' ? 'Announcement title...' : 
                      'Ask a question...'
                    }
                    disabled={isSubmitting}
                    name="title"
                  />
                  {errors.title && (
                    <div className="text-red-600 text-sm mt-1">Title is required.</div>
                  )}
                </div>
              )}

              {/* REMOVE THIS BLOCK for (postType === 'general' || postType === null) */}
              {/* 
              {(postType === 'general' || postType === null) && (
                <div>
                  <label htmlFor="textContentGeneral" className="block font-semibold text-slate-700 mb-2">
                    What's on your mind?
                  </label>
                  <MentionTextarea
                    value={textContentValue}
                    setValue={(value) => setValue('textContent', value, { shouldValidate: true, shouldDirty: true })}
                    communityId={currentCommunityUuid || ''}
                    placeholder="Share something with the community @mention..."
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                    rows={5}
                  />
                  {errors.textContent && (
                    <p className="text-red-500 text-xs mt-1">{errors.textContent.message || "Content is required."}</p>
                  )}
                </div>
              )}
              */}

              {/* REMOVE THIS BLOCK for postType === 'event' (textContent) */}
              {/*
              {postType === 'event' && (
                <div>
                  <label htmlFor="eventDescription" className="block font-semibold text-slate-700 mb-2">
                    Event Description
                  </label>
                <textarea
                    {...register('textContent')} 
                    placeholder="Describe your event..."
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              )}
              */}
              {/* REMOVE THIS BLOCK for postType === 'ask' (textContent) */}
              {/*
               {postType === 'ask' && (
                <div>
                  <label htmlFor="askContext" className="block font-semibold text-slate-700 mb-2">
                    Additional Context (Optional)
                  </label>
                  <textarea
                    {...register('textContent')} 
                    placeholder="Add more details to your question..."
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              )}
              */}
              {/* REMOVE THIS BLOCK for postType === 'announce' (textContent) */}
              {/*
              {postType === 'announce' && (
                <div>
                  <label htmlFor="announceDetails" className="block font-semibold text-slate-700 mb-2">
                    Announcement Details
                  </label>
                  <textarea
                    {...register('textContent')} 
                    placeholder="Share the details..."
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              )}
              */}

              {/* Poll options - specific to poll type - THIS REMAINS AS IS */}
              {postType === 'poll' && (
                <div className="space-y-6"> 
                  <div className="space-y-4">
                    <label className="block font-semibold text-slate-700 mb-3">Poll Options<span className="text-red-500">*</span></label>
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex gap-3 mb-3">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleUserPollOptionChange(index, e.target.value)}
                          className="flex-1 border border-slate-300 rounded-lg px-4 py-3 bg-slate-50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                          placeholder={`Option ${index + 1}`}
                          disabled={isSubmitting}
                        />
                        {index > 1 && (
                          <button
                            type="button"
                            onClick={() => handleUserRemovePollOption(index)}
                            className="p-3 text-red-500 hover:text-red-700"
                            disabled={isSubmitting}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 5 && (
                      <button
                        type="button"
                        onClick={handleUserAddPollOption}
                        className="mt-3 text-sm text-cyan-600 hover:text-cyan-800 flex items-center"
                        disabled={isSubmitting || pollOptions.length >= 10} // Added max limit safeguard
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Add Option
                      </button>
                    )}
                    {pollOptions.length < 2 && <p className="text-xs text-red-500">At least two options are required for a poll.</p>}
                  </div>
                </div>
              )}
              
              {/* Special fields for event type (excluding description, which is now handled by the consolidated textContent field below) */}
              {postType === 'event' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-2">Start Date & Time<span className="text-red-500">*</span></label>
                      <input
                        type="datetime-local"
                        {...register('event_start_time', { required: postType === 'event' })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                        disabled={isSubmitting}
                      />
                      {errors.event_start_time && (
                        <div className="text-red-600 text-sm mt-1">Start time is required.</div>
                      )}
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-2">End Date & Time<span className="text-red-500">*</span></label>
                      <input
                        type="datetime-local"
                        {...register('event_end_time', { required: postType === 'event' })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                        disabled={isSubmitting}
                      />
                       {/* RHF will handle error display if configured for event_end_time */}
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-2">Location<span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      {...register('location_text', { required: postType === 'event' })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                      placeholder="Enter event location..."
                      disabled={isSubmitting}
                    />
                    {errors.location_text && (
                      <div className="text-red-600 text-sm mt-1">Location is required.</div>
                    )}
                  </div>
                </div>
              )}

              {/* REMOVE THIS BLOCK for postType === 'ask' (title was 'Question', textContent was 'Details') - title is handled above, textContent by consolidated block */}
              {/*
              {postType === 'ask' && (
                // ...
              )}
              */}

              {/* REMOVE THIS BLOCK for postType === 'announce' (title was 'Title', textContent was 'Details') - title is handled above, textContent by consolidated block */}
              {/*
              {postType === 'announce' && (
                // ...
              )}
              */}
              
              {/* REMOVE THIS BLOCK for postType === 'poll' (title was 'Question') - title handled above, poll has no main textContent, only options */}
              {/*
              {postType === 'poll' && (
                // ...
              )}
              */}

              {/* CONSOLIDATED TEXTCONTENT INPUT AREA */}
              {/* This block will render for general, event, ask, announce. */}
              {(postType === 'general' || postType === null || postType === 'event' || postType === 'ask' || postType === 'announce') && (
                <div className="relative">
                  <label className="block font-semibold text-slate-700 mb-2">
                    {postType === 'ask' ? 'Details (Optional)' : 
                     postType === 'event' ? 'Event Description' : 
                     postType === 'announce' ? 'Announcement Details' : 
                     /* For general or null postType */ 'Post'} 
                    {/* Add * for required types (general, event, announce) */}
                    {(postType === 'general' || postType === null || postType === 'event' || postType === 'announce') && 
                     <span className="text-red-500">*</span>}
                  </label>
                  
                  {(postType === 'general' || postType === null) ? (
                    <MentionTextarea
                      ref={textContentRef} // <<< PASS REF
                      value={textContentValue}
                      setValue={(value) => setValue('textContent', value, { 
                        shouldValidate: true, // General posts require content
                        shouldDirty: true 
                      })}
                      communityId={currentCommunityUuid || ''}
                      placeholder="What's on your mind? @mention someone..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-12 bg-slate-50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 resize-none min-h-[100px]"
                      rows={4}
                    />
                  ) : (
                    /* For event, ask, announce - use standard textarea */
                    <textarea
                      {...register('textContent', { 
                        required: (postType === 'event' || postType === 'announce') 
                                    ? 'This field is required.' 
                                    : false // 'ask' details are optional
                      })}
                      ref={textContentRef} // <<< PASS REF
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-12 bg-slate-50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 resize-none min-h-[100px]"
                      placeholder={
                        postType === 'ask' ? 'Provide more details for your question (optional)...' : 
                        postType === 'event' ? 'Describe your event...' : 
                        postType === 'announce' ? 'Write your announcement details...' : 
                        "What's on your mind?" // Should not be hit if logic is correct
                      }
                  rows={4}
                  disabled={isSubmitting}
                  name="textContent"
                />
                  )}
                  
                <button
                  type="button"
                  ref={emojiButtonRef}
                  className="absolute top-8 right-3 text-2xl text-cyan-500 hover:text-cyan-700"
                  onClick={() => setShowEmojiPicker(v => !v)}
                  tabIndex={-1}
                >
                  😊
                </button>
                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute z-30 right-0 mt-2 bg-white border border-cyan-200 rounded-xl shadow-2xl p-4 w-96 max-h-72 overflow-y-auto grid grid-cols-10 gap-2">
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-lg text-gray-400 hover:text-gray-700"
                      onClick={() => setShowEmojiPicker(false)}
                      tabIndex={-1}
                      aria-label="Close emoji picker"
                    >
                      &times;
                    </button>
                    {EMOJIS.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="text-2xl p-1 hover:bg-cyan-50 rounded focus:outline-none"
                        onClick={() => handleInsertEmoji(emoji)}
                        tabIndex={0}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                  {/* Error display for textContent, considering its requirement based on postType */}
                  {errors.textContent && 
                    (postType === 'general' || postType === null || postType === 'event' || postType === 'announce') && (
                    <div className="text-red-600 text-sm mt-1">
                      {errors.textContent.message || 'Content is required.'}
                    </div>
                )}
              </div>
              )}
              
              {/* Media Tabs and Uploads - THIS SECTION REMAINS AS IS */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setSelectedMediaTab('image')} className={`px-4 py-1 rounded-t-lg font-semibold border-b-2 ${selectedMediaTab === 'image' ? 'border-cyan-600 text-cyan-700 bg-cyan-50' : 'border-transparent text-gray-500 bg-transparent'}`}>Image</button>
                  <button type="button" onClick={() => setSelectedMediaTab('video')} className={`px-4 py-1 rounded-t-lg font-semibold border-b-2 ${selectedMediaTab === 'video' ? 'border-cyan-600 text-cyan-700 bg-cyan-50' : 'border-transparent text-gray-500 bg-transparent'}`}>Video</button>
                  <button type="button" onClick={() => setSelectedMediaTab('document')} className={`px-4 py-1 rounded-t-lg font-semibold border-b-2 ${selectedMediaTab === 'document' ? 'border-cyan-600 text-cyan-700 bg-cyan-50' : 'border-transparent text-gray-500 bg-transparent'}`}>Document</button>
                </div>
                {selectedMediaTab === 'image' && (
                  <div>
                    <label className="font-semibold text-slate-700 mb-1">Image(s)</label>
                    <input
                      type="file"
                      id="modalImageFile" // Ensure unique ID
                      accept="image/png, image/jpeg, image/gif, image/webp"
                      multiple
                      // Remove direct RHF register, manage through stagedImageFiles and custom onChange
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFileUploadError(null);
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
                          const currentFilesArray = Array.from(files);
                          
                          const validFiles = currentFilesArray.filter((file: File) => allowedTypes.includes(file.type));
                          const invalidFiles = currentFilesArray.filter((file: File) => !allowedTypes.includes(file.type));

                          if (invalidFiles.length > 0) {
                            setFileUploadError("File type not supported");
                            // Keep existing valid staged files, don't add invalid ones
                            // If you want to clear all on any invalid, then: setStagedImageFiles([]); setValue('imageFile', null);
                          }
                          
                          // Add new valid files to existing staged files, up to a limit (e.g., 10)
                          const newStagedFiles = [...stagedImageFiles, ...validFiles].slice(0, 10);
                          setStagedImageFiles(newStagedFiles);
                          setValue('imageFile', createFileListFromFileArray(newStagedFiles), { shouldValidate: true });
                          
                        } else {
                          // No files selected in this interaction, do nothing to staged files unless explicitly clearing
                        }
                        e.target.value = ''; // Reset input to allow re-selecting the same file if needed
                      }}
                      disabled={isSubmitting}
                      className="block w-full border border-slate-300 rounded-lg bg-slate-50 px-3 py-2 cursor-pointer focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                    />
                    {/* Display File Upload Error for modal */}
                    {fileUploadError && (
                      <div className="text-red-600 text-sm mt-2">{fileUploadError}</div>
                    )}
                    {/* Previews based on stagedImageFiles */}
                    {stagedImageFiles.length > 0 && !fileUploadError && (
                      <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                        {stagedImageFiles.map((file, idx) => (
                          <div key={idx} className="relative group flex-shrink-0">
                          <img
                              src={URL.createObjectURL(file)} // Create new URL for preview
                            alt={`Preview ${idx + 1}`}
                              className="rounded-lg border border-slate-200 h-20 w-20 object-cover shadow-sm"
                            style={{ minWidth: 80, minHeight: 80 }}
                              onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)} // Revoke after load to prevent memory leaks if not unmounted
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newFiles = stagedImageFiles.filter((_, i) => i !== idx);
                                setStagedImageFiles(newFiles);
                                setValue('imageFile', createFileListFromFileArray(newFiles), { shouldValidate: true });
                                if (newFiles.length === 0) setFileUploadError(null); // Clear error if all removed
                              }}
                              className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 leading-none opacity-75 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {selectedMediaTab === 'video' && (
                  <div>
                    <label htmlFor="modalVideoFile" className="font-semibold text-slate-700 mb-1">Video</label>
                    <p className="text-xs text-slate-500 mb-1">Supported types: MP4, MOV, WebM, AVI, MKV</p> {/* Added this line */}
                    <input
                      type="file"
                      id="modalVideoFile" // Added ID
                      accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,.mkv" // Updated accepted types for MP4, MOV, WebM, AVI, MKV
                      // {...register('videoFile')} // Remove direct RHF register, manage through custom onChange
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Define max size (e.g., 100MB)
                          const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; 
                          const ALLOWED_VIDEO_TYPES = [
                            'video/mp4', 
                            'video/quicktime', // .mov
                            'video/webm',
                            'video/x-msvideo', // .avi
                            'video/x-matroska'  // .mkv
                          ];

                          if (file.size > MAX_VIDEO_SIZE_BYTES) {
                            setFileUploadError(`Video file is too large. Maximum size is ${MAX_VIDEO_SIZE_BYTES / 1024 / 1024} MB.`);
                            setPostVideoPreview(null);
                            setValue('videoFile', null);
                            e.target.value = ''; // Clear the input
                            return;
                          }

                          // Updated type check
                          if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
                            setFileUploadError("Invalid file type. Please upload MP4, MOV, WebM, AVI, or MKV videos.");
                            setPostVideoPreview(null);
                            setValue('videoFile', null);
                            e.target.value = ''; // Clear the input
                            return;
                          }
                          setFileUploadError(null); // Clear any previous file errors
                          const objectUrl = URL.createObjectURL(file);
                          setPostVideoPreview(objectUrl);
                          setValue('videoFile', e.target.files, { shouldValidate: true });
                        } else {
                          setPostVideoPreview(null);
                          setValue('videoFile', null);
                        }
                      }}
                      disabled={isSubmitting}
                      className="block w-full border border-slate-300 rounded-lg bg-slate-50 px-3 py-2 cursor-pointer focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                    />
                    {postVideoPreview && (
                      <div className="mt-2 relative">
                        <video src={postVideoPreview} controls className="rounded-lg border border-slate-200 max-h-40 w-full shadow-sm" />
                        <button
                          type="button"
                          onClick={() => {
                            if (postVideoPreview && postVideoPreview.startsWith('blob:')) {
                              URL.revokeObjectURL(postVideoPreview);
                            }
                            setPostVideoPreview(null);
                            setValue('videoFile', null);
                            const input = document.getElementById('modalVideoFile') as HTMLInputElement;
                            if (input) input.value = ''; // Clear the file input
                            setFileUploadError(null); // Clear error when video is removed
                          }}
                          className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                          aria-label="Remove video"
                        >
                          Remove Video
                        </button>
                      </div>
                    )}
                    {/* Display File Upload Error for video if it's different from the general one */}
                    {fileUploadError && selectedMediaTab === 'video' && (
                       <div className="text-red-600 text-sm mt-2">{fileUploadError}</div>
                    )}
                  </div>
                )}
                {selectedMediaTab === 'document' && (
                  <div>
                    <label className="font-semibold text-slate-700 mb-1">Document(s)</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.md"
                      multiple
                      {...register('documentFiles')}
                      disabled={isSubmitting}
                      className="block w-full border border-slate-300 rounded-lg bg-slate-50 px-3 py-2 cursor-pointer focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                    />
                    {postDocumentPreviews.length > 0 && (
                      <ul className="mt-2 text-xs text-slate-700 list-none space-y-1">
                        {postDocumentPreviews.map((file, idx) => (
                          <li key={idx} className="flex items-center gap-2 bg-slate-100 rounded px-2 py-1">
                            <span className="text-lg">📄</span>
                            <span className="truncate">{file.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              {submitError && <div className="text-red-600 text-sm mt-2">{submitError}</div>}
              {/* Display limit exceeded error */} 
              {limitExceededError && (
                <div className="mt-2 p-2 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
                  {limitExceededError}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-cyan-600 text-white rounded-lg font-bold text-lg hover:bg-cyan-700 transition shadow-md disabled:opacity-60 mt-2"
                disabled={isSubmitting || !!limitExceededError || (postType !== 'general' && postType !== null && postTypeLimits[postType] <= 0)}
              >
                {isSubmitting ? 'Posting...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      )}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-sky-800">
            {displayCommunityName} - Coastline Chatter
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            See what's new and join the conversation!
          </p>
        </div>
      </header>
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
      {/* Feed Filter and Sort Bar */}
      <FeedFilterSortBar 
        currentFilters={filters}
        currentSort={filters.sortBy}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
      />
      
      {/* Facebook-style Create Post Card */}
      <div
        className="bg-white shadow-md rounded-lg p-4 sm:p-5 my-6 cursor-pointer hover:shadow-lg transition flex items-center gap-3"
        onClick={() => {
          // When clicking the bar, if no file is pre-selected for error, clear any old file error.
          // If a file was just selected via the quick input, that input's onChange handles the error.
          if (!document.getElementById('quick-image-upload') || !(document.getElementById('quick-image-upload') as HTMLInputElement).files?.length) {
            setFileUploadError(null);
          }
          setShowCreatePostModal(true);
        }}
        tabIndex={0}
        role="button"
        aria-label="Create post"
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowCreatePostModal(true);
          }
        }}
      >
        {currentUser?.user_metadata?.avatar_url ? (
              <ImageNext
                src={currentUser.user_metadata.avatar_url}
                alt="User Avatar"
            width={40}
            height={40}
                className="rounded-full"
              />
            ) : (
          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-lg">
            {currentUser?.user_metadata?.username?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1">
          <div
            className="w-full border border-slate-300 rounded-full px-4 py-2 text-gray-500 text-base bg-slate-50 hover:bg-slate-100 focus:outline-none cursor-pointer"
          >
            {`What's on your mind, ${currentUser?.user_metadata?.username || currentUser?.email || displayCommunityName}?`}
            </div>
          </div>
        </div>
      
      {/* ADMIN POST CREATION BOX */}
      {showAdminBox && (
        <div className="w-full max-w-2xl mx-auto mb-8 rounded-2xl shadow-lg border-2 border-cyan-400 bg-gradient-to-br from-cyan-50 to-cyan-100 p-6">
          <div className="flex gap-2 mb-4">
            {(['event','announce','poll','ask'] as const).map(type => (
              <button
                key={type}
                onClick={() => setAdminPostType(type)}
                className={`px-4 py-2 rounded font-bold text-base transition-colors duration-150 ${adminPostType===type ? 'bg-cyan-600 text-white shadow' : 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'}`}
              >
                {type==='event' ? 'Event' : type==='announce' ? 'Announcement' : type==='poll' ? 'Poll' : 'Ask'}
              </button>
            ))}
          </div>
          {/* Event Description Field for Admin */}
          {adminPostType==='event' && (
            <div className="mb-2">
              <textarea
                className="w-full border border-slate-300 rounded px-3 py-2"
                placeholder="Event Description"
                value={adminPostFields.event.description || ''}
                onChange={e=>setAdminPostFields((f:any)=>({...f,event:{...f.event,description:e.target.value}}))}
                rows={2}
                disabled={adminPostLoading}
              />
            </div>
          )}
          {/* Poll Modal Popup */}
          {adminPostType==='poll' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-40">
              <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-md relative">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl bg-cyan-50">
                    <div className="text-lg font-bold text-cyan-800">Create a Poll</div>
                    <button className="text-gray-400 hover:text-gray-700 text-2xl" onClick={()=>setAdminPostType('event')}>&times;</button>
                  </div>
                  <form onSubmit={handleAdminPostSubmit} className="space-y-4 px-6 py-6">
                    <input type="text" className="w-full border-2 border-cyan-200 rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400" placeholder="Poll Question" value={adminPostFields.poll.question} onChange={e=>setAdminPostFields((f:any)=>({...f,poll:{...f.poll,question:e.target.value}}))} disabled={adminPostLoading} />
                    <div className="space-y-2">
                      {adminPollOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input type="text" className="flex-1 border-2 border-cyan-100 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300" placeholder={`Option ${i+1}${i<2?' (required)':''}`} value={opt} onChange={e=>handlePollOptionChange(i, e.target.value)} disabled={adminPostLoading} />
                          {adminPollOptions.length > 2 && (
                            <button type="button" className="text-red-500 hover:bg-red-100 rounded-full p-1" onClick={()=>handleRemovePollOption(i)} title="Remove option" disabled={adminPostLoading}>&times;</button>
            )}
          </div>
                      ))}
                      <div className="flex justify-end mt-2">
                        <button type="button" className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-lg font-semibold hover:bg-cyan-200 transition disabled:opacity-50" onClick={handleAddPollOption} disabled={adminPollOptions.length>=5 || adminPostLoading}>+ Add Option</button>
        </div>
                  </div>
                    {adminPostError && <div className="text-red-600 text-sm">{adminPostError}</div>}
                    {adminPostSuccess && <div className="text-green-600 text-sm">{adminPostSuccess}</div>}
                    <button type="submit" className="w-full py-3 bg-cyan-600 text-white rounded-lg font-bold text-lg hover:bg-cyan-700 transition shadow-md disabled:opacity-60" disabled={adminPostLoading}>{adminPostLoading ? 'Posting...' : 'Post Poll'}</button>
                  </form>
                </div>
            </div>
          </div>
        )}
          {/* Inline forms for other types */}
          {adminPostType!=='poll' && (
            <form onSubmit={handleAdminPostSubmit} className="space-y-3">
              {adminPostType==='event' && (
                <>
                  <input type="text" className="w-full border rounded px-3 py-2" placeholder="Event Title" value={adminPostFields.event.title} onChange={e=>setAdminPostFields((f:any)=>({...f,event:{...f.event,title:e.target.value}}))} disabled={adminPostLoading} />
                  <div className="flex gap-2">
                    <input type="date" className="flex-1 border rounded px-3 py-2" value={adminPostFields.event.date} onChange={e=>setAdminPostFields((f:any)=>({...f,event:{...f.event,date:e.target.value}}))} disabled={adminPostLoading} />
                    <input type="time" className="flex-1 border rounded px-3 py-2" value={adminPostFields.event.time} onChange={e=>setAdminPostFields((f:any)=>({...f,event:{...f.event,time:e.target.value}}))} disabled={adminPostLoading} />
          </div>
                  <input type="text" className="w-full border rounded px-3 py-2" placeholder="Location" value={adminPostFields.event.location} onChange={e=>setAdminPostFields((f:any)=>({...f,event:{...f.event,location:e.target.value}}))} disabled={adminPostLoading} />
                </>
              )}
              {adminPostType==='announce' && (
                <>
                  <input type="text" className="w-full border rounded px-3 py-2" placeholder="Announcement Title" value={adminPostFields.announce.title} onChange={e=>setAdminPostFields((f:any)=>({...f,announce:{...f.announce,title:e.target.value}}))} disabled={adminPostLoading} />
                  <textarea className="w-full border rounded px-3 py-2" placeholder="Announcement Content" value={adminPostFields.announce.content} onChange={e=>setAdminPostFields((f:any)=>({...f,announce:{...f.announce,content:e.target.value}}))} disabled={adminPostLoading} rows={3} />
                </>
              )}
              {adminPostType==='ask' && (
                <>
                  <input type="text" className="w-full border rounded px-3 py-2" placeholder="Question Heading" value={adminPostFields.ask.question} onChange={e=>setAdminPostFields((f:any)=>({...f,ask:{...f.ask,question:e.target.value}}))} disabled={adminPostLoading} />
                  <textarea className="w-full border rounded px-3 py-2" placeholder="Question Content" value={adminPostFields.ask.content||''} onChange={e=>setAdminPostFields((f:any)=>({...f,ask:{...f.ask,content:e.target.value}}))} disabled={adminPostLoading} rows={3} />
                </>
              )}
              {adminPostError && <div className="text-red-600 text-sm">{adminPostError}</div>}
              {adminPostSuccess && <div className="text-green-600 text-sm">{adminPostSuccess}</div>}
              <button type="submit" className="w-full py-2 bg-cyan-600 text-white rounded font-bold text-lg hover:bg-cyan-700 transition" disabled={adminPostLoading}>{adminPostLoading ? 'Posting...' : 'Post'}</button>
      </form>
          )}
        </div>
      )}
      
      {/* Feed and Sidebar Row */}
      <div className="flex flex-row gap-8">
        <div className="flex-1">
          {/* ... main feed ... */}
      {isLoadingPosts ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
          <p className="ml-4 text-slate-600">Loading posts...</p>
        </div>
          ) : mainFeedPosts.length > 0 ? (
        <div className="space-y-6">
              {mainFeedPosts.map((postItem) => {
            const {
              id, postAuthorUserId, authorName, authorAvatarUrl, timestamp, 
              textContent, imageUrl, poll_id, likeCount, commentCount, updated_at, 
                  isLikedByCurrentUser, post_type, title, is_pinned, event_start_time, event_end_time, event_location_text, event_description, images, video_url,
                  documents, authorFullName, authorRole, authorIsLocationVerified,
                  authorBio, authorEmail, authorProfileCreatedAt
            } = postItem; 
            return (
              <div
                key={id}
                id={`post-${id}`}
                    ref={el => { postRefs.current[id] = el; }}
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
                currentUserRole={currentUserRole}
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
                  event_start_time={event_start_time}
                  event_end_time={event_end_time}
                  event_location_text={event_location_text}
                  event_description={event_description}
                  images={images || []}
                  video_url={video_url}
                  documents={documents || []}
                  authorFullName={authorFullName}
                  authorRole={authorRole}
                  authorIsLocationVerified={authorIsLocationVerified}
                  authorBio={authorBio}
                  authorEmail={authorEmail}
                  authorProfileCreatedAt={authorProfileCreatedAt}
                  // Props from page scope:
                  onToggleLike={handleToggleLike}
                  fetchComments={fetchCommentsForPost}
                  onCommentSubmit={handleCommentSubmitCallback}
                onDeletePost={handleDeletePost}
                onUpdatePost={handleUpdatePostWrapper}
                onActualDeleteComment={handleActualDeleteComment}
                onActualUpdateComment={handleActualUpdateComment}
                onReplySubmit={async (parentId, replyText, parentDepth) => {
                  const result = await handleReplySubmitCallback(parentId, replyText, parentDepth);
                  // After reply, reload comments and update count
                  if (result) {
                    const comments = await fetchCommentsForPost(id);
                    setPosts(prev => prev.map(p => p.id === id ? { ...p, commentCount: comments.filter(c => !c.parent_id).length } : p));
                  }
                  return result;
                }}
                onLikeComment={handleLikeCommentCallback}
                onUnlikeComment={handleUnlikeCommentCallback}
                onOpenCommentsModal={() => setModalPostId(id)}
                canPin={currentUserRole === 'superadmin' || currentUserRole === 'community admin'}
                  onTogglePin={handleTogglePin}
                  onRsvpAction={handleRsvpAction} // Pass the new handler
                  communityId={postItem.communityId} // <<< ADD THIS
              />
              </div>
            );
          })}
        </div>
      ) : null}

        {/* Load More Button and End of List Message MOVED INSIDE flex-1 */}
        <div className="text-center my-8">
          {!isLoadingPosts && posts.length > 0 && posts.length < totalPostsCount && (
              <button
              onClick={handleLoadMore}
              disabled={isLoadingMorePosts}
              className="px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition shadow-md disabled:opacity-60"
              >
              {isLoadingMorePosts ? 'Loading More...' : 'Load More Posts'}
              </button>
          )}
          {!isLoadingPosts && !isLoadingMorePosts && posts.length > 0 && posts.length >= totalPostsCount && (
            <p className="text-slate-500">End of display list</p> /* Inline styles removed */
          )}
            </div>

        </div> {/* This closes <div className="flex-1"> */}

      </div> {/* This closes <div className="flex flex-row gap-8"> */} 

      {/* Comments Modal */}
      {modalPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-0 relative mx-2 overflow-y-auto max-h-[90vh] my-6">
            {/* Modal Header: Place close button next to 3-dots/options button at top right */}
            <div className="flex items-center justify-end gap-2 px-4 pt-4">
            <button
                className="text-2xl text-gray-400 hover:text-gray-700 z-10"
              onClick={() => setModalPostId(null)}
              aria-label="Close modal"
            >
              &times;
            </button>
              {/* 3-dots/options button would be here if present */}
            </div>
            {/* Comment section: ensure light background and dark text */}
            <div className="bg-white text-black">
            {(() => {
              const post = posts.find(p => p.id === modalPostId);
              if (!post) return <div className="p-8 text-center text-slate-500">Post not found.</div>;
              return (
                <FeedPostItem
                  {...post} // Spread post first
                  currentUserId={currentUser?.id} // Override/add specific props
                  currentUserRole={currentUserRole}
                  onToggleLike={handleToggleLike}
                  fetchComments={fetchCommentsForPost}
                  onCommentSubmit={handleCommentSubmitCallback}
                  onDeletePost={handleDeletePost}
                  onUpdatePost={handleUpdatePostWrapper}
                  onTogglePin={handleTogglePin}
                  onActualDeleteComment={handleActualDeleteComment}
                  onActualUpdateComment={handleActualUpdateComment}
                  onReplySubmit={async (parentId, replyText, parentDepth) => {
                    const result = await handleReplySubmitCallback(parentId, replyText, parentDepth);
                    if (result && post) {
                      const comments = await fetchCommentsForPost(post.id);
                      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, commentCount: comments.filter(c => !c.parent_id).length } : p));
                    }
                    return result;
                  }}
                  onLikeComment={handleLikeCommentCallback}
                  onUnlikeComment={handleUnlikeCommentCallback}
                  onOpenCommentsModal={undefined}
                  onCloseModal={() => setModalPostId(null)}
                  canPin={currentUserRole === 'superadmin' || currentUserRole === 'community admin'}
                  openCommentsByDefault={true}
                  authorName={post.authorName || 'Unknown User'}
                  authorAvatarUrl={post.authorAvatarUrl || undefined}
                  authorFullName={post.authorFullName || 'Unknown User'}
                  authorRole={post.authorRole || 'Unknown'}
                  authorIsLocationVerified={post.authorIsLocationVerified || false}
                  onRsvpAction={handleRsvpAction}
                  // communityId will be spread from {...post} if post (PostData) has it.
        />
              );
            })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
