'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Heart, MessageSquare, Send, Image as ImageIcon, X, BarChart2, HelpCircle, Megaphone, Calendar, File as FileIcon, ArrowUp, Sailboat, Trash2, MoreHorizontal, Edit3, Star, EyeOff, Share2 } from 'lucide-react';
import PollCreator from '@/components/feed/PollCreator';
import PollCard from '@/components/feed/PollCard';
import FeedFilters, { FeedContentType } from '@/components/feed/FeedFilters';
import AnnouncementCreator from '@/components/feed/AnnouncementCreator';
import QuestionCreator from '@/components/feed/QuestionCreator';
import EventCreator from '@/components/feed/EventCreator';
import EventCard from '@/components/feed/EventCard';
import AnnouncementCard from '@/components/feed/AnnouncementCard';
import QuestionCard from '@/components/feed/QuestionCard';
import MediaUploader from '@/components/feed/MediaUploader';
import SearchBar from '@/components/feed/SearchBar';
import HashtagText from '@/components/feed/HashtagText';
import { extractHashtags, findPopularHashtags } from '@/utils/hashtagUtils';
import SortDropdown, { SortOption } from '@/components/feed/SortDropdown';
import { createPostLikeNotification, createCommentNotification } from '@/utils/notificationUtils';
import { CommentsList } from '@/components/feed/CommentsList';
import CommentForm from '@/components/feed/CommentForm';
import UserTooltipWrapper from '@/components/user/UserTooltipWrapper';
import { UserTooltipProfileData } from '@/components/user/UserTooltipDisplay';
import { TideReactionsProvider } from '@/context/TideReactionsContext';
import CoastlineReactionDisplay from '@/components/feed/CoastlineReactionDisplay';
import { formatDistanceToNow } from 'date-fns';

// Import Lightbox
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function FeedPage() {
  const supabase = createClient();
  const params = useParams();
  const searchParams = useSearchParams();

  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [communityUuid, setCommunityUuid] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userOnlineStatus, setUserOnlineStatus] = useState<Record<string, boolean>>({});
  const [userTooltipData, setUserTooltipData] = useState<Record<string, UserTooltipProfileData>>({});
  const [validationMessage, setValidationMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(true); // Set to true for testing
  
  // Character limit for posts
  const MAX_POST_LENGTH = 1000;
  
  // Media upload states
  const [mediaState, setMediaState] = useState<{
    images: string[],
    video: string | null,
    files: string[],
    videoPreview: string | null,
    videoFile: File | null
  }>({
    images: [],
    video: null,
    files: [],
    videoPreview: null,
    videoFile: null
  });
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  
  // Add state for comments
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [isCommenting, setIsCommenting] = useState<Record<string, boolean>>({});

  // Poll state
  const [showPollCreator, setShowPollCreator] = useState(false);
  
  // Post type states
  const [activeFilter, setActiveFilter] = useState<FeedContentType>('all');
  const [contentTypeCounts, setContentTypeCounts] = useState<Record<string, number>>({});
  const [postType, setPostType] = useState<'general' | 'poll' | 'event' | 'announce' | 'ask'>('general');

  // Add state for showing the different content creators
  const [showAnnouncementCreator, setShowAnnouncementCreator] = useState(false);
  const [showQuestionCreator, setShowQuestionCreator] = useState(false);

  // Add state for showing the event creator
  const [showEventCreator, setShowEventCreator] = useState(false);

  // Add these state variables in the component
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [popularHashtags, setPopularHashtags] = useState<string[]>([]);

  // Add this state variable in the component
  const [currentSort, setCurrentSort] = useState<SortOption>('newest');
  
  // Sidebar states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [hotPoll, setHotPoll] = useState<any | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<any[]>([]);
  const [communityStats, setCommunityStats] = useState<any | null>(null);
  const [localDeals, setLocalDeals] = useState<any[]>([]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  // Admin options state
  const [activePostMenu, setActivePostMenu] = useState<string | null>(null);

  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activePostImages, setActivePostImages] = useState<string[]>([]);

  if (!params) {
    return <div>Loading...</div>;
  }
  const communityIdOrSlug = params.communityId as string;

  // Check for postId in URL to show specific post
  const postId = searchParams?.get('postId');
  
  useEffect(() => {
    if (postId) {
      // If a specific post is requested, fetch just that post
      const fetchSinglePost = async () => {
        if (!communityUuid) return;
        
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (
              username,
              avatar_url
            )
          `)
          .eq('id', postId)
          .eq('is_visible', true)
          .single();
          
        if (error) {
          console.error('Error fetching specific post:', error);
          return;
        }
        
        if (data) {
          // Format the post with author information
          const formattedPost = {
            ...data,
            author_username: data.profiles?.username,
            author_avatar_url: data.profiles?.avatar_url
          };
          
          // If it's a poll post, get the poll_id
          if (formattedPost.type === 'poll') {
            const { data: pollData } = await supabase
              .from('polls')
              .select('id')
              .eq('post_id', formattedPost.id)
              .single();
              
            if (pollData) {
              formattedPost.poll_id = pollData.id;
            }
          }
          
          // Get comment count
          const { data: commentCount } = await supabase
            .rpc('get_comment_counts', { post_ids: [formattedPost.id] });
            
          formattedPost.comment_count = commentCount && commentCount[0] ? parseInt(commentCount[0].count) : 0;
          
          setPosts([formattedPost]);
          setFilteredPosts([formattedPost]);
        }
      };
      
      if (communityUuid) {
        fetchSinglePost();
      }
    }
  }, [postId, communityUuid, supabase]);

  useEffect(() => {
    const resolveCommunity = async () => {
      console.log('Resolving community for:', communityIdOrSlug);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidPattern.test(communityIdOrSlug);
      console.log('Is UUID?', isUuid);

      let query = supabase.from('communities').select('id');
      if (isUuid) {
        query = query.eq('id', communityIdOrSlug);
      } else {
        query = query.eq('slug', communityIdOrSlug);
      }
      const { data, error } = await query.single();

      if (error || !data) {
        console.error('Could not resolve community', error);
        // Handle error, maybe show a message
      } else {
        console.log('Resolved community UUID:', data.id);
        setCommunityUuid(data.id);
      }
    };
    resolveCommunity();
  }, [communityIdOrSlug, supabase]);

  const fetchPosts = useCallback(async () => {
    if (!communityUuid || postId) return; // Don't fetch all posts if we're showing a specific post

    console.log('Fetching posts for community UUID:', communityUuid);
    setPostsLoading(true);
    
    // First get the posts
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('community_id', communityUuid)
      .in('type', ['general', 'poll', 'event', 'announce', 'ask'])
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .range((page - 1) * 10, page * 10 - 1);

    if (error) {
      console.error('Error fetching posts:', error);
      setPostsLoading(false);
      return;
    }
    
    console.log('Fetched posts:', data);
    
    // Format posts with author information
    const formattedPosts = data.map((post: any) => ({
      ...post,
      author_username: post.profiles?.username,
      author_avatar_url: post.profiles?.avatar_url
    }));
    
    // Fetch poll information for poll posts
    const pollPosts = formattedPosts.filter(post => post.type === 'poll');
    
    if (pollPosts.length > 0) {
      const pollPostIds = pollPosts.map(post => post.id);
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('id, post_id')
        .in('post_id', pollPostIds);
        
      if (!pollsError && pollsData) {
        // Add poll_id to the corresponding posts
        formattedPosts.forEach(post => {
          const pollData = pollsData.find(poll => poll.post_id === post.id);
          if (pollData) {
            post.poll_id = pollData.id;
          }
        });
      } else {
        console.error('Error fetching polls:', pollsError);
      }
    }
    
    // Get comment counts for each post
    const postIds = formattedPosts.map((post: any) => post.id);
    
    if (postIds.length > 0) {
      // Get comment counts using raw SQL
      const { data: commentCounts, error: countError } = await supabase
        .rpc('get_comment_counts', { post_ids: postIds });
      
      if (!countError && commentCounts) {
        console.log('Comment counts:', commentCounts);
        
        // Add comment counts to posts
        formattedPosts.forEach((post: any) => {
          const countData = commentCounts.find((c: any) => c.parent_id === post.id);
          post.comment_count = countData ? parseInt(countData.count) : 0;
        });
      }
    }
    
    // Count posts by type
    const typeCounts: Record<string, number> = {
      all: formattedPosts.length
    };
    
    formattedPosts.forEach((post: any) => {
      const type = post.type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    setContentTypeCounts(typeCounts);
    setPosts(prev => [...prev, ...formattedPosts]);
    
    // Apply initial filter
    filterPosts(formattedPosts, activeFilter);
    
    setPostsLoading(false);
    setHasMorePosts(formattedPosts.length === 10);
  }, [communityUuid, supabase, activeFilter, searchQuery, activeHashtag, postId, page]);

  // Function to filter posts by type
  const filterPosts = (allPosts: any[], filter: FeedContentType) => {
    let filtered = [...allPosts];
    
    // Filter by content type
    if (filter !== 'all') {
      filtered = filtered.filter(post => post.type === filter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(post => {
        // Search in content
        if (post.content && post.content.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        
        // Search in username or display name if available
        if (post.profiles && 
            ((post.profiles.username && post.profiles.username.toLowerCase().includes(lowerQuery)) || 
             (post.profiles.display_name && post.profiles.display_name.toLowerCase().includes(lowerQuery)))) {
          return true;
        }
        
        // If query starts with #, search for hashtags
        if (lowerQuery.startsWith('#')) {
          const searchHashtag = lowerQuery.substring(1);
          const postHashtags = extractHashtags(post.content || '');
          return postHashtags.some(tag => tag.toLowerCase().includes(searchHashtag));
        }
        
        return false;
      });
    }
    
    // Filter by hashtag
    if (activeHashtag) {
      filtered = filtered.filter(post => {
        const postHashtags = extractHashtags(post.content || '');
        return postHashtags.includes(activeHashtag);
      });
    }
    
    // Apply sorting after filtering
    sortPosts(filtered, currentSort);
  };

  // Handle filter change
  const handleFilterChange = (filter: FeedContentType) => {
    setActiveFilter(filter);
    filterPosts(posts, filter);
  };

  useEffect(() => {
    if (communityUuid) {
      fetchPosts().then(() => {
        // Filters will be applied after posts are fetched
      });
    }
  }, [communityUuid, fetchPosts]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // We're setting isAdmin to true for all users in this demo
        setIsAdmin(true); 
      }
    };
    
    getCurrentUser();
  }, [supabase]);

  useEffect(() => {
    const fetchUserLikes = async () => {
      if (!currentUserId) return;
      
      const { data } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUserId);
      
      const userLikes: Record<string, boolean> = {};
      if (data) {
      data.forEach(like => {
        userLikes[like.post_id] = true;
      });
      }
      
      setLikedPosts(userLikes);
    };
    
    fetchUserLikes();
  }, [posts, currentUserId, supabase]);

  // Effect to fetch user online status and tooltip data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!posts.length) return;
      
      // Get unique user IDs from posts
      const userIds = [...new Set(posts.map(post => post.user_id))];
      if (!userIds.length) return;
      
      try {
        // Fetch user profiles for tooltip data
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, bio, created_at, email, role, last_seen_at, is_location_verified')
          .in('id', userIds);
          
        if (error) {
          console.error('Error fetching user data for tooltips:', error);
          return;
        }
        
        // Process user data for tooltips and online status
        const tooltipData: Record<string, UserTooltipProfileData> = {};
        const onlineStatus: Record<string, boolean> = {};
        
        data.forEach(user => {
          // Determine if user is online (active in last 5 minutes)
          // Always set current user as online
          const isOnline = user.id === currentUserId ? true :
            (user.last_seen_at ? 
            (new Date(user.last_seen_at) > new Date(Date.now() - 5 * 60 * 1000)) : 
            false);
            
          onlineStatus[user.id] = isOnline;
          
          // Store tooltip data
          tooltipData[user.id] = {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url,
            bio: user.bio,
            created_at: user.created_at,
            email: user.email,
            role: user.role,
            is_location_verified: user.is_location_verified,
            last_seen_at: user.last_seen_at
          };
        });
        
        setUserOnlineStatus(onlineStatus);
        setUserTooltipData(tooltipData);
        
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      }
    };
    
    fetchUserData();
  }, [posts, currentUserId, supabase]);

  const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPostContent.trim() && mediaState.images.length === 0 && !mediaState.video && mediaState.files.length === 0) {
      setValidationMessage('Please enter text to continue!');
      return;
    }
    
    if (newPostContent.length > MAX_POST_LENGTH) {
      setValidationMessage(`Your post exceeds the ${MAX_POST_LENGTH} character limit.`);
      return;
    }

    setIsPosting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      try {
        // Prepare post data
        const postData = {
          content: newPostContent,
          user_id: user.id,
          community_id: communityUuid,
          type: postType,
          is_visible: true,
          images: mediaState.images.length > 0 ? mediaState.images : null,
          video_url: mediaState.video,
          files: mediaState.files.length > 0 ? mediaState.files : null
        };
        
        console.log('Attempting to create post with:', postData);

        const { error } = await supabase.from('posts').insert(postData);

        if (error) {
          console.error('Error creating post:', error);
          // Here you might want to show an error message to the user
        } else {
          console.log('Post created successfully!');
          setNewPostContent('');
          setMediaState({ images: [], video: null, files: [], videoPreview: null, videoFile: null });
          setPostType('general');
          fetchPosts(); // Refresh the post list
        }
      } catch (error) {
        console.error('Error in post submission:', error);
      }
    }
    setIsPosting(false);
  };

  const handleToggleLike = async (postId: string) => {
    if (!currentUserId) return;
    
    const isLiked = likedPosts[postId];
    
    // Optimistically update UI
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !isLiked
    }));
    
    // Update post like count in the UI
    setPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, like_count: isLiked ? post.like_count - 1 : post.like_count + 1 } 
          : post
      )
    );
    
    setFilteredPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, like_count: isLiked ? post.like_count - 1 : post.like_count + 1 } 
          : post
      )
    );
    
    try {
      if (isLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId);
          
        if (error) throw error;
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: currentUserId
          });
          
        if (error) throw error;
        
        // Find the post to get the owner's ID for notification
        const post = posts.find(p => p.id === postId);
        if (post && post.user_id !== currentUserId) {
          // Get current user's username for the notification
          const { data: userData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', currentUserId)
            .single();
            
          if (userData) {
            // Create notification for the post owner
            await createPostLikeNotification(
              post.user_id,
              currentUserId,
              postId,
              communityUuid || '',
              userData.username
            );
          }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Revert optimistic update on error
      setLikedPosts(prev => ({
        ...prev,
        [postId]: isLiked
      }));
      
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: isLiked ? post.like_count : post.like_count - 1 } 
            : post
        )
      );
      
      setFilteredPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: isLiked ? post.like_count : post.like_count - 1 } 
            : post
        )
      );
    }
  };

  // Function to toggle comments visibility
  const toggleComments = async (postId: string) => {
    const isVisible = showComments[postId] || false;
    
    // Update visibility state
    setShowComments(prev => ({
      ...prev,
      [postId]: !isVisible
    }));
    
    // Fetch comments if they're being shown and haven't been loaded yet
    if (!isVisible) {
      console.log('Fetching comments for post:', postId);
      await fetchComments(postId);
    }
  };

  // Function to fetch comments for a post
  const fetchComments = async (postId: string) => {
    console.log('Fetching comments for post:', postId);
    // Clear existing comments for this post to ensure we get fresh data
    setComments(prev => ({
      ...prev,
      [postId]: []
    }));
    
    // First get all comments for this post, regardless of depth
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url,
          bio,
          created_at,
          email,
          role,
          last_seen_at,
          is_location_verified
        )
      `)
      .eq('is_visible', true)
      .or(`parent_id.eq.${postId},parent_id.in.(select id from posts where parent_id='${postId}')`)
      .eq('type', 'comment')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }
    
    console.log('Comments data received:', data);
    
    if (!data || data.length === 0) {
      console.log('No comments found for post:', postId);
      setComments(prev => ({
        ...prev,
        [postId]: []
      }));
      return;
    }
    
    const formattedComments = data.map((comment: any) => ({
      id: comment.id,
      textContent: comment.content,
      authorName: comment.profiles?.username || 'Anonymous',
      authorAvatarUrl: comment.profiles?.avatar_url,
      timestamp: comment.created_at,
      commentAuthorId: comment.user_id,
      parent_id: comment.parent_id,
      depth: comment.depth || 1,
      updated_at: comment.updated_at,
      likeCount: comment.like_count || 0,
      isLikedByCurrentUser: false, // Will be updated below
      files: comment.media_urls,
      authorBio: comment.profiles?.bio,
      authorEmail: comment.profiles?.email,
      authorProfileCreatedAt: comment.profiles?.created_at,
      authorRole: comment.profiles?.role,
      authorIsLocationVerified: comment.profiles?.is_location_verified,
      authorLastSeenAt: comment.profiles?.last_seen_at,
      content: comment.content // Add this for compatibility
    }));
    
    console.log('Formatted comments:', formattedComments);
    
    // Check which comments are liked by the current user
    if (currentUserId) {
      const { data: likedComments } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', formattedComments.map(c => c.id));
        
      if (likedComments) {
        const likedCommentIds = new Set(likedComments.map(like => like.post_id));
        formattedComments.forEach(comment => {
          comment.isLikedByCurrentUser = likedCommentIds.has(comment.id);
        });
      }
    }
    
    console.log('Setting comments state for post:', postId, formattedComments);
    
    setComments(prev => ({
      ...prev,
      [postId]: formattedComments
    }));
  };

  // Function to handle comment submission
  const handleCommentSubmit = async (postId: string): Promise<void> => {
    if (!commentText[postId]?.trim() || !currentUserId) return;
    
    setIsCommenting(prev => ({ ...prev, [postId]: true }));
    
    try {
      // Get the post to find the owner
      const post = posts.find(p => p.id === postId);
      if (!post) throw new Error('Post not found');
      
      // Get current user's profile info
      const { data: userData } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio, created_at, email, role, last_seen_at, is_location_verified')
        .eq('id', currentUserId)
        .single();
        
      if (!userData) throw new Error('User profile not found');
      
      // Create the comment
      const { data: commentData, error } = await supabase
        .from('posts')
        .insert({
          content: commentText[postId],
          user_id: currentUserId,
          community_id: communityUuid,
          type: 'comment',
          parent_id: postId,
          depth: 1,
          is_visible: true
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Format the new comment
    const newComment = {
        id: commentData.id,
        textContent: commentData.content,
        content: commentData.content,
        authorName: userData.username || 'Anonymous',
        authorAvatarUrl: userData.avatar_url,
        timestamp: commentData.created_at,
        commentAuthorId: currentUserId,
      parent_id: postId,
        depth: 1,
        updated_at: commentData.updated_at,
        likeCount: 0,
        isLikedByCurrentUser: false,
        authorBio: userData.bio,
        authorEmail: userData.email,
        authorProfileCreatedAt: userData.created_at,
        authorRole: userData.role,
        authorIsLocationVerified: userData.is_location_verified,
        authorLastSeenAt: userData.last_seen_at
      };
      
      // Update comments state
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
      
      // Clear comment input
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      
      // Send notification to post owner if it's not the current user
      if (post.user_id !== currentUserId) {
        await createCommentNotification(
          post.user_id,
          currentUserId,
          postId,
          communityUuid || '',
          userData.username || 'Anonymous'
        );
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsCommenting(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Add this wrapper function for CommentForm onSubmit
  const handleCommentFormSubmit = (postId: string) => async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    await handleCommentSubmit(postId);
  };

  const handlePollCreated = () => {
    setShowPollCreator(false);
    fetchPosts();
  };

  // Add handlers for the new content creators
  const handleAnnouncementCreated = () => {
    setShowAnnouncementCreator(false);
    fetchPosts();
  };

  const handleQuestionCreated = () => {
    setShowQuestionCreator(false);
    fetchPosts();
  };

  // Add handler for the event creator
  const handleEventCreated = () => {
    setShowEventCreator(false);
    fetchPosts();
  };

  // Add this function to handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Reset hashtag filter if search is used
    if (query && activeHashtag) {
      setActiveHashtag(null);
    }
    
    // Apply filters
    filterPosts(posts, activeFilter);
  };

  // Add this function to handle hashtag selection
  const handleHashtagSelect = (hashtag: string) => {
    setActiveHashtag(hashtag === activeHashtag ? null : hashtag);
    
    // Clear search if hashtag is selected
    if (hashtag !== activeHashtag && searchQuery) {
      setSearchQuery('');
    }
    
    // Apply filters
    filterPosts(posts, activeFilter);
  };

  // Add this function to handle sort changes
  const handleSortChange = (sortOption: SortOption) => {
    setCurrentSort(sortOption);
    sortPosts(filteredPosts, sortOption);
  };

  // Add this function to sort posts
  const sortPosts = (postsToSort: any[], sortOption: SortOption) => {
    const sorted = [...postsToSort];
    
    switch (sortOption) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'trending':
        // Simple trending algorithm: (likes + comments) * recency factor
        sorted.sort((a, b) => {
          const aScore = ((a.like_count || 0) + (a.comment_count || 0)) * 
                         (1 + 1 / (1 + (Date.now() - new Date(a.created_at).getTime()) / 86400000));
          const bScore = ((b.like_count || 0) + (b.comment_count || 0)) * 
                         (1 + 1 / (1 + (Date.now() - new Date(b.created_at).getTime()) / 86400000));
          return bScore - aScore;
        });
        break;
      case 'most_liked':
        sorted.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        break;
      case 'most_commented':
        sorted.sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0));
        break;
    }
    
    setFilteredPosts(sorted);
  };

  // Add this effect to calculate popular hashtags
  useEffect(() => {
    if (posts.length > 0) {
      const popular = findPopularHashtags(posts, 5);
      setPopularHashtags(popular);
    }
  }, [posts]);

  // Function to handle reply submission
  const handleReplySubmit = async (parentCommentId: string, replyText: string, parentDepth: number) => {
    if (!replyText.trim() || !currentUserId || parentDepth >= 3) return false;
    
    try {
      // Find the parent comment to get the post ID
      let postId = '';
      for (const [key, commentsList] of Object.entries(comments)) {
        const parentComment = commentsList.find(c => c.id === parentCommentId);
        if (parentComment) {
          postId = key;
          break;
        }
      }
      
      if (!postId) {
        console.error('Could not find post ID for parent comment');
        return false;
      }
      
      // Get current user's profile info
      const { data: userData } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio, created_at, email, role, last_seen_at, is_location_verified')
        .eq('id', currentUserId)
        .single();
        
      if (!userData) throw new Error('User profile not found');
      
      // Create the reply comment
      const { data: replyData, error } = await supabase
        .from('posts')
        .insert({
          content: replyText,
      user_id: currentUserId,
          community_id: communityUuid,
      type: 'comment',
          parent_id: parentCommentId, // This is now the parent comment ID, not the post ID
          depth: parentDepth,
          is_visible: true
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Format the new reply
      const newReply = {
        id: replyData.id,
        content: replyData.content, // Add this for CommentsList compatibility
        textContent: replyData.content,
        authorName: userData.username || 'Anonymous',
        authorAvatarUrl: userData.avatar_url,
        timestamp: replyData.created_at,
        commentAuthorId: replyData.user_id,
        parent_id: replyData.parent_id,
        depth: replyData.depth || parentDepth,
        updated_at: replyData.updated_at,
        likeCount: 0,
        isLikedByCurrentUser: false,
        authorBio: userData.bio,
        authorEmail: userData.email,
        authorProfileCreatedAt: userData.created_at,
        authorRole: userData.role,
        authorIsLocationVerified: userData.is_location_verified,
        authorLastSeenAt: userData.last_seen_at
      };
      
      // Update comments state
      setComments(prev => ({
        ...prev,
        [postId]: [...prev[postId], newReply]
      }));
      
      // Send notification to comment owner if it's not the current user
      const parentComment = comments[postId].find(c => c.id === parentCommentId);
      if (parentComment && parentComment.commentAuthorId !== currentUserId) {
        await createCommentNotification(
          parentComment.commentAuthorId,
          currentUserId,
          parentCommentId,
          communityUuid || '',
          userData.username || 'Anonymous'
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error submitting reply:', error);
      return false;
    }
  };

  // Function to handle comment like/unlike
  const handleCommentLike = async (commentId: string) => {
    if (!currentUserId) return;
    
    try {
      // Find which post this comment belongs to
      let postId = '';
      let comment = null;
      
      for (const [key, commentsList] of Object.entries(comments)) {
        comment = commentsList.find(c => c.id === commentId);
        if (comment) {
          postId = key;
          break;
        }
      }
      
      if (!postId || !comment) return;
      
      // Add like in database
      const { error } = await supabase
        .from('post_likes')
        .insert({
          user_id: currentUserId,
          post_id: commentId
        });
        
      if (error) throw error;
      
      // Update comment like count in database
      await supabase
        .rpc('increment_like_count', {
          entity_id_param: commentId,
          entity_type_param: 'posts'
        });
        
      // Send notification if needed
      if (comment.commentAuthorId !== currentUserId) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', currentUserId)
          .single();
          
        if (userData) {
          await createPostLikeNotification(
            comment.commentAuthorId,
            currentUserId,
            commentId,
            communityUuid || '',
            userData.username
          );
        }
      }
      
      // Update local state
      const updatedComments = comments[postId].map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            likeCount: (c.likeCount || 0) + 1,
            isLikedByCurrentUser: true
          };
        }
        return c;
      });
      
      setComments(prev => ({
        ...prev,
        [postId]: updatedComments
      }));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  // Function to handle comment unlike
  const handleCommentUnlike = async (commentId: string) => {
    if (!currentUserId) return;
    
    try {
      // Find which post this comment belongs to
      let postId = '';
      
      for (const [key, commentsList] of Object.entries(comments)) {
        if (commentsList.some(c => c.id === commentId)) {
          postId = key;
          break;
        }
      }
      
      if (!postId) return;
      
      // Remove like from database
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('post_id', commentId);
        
      if (error) throw error;
      
      // Update comment like count in database
      await supabase
        .rpc('decrement_like_count', {
          entity_id_param: commentId,
          entity_type_param: 'posts'
        });
        
      // Update local state
      const updatedComments = comments[postId].map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            likeCount: Math.max(0, (c.likeCount || 0) - 1),
            isLikedByCurrentUser: false
          };
        }
        return c;
      });
      
      setComments(prev => ({
      ...prev,
        [postId]: updatedComments
      }));
    } catch (error) {
      console.error('Error unliking comment:', error);
    }
  };

  // Function to handle comment update
  const handleCommentUpdate = async (commentId: string, newContent: string) => {
    if (!currentUserId || !newContent.trim()) return false;
    
    try {
      // Find which post this comment belongs to
      let postId = '';
      let comment = null;
      
      for (const [key, commentsList] of Object.entries(comments)) {
        comment = commentsList.find(c => c.id === commentId);
        if (comment) {
          postId = key;
          break;
        }
      }
      
      if (!postId || !comment) return false;
      
      // Ensure the current user is the comment author
      if (comment.commentAuthorId !== currentUserId) return false;
      
      // Update the comment in the database
      const { error } = await supabase
        .from('posts')
        .update({ content: newContent })
        .eq('id', commentId)
        .eq('user_id', currentUserId);
        
      if (error) throw error;
      
      // Update local state
      const updatedComments = comments[postId].map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            textContent: newContent,
            content: newContent, // Add this for CommentsList compatibility
            updated_at: new Date().toISOString()
          };
        }
        return c;
      });
      
      setComments(prev => ({
      ...prev,
        [postId]: updatedComments
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating comment:', error);
      return false;
    }
  };

  // Function to handle comment deletion
  const handleCommentDelete = async (commentId: string) => {
    if (!currentUserId) return false;
    
    try {
      // Find which post this comment belongs to
      let postId = '';
      let comment = null;
      
      for (const [key, commentsList] of Object.entries(comments)) {
        comment = commentsList.find(c => c.id === commentId);
        if (comment) {
          postId = key;
          break;
        }
      }
      
      if (!postId || !comment) return false;
      
      // Ensure the current user is the comment author
      if (comment.commentAuthorId !== currentUserId) return false;
      
      // Delete the comment in the database (or set is_visible to false)
      const { error } = await supabase
        .from('posts')
        .update({ is_visible: false })
        .eq('id', commentId)
        .eq('user_id', currentUserId);
        
      if (error) throw error;
      
      // Update local state - remove the comment
      const updatedComments = comments[postId].filter(c => c.id !== commentId);
      
      setComments(prev => ({
        ...prev,
        [postId]: updatedComments
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  };

  // Add this function to fetch user groups
  const fetchUserGroups = useCallback(async () => {
    if (!currentUserId || !communityUuid) return;
    
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          groups (
            id,
            name,
            avatar_url,
            unread_count
          )
        `)
        .eq('user_id', currentUserId)
        .eq('community_id', communityUuid)
        .limit(5);
        
      if (error) throw error;
      
      const formattedGroups = data?.map(item => item.groups) || [];
      setUserGroups(formattedGroups);
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  }, [currentUserId, communityUuid, supabase]);

  // Add this function to fetch hot poll
  const fetchHotPoll = useCallback(async () => {
    if (!communityUuid) return;
    
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          id,
          question,
          options,
          votes_count,
          post_id,
          posts (
            created_at
          )
        `)
        .eq('community_id', communityUuid)
        .order('votes_count', { ascending: false })
        .limit(1)
        .single();
        
      if (error) throw error;
      
      setHotPoll(data);
    } catch (error) {
      console.error('Error fetching hot poll:', error);
    }
  }, [communityUuid, supabase]);

  // Add this function to fetch upcoming events
  const fetchUpcomingEvents = useCallback(async () => {
    if (!communityUuid) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          event_date,
          event_location,
          rsvp_count
        `)
        .eq('community_id', communityUuid)
        .eq('type', 'event')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(3);
        
      if (error) throw error;
      
      setUpcomingEvents(data || []);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  }, [communityUuid, supabase]);

  // Add this function to fetch suggested groups
  const fetchSuggestedGroups = useCallback(async () => {
    if (!communityUuid || !currentUserId) return;
    
    try {
      // This is a simplified query - in a real app, you'd have a more sophisticated recommendation algorithm
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, avatar_url, member_count')
        .eq('community_id', communityUuid)
        .not('id', 'in', `(select group_id from group_members where user_id = '${currentUserId}')`)
        .order('member_count', { ascending: false })
        .limit(3);
        
      if (error) throw error;
      
      setSuggestedGroups(data || []);
    } catch (error) {
      console.error('Error fetching suggested groups:', error);
    }
  }, [communityUuid, currentUserId, supabase]);

  // Add this function to fetch community stats
  const fetchCommunityStats = useCallback(async () => {
    if (!communityUuid || !currentUserId) return;
    
    try {
      // This would typically be a more complex query or multiple queries
      // For now, we'll use placeholder data
      setCommunityStats({
        userPosts: 5,
        userComments: 12,
        userGroups: 3,
        activeGroups: 8,
        upcomingEvents: 4,
        newMembers: 7
      });
    } catch (error) {
      console.error('Error fetching community stats:', error);
    }
  }, [communityUuid, currentUserId, supabase]);

  // Add this useEffect to fetch sidebar data
  useEffect(() => {
    if (currentUserId && communityUuid) {
      fetchUserGroups();
      fetchHotPoll();
      fetchUpcomingEvents();
      fetchSuggestedGroups();
      fetchCommunityStats();
      
      // Placeholder local deals data
      setLocalDeals([
        { id: 1, title: "20% off at Local Cafe", image: "/placeholder-deal.jpg" },
        { id: 2, title: "Weekend Beach Cleanup", image: "/placeholder-event.jpg" },
        { id: 3, title: "New Business Directory Listing", image: "/placeholder-listing.jpg" }
      ]);
    }
  }, [currentUserId, communityUuid, fetchUserGroups, fetchHotPoll, fetchUpcomingEvents, fetchSuggestedGroups, fetchCommunityStats]);

  // Simple delete post function
  const handleDeletePost = (postId: string) => {
    if (!isAdmin) return;
    
    if (confirm('Are you sure you want to delete this post?')) {
      // Remove from UI immediately
      setPosts(prev => prev.filter(post => post.id !== postId));
      setFilteredPosts(prev => prev.filter(post => post.id !== postId));
      
      // Call API to mark as not visible
      supabase
        .from('posts')
        .update({ is_visible: false })
        .eq('id', postId)
        .then(({ error }) => {
          if (error) {
            console.error('Error deleting post:', error);
          } else {
            console.log('Post deleted successfully');
          }
        });
    }
  };

  const openLightbox = (postImages: string[], imageIndex: number) => {
    setActivePostImages(postImages);
    setLightboxIndex(imageIndex);
    setLightboxOpen(true);
  };

  return (
    <TideReactionsProvider>
      <div className="flex bg-gray-50/50 min-h-screen">
        {/* Left Sidebar */}
        <div className={`bg-white shadow-md transition-all duration-300 ${leftSidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 sticky top-0 h-screen overflow-hidden`}>
          <div className="p-4 h-full">
            {/* Your Groups Launcher */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-medium ${leftSidebarOpen ? 'block' : 'hidden'}`}>Your Groups</h3>
                <button 
                  onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                  className="p-1 rounded hover:bg-gray-100"
                  aria-label={leftSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                  {leftSidebarOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </button>
              </div>
              
              {leftSidebarOpen && (
                <div className="space-y-2">
                  {userGroups.length > 0 ? (
                    userGroups.map((group) => (
                      <div key={group.id} className="flex items-center p-2 hover:bg-gray-100 rounded">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          {group.avatar_url ? (
                            <img src={group.avatar_url} alt={group.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span>{group.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 truncate">{group.name}</div>
                        {group.unread_count > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {group.unread_count}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No groups joined yet</div>
                  )}
                  <a href="#" className="text-blue-500 hover:underline text-sm flex items-center">
                    <span className="mr-1">+</span> Create New Group
                  </a>
                </div>
              )}
            </div>
            
            {/* Trending Hashtags Cloud */}
            {leftSidebarOpen && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Trending Hashtags</h3>
                <div className="flex flex-wrap gap-2">
                  {popularHashtags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleHashtagSelect(tag)}
                      className={`px-2 py-1 rounded-full text-xs ${
                        activeHashtag === tag ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Live Mini-Map */}
            {leftSidebarOpen && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Live Mini-Map</h3>
                <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Map visualization</span>
                </div>
              </div>
            )}
            
            {/* Hot Now Group Poll */}
            {leftSidebarOpen && hotPoll && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Hot Now Poll</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">{hotPoll.question}</p>
                  <div className="space-y-2">
                    {hotPoll.options && hotPoll.options.map((option: any, index: number) => {
                      const votePercentage = hotPoll.votes_count > 0 
                        ? (option.votes / hotPoll.votes_count) * 100 
                        : 0;
                      
                      return (
                        <div key={index} className="text-xs">
                          <div className="flex justify-between mb-1">
                            <span>{option.text}</span>
                            <span>{Math.round(votePercentage)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full" 
                              style={{ width: `${votePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick-Action Micro-a */}
            <div className="space-y-2">
              {leftSidebarOpen ? (
                <>
                  <button 
                    onClick={() => setShowQuestionCreator(true)}
                    className="w-full flex items-center p-2 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    <HelpCircle size={16} className="mr-2" />
                    <span>Ask Question</span>
                  </button>
                  <button 
                    onClick={() => setShowAnnouncementCreator(true)}
                    className="w-full flex items-center p-2 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    <Megaphone size={16} className="mr-2" />
                    <span>Announcement</span>
                  </button>
                  <button 
                    onClick={() => setShowEventCreator(true)}
                    className="w-full flex items-center p-2 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    <Calendar size={16} className="mr-2" />
                    <span>Event</span>
                  </button>
                  <button 
                    onClick={() => setShowPollCreator(true)}
                    className="w-full flex items-center p-2 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    <BarChart2 size={16} className="mr-2" />
                    <span>Poll</span>
                  </button>
                  <button 
                    className="w-full flex items-center p-2 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    <MessageSquare size={16} className="mr-2" />
                    <span>New Group</span>
                  </button>
                </>
              ) : (
                <>
                  <button className="w-full flex justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded">
                    <HelpCircle size={16} />
                  </button>
                  <button className="w-full flex justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded">
                    <Megaphone size={16} />
                  </button>
                  <button className="w-full flex justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded">
                    <Calendar size={16} />
                  </button>
                  <button className="w-full flex justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded">
                    <BarChart2 size={16} />
                  </button>
                  <button className="w-full flex justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded">
                    <MessageSquare size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content - Centered with even spacing */}
        <div className="flex-1 max-w-3xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold mb-6">Coastline Chatter</h1>
      
      {/* Search bar */}
      <SearchBar 
        onSearch={handleSearch}
        onHashtagSelect={handleHashtagSelect}
        popularHashtags={popularHashtags}
      />
      
      {/* Active hashtag filter indicator */}
      {activeHashtag && (
        <div className="mb-4 flex items-center">
          <span className="text-sm text-gray-600 mr-2">Filtering by:</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
            <span className="mr-1">#</span>{activeHashtag}
            <button 
              onClick={() => handleHashtagSelect(activeHashtag)}
              className="ml-1 hover:text-blue-600"
            >
              <X size={14} />
            </button>
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <FeedFilters
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          counts={contentTypeCounts}
        />
        
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                  setActiveHashtag(null);
                }}
                disabled={activeFilter === 'all' && !searchQuery && !activeHashtag}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'all' && !searchQuery && !activeHashtag
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Clear Filters
              </button>
              <div className="w-40">
          <SortDropdown 
            onSortChange={handleSortChange}
            currentSort={currentSort}
          />
              </div>
        </div>
      </div>

      {/* Post form */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handlePostSubmit} className="mb-6 bg-white p-4 rounded-lg shadow">
            {validationMessage && (
              <div className="mb-2 text-red-500 font-medium">
                {validationMessage}
              </div>
            )}
        <textarea
              className={`w-full p-2 border ${validationMessage ? 'border-red-500' : 'border-gray-300'} rounded-md`}
          rows={3}
              placeholder="Welcome back. Join the conversation!"
          value={newPostContent}
              onChange={(e) => {
                setNewPostContent(e.target.value);
                if (validationMessage) setValidationMessage('');
              }}
          disabled={isPosting}
              maxLength={MAX_POST_LENGTH}
            />
            
            {/* Character counter */}
            <div className="mt-1 text-right text-sm text-gray-500">
              <span className={newPostContent.length > MAX_POST_LENGTH * 0.9 ? 'text-amber-500' : ''}>
                {newPostContent.length}
              </span>
              <span>/{MAX_POST_LENGTH} characters</span>
            </div>
        
        {/* Image and Video preview area */}
        {(mediaState.images.length > 0 || mediaState.videoPreview) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Image Previews */}
            {mediaState.images.map((url, index) => (
              <div key={index} className="relative">
                <img 
                  src={url} 
                  alt={`Preview ${index}`} 
                  className="h-20 w-20 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    const urlToRevoke = mediaState.images[index];
                    setMediaState(prev => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index)
                    }));
                    URL.revokeObjectURL(urlToRevoke);
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/3 -translate-y-1/3"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {/* Video Preview */}
            {mediaState.videoPreview && (
              <div className="relative">
                <video 
                  src={mediaState.videoPreview} 
                  className="h-20 w-20 object-cover rounded bg-black"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (mediaState.videoPreview) {
                      URL.revokeObjectURL(mediaState.videoPreview);
                    }
                    setMediaState(prev => ({
                      ...prev,
                      video: null,
                      videoPreview: null,
                      videoFile: null
                    }));
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/3 -translate-y-1/3"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3">
            <div className="flex space-x-2">
            {/* Image upload button */}
            <button
              type="button"
                onClick={() => setShowMediaUploader(true)}
                className="flex items-center text-gray-600 hover:text-gray-800"
            >
                <ImageIcon size={18} className="mr-1" />
              <span>Add Image</span>
            </button>
            
              {/* Post type selection */}
              <div className="flex space-x-2">
            <button
              type="button"
                  onClick={() => {
                    setPostType('general');
                    setShowPollCreator(false);
                    setShowAnnouncementCreator(false);
                    setShowQuestionCreator(false);
                    setShowEventCreator(false);
                  }}
                  className={`flex items-center px-2 py-1 rounded ${
                    postType === 'general' && !showPollCreator && !showAnnouncementCreator && !showQuestionCreator && !showEventCreator
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <MessageSquare size={16} className="mr-1" />
                  <span>Post</span>
            </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowPollCreator(true);
                    setShowAnnouncementCreator(false);
                    setShowQuestionCreator(false);
                    setShowEventCreator(false);
                    setPostType('poll');
                  }}
                  className={`flex items-center px-2 py-1 rounded ${
                    showPollCreator ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <BarChart2 size={16} className="mr-1" />
                  <span>Poll</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionCreator(true);
                    setShowPollCreator(false);
                    setShowAnnouncementCreator(false);
                    setShowEventCreator(false);
                    setPostType('ask');
                  }}
                  className={`flex items-center px-2 py-1 rounded ${
                    showQuestionCreator ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <HelpCircle size={16} className="mr-1" />
                  <span>Question</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowAnnouncementCreator(true);
                    setShowPollCreator(false);
                    setShowQuestionCreator(false);
                    setShowEventCreator(false);
                    setPostType('announce');
                  }}
                  className={`flex items-center px-2 py-1 rounded ${
                    showAnnouncementCreator ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Megaphone size={16} className="mr-1" />
                  <span>Announcement</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowEventCreator(true);
                    setShowPollCreator(false);
                    setShowAnnouncementCreator(false);
                    setShowQuestionCreator(false);
                    setPostType('event');
                  }}
                  className={`flex items-center px-2 py-1 rounded ${
                    showEventCreator ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Calendar size={16} className="mr-1" />
                  <span>Event</span>
                </button>
              </div>
            </div>
          
          <button
            type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
              disabled={isPosting}
            >
              {isPosting ? 'Posting...' : (
                <>
                  <Send size={16} className="mr-1" />
                      <span>Share</span>
                </>
              )}
          </button>
        </div>
      </form>

        {/* Media uploader modal */}
        {showMediaUploader && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
                  <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Upload Media</h3>
                <button 
                  type="button" 
                  onClick={() => setShowMediaUploader(false)}
                      className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X size={24} />
                </button>
              </div>
              
                  <div className="relative z-[999999]">
              <MediaUploader 
                onMediaSelected={(media) => {
                  console.log("Media selected:", media);
                  setMediaState(prev => ({ ...prev, ...media }));
                  setShowMediaUploader(false);
                }}
                onVideoSelected={(file, previewUrl) => {
                  setMediaState(prev => ({
                    ...prev,
                    videoFile: file,
                    videoPreview: previewUrl,
                    images: [], // Clear images if video is selected
                    files: [] // Clear files if video is selected
                  }));
                  setShowMediaUploader(false);
                }}
                onVideoRemoved={() => {
                  setMediaState(prev => ({
                    ...prev,
                    video: null,
                    videoPreview: null,
                    videoFile: null
                  }));
                }}
                onError={(error) => {
                  console.error('Media upload error:', error);
                  // Optionally show an error message to the user
                }}
              />
                  </div>
            </div>
          </div>
        )}

      {/* Poll creator */}
        {showPollCreator && (
        <PollCreator 
            communityId={communityUuid || ''} 
          onPollCreated={handlePollCreated} 
        />
      )}

        {/* Question creator */}
        {showQuestionCreator && (
          <QuestionCreator 
            communityId={communityUuid || ''} 
            onQuestionCreated={handleQuestionCreated}
          />
        )}

        {/* Announcement creator */}
        {showAnnouncementCreator && (
          <AnnouncementCreator 
            communityId={communityUuid || ''} 
            onAnnouncementCreated={handleAnnouncementCreated}
          />
        )}

        {/* Event creator */}
        {showEventCreator && (
          <EventCreator 
            communityId={communityUuid || ''} 
            onEventCreated={handleEventCreated}
          />
        )}

        {/* Posts list */}
        {postsLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              {activeFilter === 'all' 
                ? 'No posts in this community yet. Be the first to post!' 
                : `No ${activeFilter} posts found. Create one!`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow p-4">
                {/* Post header */}
                <div className="flex items-center mb-3">
                    <UserTooltipWrapper 
                      profileData={userTooltipData[post.user_id] || null}
                      delay={200}
                      currentUserId={currentUserId}
                    >
                      <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden mr-3 cursor-pointer">
                    {post.author_avatar_url ? (
                    <img
                      src={post.author_avatar_url}
                        alt={post.author_username} 
                        className="h-full w-full object-cover"
                    />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                        {post.author_username?.charAt(0).toUpperCase() || '?'}
                      </div>
                  )}
                </div>
                    </UserTooltipWrapper>
                <div>
                      <div className="font-medium flex items-center">
                        {post.author_username || 'Anonymous'}
                        <span className={`inline-flex ml-1.5 ${(userOnlineStatus[post.user_id] || post.user_id === currentUserId) ? 'text-green-600' : 'text-gray-400'}`} title={(userOnlineStatus[post.user_id] || post.user_id === currentUserId) ? 'Online' : 'Offline'}>
                          <Sailboat size={14} />
                        </span>
                      </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(post.created_at))} ago
                      {post.type !== 'general' && (
                        <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                          {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                        </span>
                      )}
                </div>
              </div>
                </div>
                
                {/* Post content */}
                {post.type === 'poll' && post.poll_id ? (
                  <PollCard pollId={post.poll_id} postId={post.id} />
                ) : post.type === 'event' ? (
                  <EventCard postId={post.id} />
                ) : post.type === 'announce' ? (
                  <AnnouncementCard postId={post.id} />
                ) : post.type === 'ask' ? (
                  <QuestionCard postId={post.id} />
              ) : (
                <>
                    {/* Text content */}
                    <div className="mb-3 whitespace-pre-wrap">
                      <HashtagText 
                        content={post.content} 
                        onHashtagClick={handleHashtagSelect}
                      />
                    </div>
                    
                    {/* Video */}
                    {post.video_url && (
                      <div className="mb-3">
                        <video 
                          src={post.video_url} 
                          controls
                          className="w-full rounded-lg max-h-[400px]"
                        />
                      </div>
                    )}
                    
                    {/* Images (only show if no video) */}
                    {!post.video_url && post.images && post.images.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {post.images.map((imgUrl: string, index: number) => (
                          <img 
                            key={index}
                            src={imgUrl}
                            alt={`Post image ${index + 1}`}
                            className="max-h-64 rounded cursor-pointer"
                            onClick={() => openLightbox(post.images, index)}
                          />
                        ))}
                      </div>
                    )}
                      
                      {/* Files */}
                      {post.files && post.files.length > 0 && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-md">
                          <h4 className="text-sm font-medium mb-2">Attached Files:</h4>
                          <div className="space-y-2">
                            {post.files.map((fileUrl: string, index: number) => {
                              const fileName = fileUrl.split('/').pop() || `File ${index + 1}`;
                              const fileExt = fileName.split('.').pop()?.toLowerCase();
                              
                              return (
                                <a 
                                  key={index}
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center p-2 bg-white rounded border border-gray-200 hover:bg-blue-50"
                                >
                                  <FileIcon size={16} className="text-blue-500 mr-2" />
                                  <span className="text-sm text-gray-700 truncate">{fileName}</span>
                                  <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded ml-2 uppercase">{fileExt}</span>
                                </a>
                              );
                            })}
                          </div>
                    </div>
                  )}
                </>
              )}
              
                                  {/* Post actions */}
                  <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
                    {/* Coastline Reactions */}
                    <div className="mr-auto">
                      <CoastlineReactionDisplay postId={post.id} sectionType="feed" />
                    </div>
                    
                    {/* Comment button */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center text-gray-500 hover:text-blue-500 mr-4"
                    >
                      <MessageSquare size={18} className="mr-1" />
                      <span>{post.comment_count || 0}</span>
                    </button>
                    
                    {/* Share button */}
                    <button
                      onClick={() => {
                        // Create share URL
                        const shareUrl = `${window.location.origin}/community/${communityUuid}/feed?post=${post.id}`;
                        
                        // Copy to clipboard
                        navigator.clipboard.writeText(shareUrl)
                          .then(() => {
                            // Show copied notification
                            setShareSuccess(post.id);
                            setTimeout(() => {
                              setShareSuccess(null);
                            }, 3000);
                          })
                          .catch((err) => {
                            console.error("Failed to copy link: ", err);
                            setShareError(post.id);
                            setTimeout(() => {
                              setShareError(null);
                            }, 3000);
                          });
                      }}
                      className="flex items-center text-gray-500 hover:text-green-500 mr-4 relative"
                      title="Share post"
                    >
                      <Share2 size={18} className="mr-1" />
                      <span>Share</span>
                      {shareSuccess === post.id && (
                        <span className="absolute -bottom-8 left-0 bg-green-100 text-green-800 text-xs px-2 py-1 rounded whitespace-nowrap">
                          Link copied!
                        </span>
                      )}
                      {shareError === post.id && (
                        <span className="absolute -bottom-8 left-0 bg-red-100 text-red-800 text-xs px-2 py-1 rounded whitespace-nowrap">
                          Failed to copy
                        </span>
                      )}
                    </button>
                    
                    {/* Admin Edit Menu */}
                    {isAdmin && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePostMenu(activePostMenu === post.id ? null : post.id);
                          }}
                          className="flex items-center text-gray-500 hover:text-gray-700 p-1 rounded"
                          title="Admin Options"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        
                        {activePostMenu === post.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                            <button
                              onClick={() => {
                                // Handle edit post
                                setActivePostMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Edit3 size={16} className="mr-2" /> Edit Post
                            </button>
                            <button
                              onClick={() => {
                                // Handle feature post
                                setActivePostMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Star size={16} className="mr-2" /> Pin/Unpin Post
                            </button>
                            <button
                              onClick={() => {
                                // Handle delete post
                                handleDeletePost(post.id);
                                setActivePostMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                            >
                              <Trash2 size={16} className="mr-2" /> Delete Post
                            </button>
                          </div>
                        )}
                      </div>
                    )}
              </div>
              
              {/* Comments section */}
              {showComments[post.id] && (
                  <div className="mt-4 border-t pt-4">
                    {/* Comments list */}
                    {comments[post.id] && comments[post.id].length > 0 ? (
                      <>
                        <CommentsList 
                          comments={comments[post.id].filter(comment => comment.parent_id === post.id)}
                          onLikeComment={handleCommentLike}
                          onUnlikeComment={handleCommentUnlike}
                          currentUserId={currentUserId}
                          onActualUpdateComment={handleCommentUpdate}
                          onActualDeleteComment={handleCommentDelete}
                          communityId={communityUuid || ''}
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          {comments[post.id].length} comment{comments[post.id].length !== 1 ? 's' : ''}
                            </div>
                      </>
                    ) : (
                      <div className="text-gray-500 text-sm mb-3">No comments yet</div>
                    )}
                    
                    {/* Comment input */}
                    <div className="mt-3">
                      <CommentForm
                        onSubmit={async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
                          e.preventDefault();
                          await handleCommentSubmit(post.id);
                        }}
                        value={commentText[post.id] || ''}
                        onChange={(value) => setCommentText(prev => ({ ...prev, [post.id]: value }))}
                        isSubmitting={isCommenting[post.id] || false}
                        placeholder="Write a comment..."
                        communityId={communityUuid || ''}
                      />
                    </div>
                </div>
              )}
            </div>
            ))}
              
              {/* End of posts message */}
              {filteredPosts.length > 0 && (
                <div className="mt-8 text-center py-6 border-t border-gray-200">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <img 
                      src="https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/caplook-128.png" 
                      alt="Captain looking through binoculars" 
                      className="w-16 h-16 object-contain mb-2"
                    />
                    <p className="text-teal-600 font-medium text-lg">Ahoy! You've reached the edge of the horizon.</p>
                    <p className="text-gray-500">No more posts to view</p>
                    <button 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="mt-2 flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors"
                    >
                      <ArrowUp size={16} />
                      <span>Back to Top</span>
                    </button>
                  </div>
          </div>
        )}
      </div>
          )}
    </div>
      </div>
      
      {/* Right Sidebar */}
      <div className={`bg-white shadow-md transition-all duration-300 ${rightSidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 sticky top-0 h-screen overflow-hidden`}>
        <div className="p-4 h-full">
          {/* Toggle button */}
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="p-1 rounded hover:bg-gray-100"
              aria-label={rightSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {rightSidebarOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              )}
            </button>
          </div>
          
          {rightSidebarOpen ? (
            <>
              {/* Real-Time Notifications */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Notifications</h3>
                <div className="space-y-2">
                  <div className="p-2 bg-blue-50 rounded text-sm">
                    <p className="font-medium">@user mentioned you</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    <p className="font-medium">New reply to your comment</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    <p className="font-medium">Group invite: Beach Cleanup</p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </div>
              </div>
              
              {/* People & Groups You May Like */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">You May Like</h3>
                <div className="space-y-3">
                  {suggestedGroups.map(group => (
                    <div key={group.id} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        {group.avatar_url ? (
                          <img src={group.avatar_url} alt={group.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span>{group.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{group.name}</p>
                        <p className="text-xs text-gray-500">{group.member_count} members</p>
                      </div>
                      <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Community Stats Snapshot */}
              {communityStats && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Community Stats</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="mb-2">
                      <h4 className="text-xs font-medium text-gray-500">YOUR ACTIVITY</h4>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <div className="text-center">
                          <p className="text-lg font-bold">{communityStats.userPosts}</p>
                          <p className="text-xs">Posts</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{communityStats.userComments}</p>
                          <p className="text-xs">Comments</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{communityStats.userGroups}</p>
                          <p className="text-xs">Groups</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">COMMUNITY</h4>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <div className="text-center">
                          <p className="text-lg font-bold">{communityStats.activeGroups}</p>
                          <p className="text-xs">Active Groups</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{communityStats.upcomingEvents}</p>
                          <p className="text-xs">Events</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{communityStats.newMembers}</p>
                          <p className="text-xs">New Members</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Event Countdown & RSVP */}
              {upcomingEvents.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Upcoming Event</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm">{upcomingEvents[0].title}</h4>
                    <p className="text-xs text-gray-500 mb-2">{new Date(upcomingEvents[0].event_date).toLocaleDateString()} • {upcomingEvents[0].event_location}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">{upcomingEvents[0].rsvp_count} attending</span>
                      <button className="bg-blue-500 text-white text-xs px-3 py-1 rounded">
                        RSVP
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sponsored & Local Picks */}
              <div>
                <h3 className="font-medium mb-2">Local Picks</h3>
                <div className="space-y-2">
                  {localDeals.map(deal => (
                    <div key={deal.id} className="bg-gray-50 p-2 rounded-lg">
                      <div className="h-20 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400 text-xs">
                        {deal.image ? (
                          <img src={deal.image} alt={deal.title} className="w-full h-full object-cover rounded" />
                        ) : (
                          "Image placeholder"
                        )}
                      </div>
                      <p className="text-xs font-medium">{deal.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            // Icon-only view when sidebar is collapsed
            <div className="space-y-6">
              {/* Notification icon */}
              <div className="flex justify-center">
                <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </button>
              </div>
              
              {/* Groups icon */}
              <div className="flex justify-center">
                <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </button>
              </div>
              
              {/* Stats icon */}
              <div className="flex justify-center">
                <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </button>
              </div>
              
              {/* Calendar icon */}
              <div className="flex justify-center">
                <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </button>
              </div>
              
              {/* Local deals icon */}
              <div className="flex justify-center">
                <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    <Lightbox
      open={lightboxOpen}
      close={() => setLightboxOpen(false)}
      slides={activePostImages.map(url => ({ src: url }))}
      index={lightboxIndex}
    />
  </TideReactionsProvider>
  );
} 