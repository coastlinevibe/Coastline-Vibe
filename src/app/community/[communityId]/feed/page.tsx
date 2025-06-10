'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Heart, MessageSquare, Send, Image as ImageIcon, X, BarChart2, HelpCircle, Megaphone, Calendar, MessageCircle, UserCircle2, Hash } from 'lucide-react';
import PollCreator from '@/components/feed/PollCreator';
import PollCard from '@/components/feed/PollCard';
import FeedFilters, { FeedContentType } from '@/components/feed/FeedFilters';
import AnnouncementCreator from '@/components/feed/AnnouncementCreator';
import QuestionCreator from '@/components/feed/QuestionCreator';
import EventCreator from '@/components/feed/EventCreator';
import PostCreator from '@/components/feed/PostCreator';
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
import LocationFilters from '@/components/feed/LocationFilters';
import { ToastProvider } from '@/components/ui/toast';
import LeftSidebar from '@/components/feed/LeftSidebar';
import RightSidebar from '@/components/feed/RightSidebar';

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
  
  // Media upload states
  const [mediaState, setMediaState] = useState<{ images: string[], video: string | null }>({
    images: [],
    video: null
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
  
  // Location-based feed state
  const [hasLocationData, setHasLocationData] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    locationName: string | null;
  }>({
    latitude: null,
    longitude: null,
    locationName: null
  });
  const [locationFilters, setLocationFilters] = useState<{
    neighborhoods?: string[];
    maxDistance?: number;
    showOnlyVerified?: boolean;
  }>({});

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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      setPostsLoading(false);
      return;
    }
    
    console.log('Fetched posts:', data);
    
    // Format posts with author information
    const formattedPosts = data.map((post: any) => {
      // Extract hashtags from content
      const hashtags = post.content ? extractHashtags(post.content) : [];
      
      return {
        ...post,
        author_username: post.profiles?.username,
        author_avatar_url: post.profiles?.avatar_url,
        hashtags: hashtags
      };
    });
    
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
    
    // Extract popular hashtags
    const allHashtags = findPopularHashtags(formattedPosts.map(post => ({ content: post.content || '' })));
    setPopularHashtags(allHashtags);
    
    setContentTypeCounts(typeCounts);
    setPosts(formattedPosts);
    
    // Apply initial filter
    filterPosts(formattedPosts, activeFilter);
    
    setPostsLoading(false);
  }, [communityUuid, supabase, activeFilter, searchQuery, activeHashtag, postId]);

  // Add this function to handle filter change that was removed
  const handleFilterChange = (filter: FeedContentType) => {
    setActiveFilter(filter);
    filterPosts(posts, filter);
  };

  // Update the filterPosts function to include location filters
  const filterPosts = (allPosts: any[], filter: FeedContentType) => {
    if (!allPosts) return [];
    
    console.log('Filtering posts. Total posts:', allPosts.length);
    console.log('Active filter:', filter);
    
    let filtered = allPosts;
    
    // Filter by post type
    if (filter !== 'all') {
      filtered = filtered.filter(post => post.type === filter);
      console.log(`After type filter (${filter}):`, filtered.length);
    }
    
    // Apply search filter
    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(post => {
        return (
          (post.content && post.content.toLowerCase().includes(normalizedQuery)) ||
          (post.author_username && post.author_username.toLowerCase().includes(normalizedQuery)) ||
          (post.title && post.title.toLowerCase().includes(normalizedQuery))
        );
      });
      console.log('After search filter:', filtered.length);
    }
    
    // Apply hashtag filter
    if (activeHashtag) {
      filtered = filtered.filter(post => {
        if (!post.hashtags) return false;
        return post.hashtags.includes(activeHashtag);
      });
      console.log('After hashtag filter:', filtered.length);
    }
    
    // Apply location filters
    if (locationFilters.neighborhoods && locationFilters.neighborhoods.length > 0) {
      filtered = filtered.filter(post => {
        return post.neighborhood && locationFilters.neighborhoods?.includes(post.neighborhood);
      });
      console.log('After neighborhood filter:', filtered.length);
    }
    
    if (locationFilters.maxDistance !== undefined && userLocation.latitude !== null && userLocation.longitude !== null) {
      filtered = filtered.filter(post => {
        if (!post.latitude || !post.longitude) return false;
        
        // Use the Haversine formula function from the database to calculate distance
        const distance = calculateDistance(
          userLocation.latitude as number,
          userLocation.longitude as number,
          parseFloat(post.latitude),
          parseFloat(post.longitude)
        );
        
        return distance <= (locationFilters.maxDistance as number);
      });
      console.log('After distance filter:', filtered.length);
    }
    
    if (locationFilters.showOnlyVerified) {
      filtered = filtered.filter(post => post.location_verified);
      console.log('After verified location filter:', filtered.length);
    }
    
    console.log('Final filtered posts:', filtered.length);
    setFilteredPosts(filtered);
    return filtered;
  };

  // Add this helper function to calculate distance locally in the browser
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };
  
  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  // Update the handleSortChange function to include location-based sorting
  const handleSortChange = (sortOption: SortOption) => {
    setCurrentSort(sortOption);
    sortPosts(filteredPosts, sortOption);
  };

  // Update the sortPosts function to include location-based sorting options
  const sortPosts = (postsToSort: any[], sortOption: SortOption) => {
    let sorted = [...postsToSort];
    
    switch (sortOption) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'trending':
        // Simple algorithm for trending: likes + 2*comments in the last week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        sorted.sort((a, b) => {
          const aDate = new Date(a.created_at);
          const bDate = new Date(b.created_at);
          const aRecent = aDate > oneWeekAgo ? 1 : 0.5;
          const bRecent = bDate > oneWeekAgo ? 1 : 0.5;
          
          const aScore = (a.like_count || 0) + 2 * (a.comment_count || 0);
          const bScore = (b.like_count || 0) + 2 * (b.comment_count || 0);
          
          return (bScore * bRecent) - (aScore * aRecent);
        });
        break;
      case 'most_liked':
        sorted.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        break;
      case 'most_commented':
        sorted.sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0));
        break;
      case 'nearest':
        if (userLocation.latitude !== null && userLocation.longitude !== null) {
          sorted.sort((a, b) => {
            // If either post doesn't have location data, put it at the end
            if (!a.latitude || !a.longitude) return 1;
            if (!b.latitude || !b.longitude) return -1;
            
            const distanceA = calculateDistance(
              userLocation.latitude as number,
              userLocation.longitude as number,
              parseFloat(a.latitude),
              parseFloat(a.longitude)
            );
            
            const distanceB = calculateDistance(
              userLocation.latitude as number,
              userLocation.longitude as number,
              parseFloat(b.latitude),
              parseFloat(b.longitude)
            );
            
            return distanceA - distanceB;
          });
        }
        break;
      case 'neighborhood':
        // Sort by preferred neighborhoods
        if (locationFilters.neighborhoods && locationFilters.neighborhoods.length > 0) {
          sorted.sort((a, b) => {
            const aInNeighborhood = a.neighborhood && locationFilters.neighborhoods?.includes(a.neighborhood) ? 1 : 0;
            const bInNeighborhood = b.neighborhood && locationFilters.neighborhoods?.includes(b.neighborhood) ? 1 : 0;
            
            // First priority: is it in a preferred neighborhood?
            if (aInNeighborhood !== bInNeighborhood) {
              return bInNeighborhood - aInNeighborhood;
            }
            
            // Second priority: recency
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        }
        break;
    }
    
    setFilteredPosts(sorted);
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
      }
    };
    getCurrentUser();

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

  const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPostContent.trim() && mediaState.images.length === 0 && !mediaState.video) return;

    setIsPosting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      try {
        // Prepare post data
        console.log('Media state before post creation:', mediaState);
        
        const postData = {
          content: newPostContent,
          user_id: user.id,
          community_id: communityUuid,
          type: postType,
          is_visible: true,
          images: mediaState.images.length > 0 ? mediaState.images : null,
          video_url: mediaState.video
        };
        
        console.log('Creating post with data:', postData);

        const { data, error } = await supabase.from('posts').insert(postData).select();

        if (error) {
          console.error('Error creating post:', error);
          // Here you might want to show an error message to the user
        } else {
          console.log('Post created successfully!', data);
          setNewPostContent('');
          setMediaState({ images: [], video: null });
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
    
    try {
      // Get all comments for this post from the comments table
      const { data, error } = await supabase
        .from('comments')
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
        .eq('post_id', postId)
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
        parent_id: comment.parent_comment_id || postId,
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
        content: comment.content,
        replies: []
      }));
      
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
      
      // Build comment hierarchy
      const commentsById: { [key: string]: any } = {};
      const rootComments: any[] = [];
      
      // First pass: index all comments by ID
      formattedComments.forEach(comment => {
        commentsById[comment.id] = comment;
      });
      
      // Second pass: build the hierarchy
      formattedComments.forEach(comment => {
        // Check if this is a root comment (directly on the post, no parent comment)
        if (comment.parent_id === postId) {
          // This is a root-level comment (direct reply to the post)
          rootComments.push(comment);
        } else if (comment.parent_id && commentsById[comment.parent_id]) {
          // This is a reply to another comment
          if (!commentsById[comment.parent_id].replies) {
            commentsById[comment.parent_id].replies = [];
          }
          commentsById[comment.parent_id].replies.push(comment);
        }
      });
      
      console.log('Setting hierarchical comments for post:', postId, rootComments);
      
      setComments(prev => ({
        ...prev,
        [postId]: rootComments
      }));
    } catch (err) {
      console.error('Error in fetchComments:', err);
    }
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
      
      // Create the comment in the comments table
      const { data: commentData, error } = await supabase
        .from('comments')
        .insert({
          content: commentText[postId],
          user_id: currentUserId,
          post_id: postId,
          parent_comment_id: null,
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
        authorLastSeenAt: userData.last_seen_at,
        replies: []
      };
      
      // Update comments state
      setComments(prev => {
        const existingComments = prev[postId] || [];
        return {
          ...prev,
          [postId]: [...existingComments, newComment]
        };
      });
      
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
  
  // Handler for standard post creation from PostCreator component
  const handlePostCreated = () => {
    fetchPosts();
  };

  // Add this function to handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Reset hashtag filter if search is used
    if (query && activeHashtag) {
      setActiveHashtag(null);
    }
    
    // Apply filters
    filterPosts(posts, activeFilter);
  }, [activeHashtag, activeFilter, posts]);

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
      let parentComment: any = null;
      
      // Search through all comments to find the parent comment
      for (const [key, commentsList] of Object.entries(comments)) {
        // Helper function to search recursively through comment tree
        const findCommentRecursive = (commentsToSearch: any[]): any => {
          for (const c of commentsToSearch) {
            if (c.id === parentCommentId) {
              parentComment = c;
              return true;
            }
            // Check replies if they exist
            if (c.replies && c.replies.length > 0) {
              if (findCommentRecursive(c.replies)) {
                return true;
              }
            }
          }
          return false;
        };
        
        if (findCommentRecursive(commentsList)) {
          postId = key;
          break;
        }
      }
      
      if (!postId || !parentComment) {
        console.error('Could not find post ID or parent comment');
        return false;
      }
      
      // Get current user's profile info
      const { data: userData } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio, created_at, email, role, last_seen_at, is_location_verified')
        .eq('id', currentUserId)
        .single();
        
      if (!userData) throw new Error('User profile not found');
      
      // Create the reply comment in the comments table
      const { data: replyData, error } = await supabase
        .from('comments')
        .insert({
          content: replyText,
          user_id: currentUserId,
          post_id: postId,
          parent_comment_id: parentCommentId,
          depth: parentDepth,
          is_visible: true
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Format the new reply
      const newReply = {
        id: replyData.id,
        content: replyData.content,
        textContent: replyData.content,
        authorName: userData.username || 'Anonymous',
        authorAvatarUrl: userData.avatar_url,
        timestamp: replyData.created_at,
        commentAuthorId: replyData.user_id,
        parent_id: parentCommentId,
        depth: replyData.depth || parentDepth,
        updated_at: replyData.updated_at,
        likeCount: 0,
        isLikedByCurrentUser: false,
        authorBio: userData.bio,
        authorEmail: userData.email,
        authorProfileCreatedAt: userData.created_at,
        authorRole: userData.role,
        authorIsLocationVerified: userData.is_location_verified,
        authorLastSeenAt: userData.last_seen_at,
        replies: []
      };
      
      // After creating the reply, refresh comments to get the updated hierarchy
      await fetchComments(postId);
      
      // Send notification to comment owner if it's not the current user
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
        .from('comments')
        .update({ like_count: (comment.likeCount || 0) + 1 })
        .eq('id', commentId);
        
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
      let comment = null;
      
      for (const [key, commentsList] of Object.entries(comments)) {
        comment = commentsList.find(c => c.id === commentId);
        if (comment) {
          postId = key;
          break;
        }
      }
      
      if (!postId || !comment) return;
      
      // Remove like from database
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('post_id', commentId);
        
      if (error) throw error;
      
      // Update comment like count in database
      await supabase
        .from('comments')
        .update({ like_count: Math.max(0, (comment.likeCount || 0) - 1) })
        .eq('id', commentId);
      
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
    if (!currentUserId) return false;
    
    try {
      // Find which post this comment belongs to
      let postId = '';
      
      for (const [key, commentsList] of Object.entries(comments)) {
        if (commentsList.some(c => c.id === commentId)) {
          postId = key;
          break;
        }
      }
      
      if (!postId) return false;
      
      // Update comment in database
      const { error } = await supabase
        .from('comments')
        .update({ content: newContent, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', currentUserId); // Ensure user can only update their own comments
        
      if (error) {
        console.error('Error updating comment:', error);
        return false;
      }
      
      // Update local state
      const updateCommentRecursively = (commentsList: any[]): any[] => {
        return commentsList.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              content: newContent,
              textContent: newContent,
              updated_at: new Date().toISOString()
            };
          }
          
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateCommentRecursively(comment.replies)
            };
          }
          
          return comment;
        });
      };
      
      setComments(prev => ({
        ...prev,
        [postId]: updateCommentRecursively(prev[postId] || [])
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
      
      for (const [key, commentsList] of Object.entries(comments)) {
        if (commentsList.some(c => c.id === commentId)) {
          postId = key;
          break;
        }
      }
      
      if (!postId) return false;
      
      // Delete comment from database (or mark as not visible)
      const { error } = await supabase
        .from('comments')
        .update({ is_visible: false })
        .eq('id', commentId)
        .eq('user_id', currentUserId); // Ensure user can only delete their own comments
        
      if (error) {
        console.error('Error deleting comment:', error);
        return false;
      }
      
      // Update local state - remove the comment
      const filterCommentsRecursively = (commentsList: any[]): any[] => {
        return commentsList
          .filter(comment => comment.id !== commentId)
          .map(comment => {
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: filterCommentsRecursively(comment.replies)
              };
            }
            return comment;
          });
      };
      
      setComments(prev => ({
        ...prev,
        [postId]: filterCommentsRecursively(prev[postId] || [])
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  };

  // Handler for opening content creators from the sidebar
  const handleOpenCreator = (type: 'poll' | 'ask' | 'announce' | 'event' | 'general' | 'group') => {
    // Close any open creators first
    setShowPollCreator(false);
    setShowAnnouncementCreator(false);
    setShowQuestionCreator(false);
    setShowEventCreator(false);
    
    // Open the requested creator
    switch(type) {
      case 'poll':
        setShowPollCreator(true);
        break;
      case 'ask':
        setShowQuestionCreator(true);
        break;
      case 'announce':
        setShowAnnouncementCreator(true);
        break;
      case 'event':
        setShowEventCreator(true);
        break;
      case 'group':
        // Redirect to group creation page
        window.location.href = `/community/${communityIdOrSlug}/vibe-groups/create`;
        break;
      default:
        // For general posts, just scroll to the post creator
        const postCreator = document.getElementById('post-creator');
        if (postCreator) {
          postCreator.scrollIntoView({ behavior: 'smooth' });
          // Focus the post input
          const postInput = postCreator.querySelector('textarea');
          if (postInput) {
            postInput.focus();
          }
        }
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-2 md:px-4 py-6">
        <div className="flex gap-4">
          {/* Left Sidebar */}
          <div className="hidden md:block">
            <LeftSidebar 
              communityId={communityIdOrSlug} 
              onHashtagSelect={handleHashtagSelect}
              onOpenCreator={handleOpenCreator}
            />
          </div>
          
          {/* Main Feed Content */}
          <div className="flex-1 max-w-2xl mx-auto">
            {/* Post Creation Area */}
            <div id="post-creator" className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
              <PostCreator
                communityId={communityUuid || ''}
                onPostCreated={handlePostCreated}
                onPollCreatorOpen={() => setShowPollCreator(true)}
                onAnnouncementCreatorOpen={() => setShowAnnouncementCreator(true)}
                onQuestionCreatorOpen={() => setShowQuestionCreator(true)}
                onEventCreatorOpen={() => setShowEventCreator(true)}
              />
            </div>
            
            {/* Content Type Filter Tabs */}
            <FeedFilters
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              counts={contentTypeCounts}
            />
            
            {/* Search and Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="flex-1">
                <SearchBar
                  onSearch={handleSearch}
                  onHashtagSelect={handleHashtagSelect}
                  popularHashtags={popularHashtags}
                />
              </div>
              <div className="w-full sm:w-auto">
                <SortDropdown currentSort={currentSort} onSortChange={handleSortChange} />
              </div>
            </div>
            
            {/* Location Filters (if enabled) */}
            {hasLocationData && currentUserId && communityUuid && (
              <div className="mb-4">
                <LocationFilters
                  userId={currentUserId}
                  communityId={communityUuid}
                  onLocationFilterChange={(newFilters) => {
                    setLocationFilters(newFilters);
                    filterPosts(posts, activeFilter);
                  }}
                />
              </div>
            )}

            {/* Active Hashtag Badge */}
            {activeHashtag && (
              <div className="mb-4 flex items-center">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                  <Hash size={14} className="mr-1" />
                  {activeHashtag}
                </div>
                <button
                  onClick={() => handleHashtagSelect(activeHashtag)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {/* Post List */}
            <div className="space-y-4">
              {postsLoading ? (
                <div className="bg-white rounded-lg p-6 text-center">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-24 bg-gray-200 rounded-md mb-4"></div>
                    <div className="h-32 w-full bg-gray-100 rounded-md"></div>
                  </div>
                </div>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map(post => {
                  // Check post type and render appropriate component
                  switch (post.type) {
                    case 'poll':
                      return (
                        <PollCard
                          key={post.id}
                          post={post}
                          onLike={() => handleToggleLike(post.id)}
                          isLiked={likedPosts[post.id]}
                          onComment={() => toggleComments(post.id)}
                        />
                      );
                    case 'event':
                      return (
                        <EventCard
                          key={post.id}
                          event={post}
                          onLike={() => handleToggleLike(post.id)}
                          isLiked={likedPosts[post.id]}
                          onComment={() => toggleComments(post.id)}
                        />
                      );
                    case 'announce':
                      return (
                        <AnnouncementCard
                          key={post.id}
                          announcement={post}
                          onLike={() => handleToggleLike(post.id)}
                          isLiked={likedPosts[post.id]}
                          onComment={() => toggleComments(post.id)}
                        />
                      );
                    case 'ask':
                      return (
                        <QuestionCard
                          key={post.id}
                          question={post}
                          onLike={() => handleToggleLike(post.id)}
                          isLiked={likedPosts[post.id]}
                          onComment={() => toggleComments(post.id)}
                        />
                      );
                    default:
                      // This is a regular post
                      return (
                        <div key={post.id} id={`post-${post.id}`} className="bg-white rounded-lg shadow-sm overflow-hidden">
                          {/* Post Header */}
                          <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center">
                              {post.author_avatar_url ? (
                                <img 
                                  src={post.author_avatar_url} 
                                  alt={post.author_username} 
                                  className="w-10 h-10 rounded-full border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <UserCircle2 className="text-blue-500" size={24} />
                                </div>
                              )}
                              <div className="ml-3">
                                <div className="font-medium text-gray-900">{post.author_username || 'Anonymous'}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(post.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Post Content */}
                          <div className="p-4">
                            <div className="whitespace-pre-line mb-3">
                              <HashtagText 
                                content={post.content} 
                                onHashtagClick={handleHashtagSelect}
                              />
                            </div>
                            
                            {/* Display media if any */}
                            {post.media_urls && post.media_urls.length > 0 && (
                              <div className="mt-2 mb-3">
                                <div className={`grid ${post.media_urls.length > 1 ? 'grid-cols-2 gap-2' : 'grid-cols-1'}`}>
                                  {post.media_urls.map((url: string, idx: number) => (
                                    <div key={idx} className="overflow-hidden rounded-lg">
                                      {url.includes('.mp4') ? (
                                        <video 
                                          controls 
                                          className="w-full h-auto"
                                          src={url}
                                        ></video>
                                      ) : (
                                        <img 
                                          src={url} 
                                          alt="" 
                                          className="w-full h-auto"
                                          onClick={() => {
                                            // Add lightbox functionality later
                                          }}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Post Toolbar */}
                          <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                            <button 
                              onClick={() => handleToggleLike(post.id)} 
                              className={`flex items-center text-sm ${likedPosts[post.id] ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                            >
                              <Heart size={18} className={likedPosts[post.id] ? 'fill-current' : ''} />
                              <span className="ml-1">{post.like_count || 0}</span>
                            </button>
                            
                            <button 
                              onClick={() => toggleComments(post.id)} 
                              className="flex items-center text-sm text-gray-500 hover:text-blue-500"
                            >
                              <MessageSquare size={18} />
                              <span className="ml-1">{post.comment_count || 0}</span>
                            </button>
                          </div>
                          
                          {/* Comments Section (hidden by default) */}
                          {showComments[post.id] && (
                            <div className="border-t border-gray-100">
                              <div className="px-4 py-3">
                                {/* Comment form */}
                                <CommentForm 
                                  postId={post.id}
                                  onSubmit={handleCommentFormSubmit(post.id)}
                                  value={commentText[post.id] || ''}
                                  onChange={(value) => setCommentText(prev => ({ ...prev, [post.id]: value }))}
                                  isSubmitting={isCommenting[post.id] || false}
                                />
                                
                                {/* Comments list */}
                                <div className="mt-4">
                                  <CommentsList 
                                    comments={comments[post.id] || []}
                                    onReplySubmit={handleReplySubmit}
                                    onLike={handleCommentLike}
                                    onUnlike={handleCommentUnlike}
                                    onUpdate={handleCommentUpdate}
                                    onDelete={handleCommentDelete}
                                    currentUserId={currentUserId}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                  }
                })
              ) : (
                <div className="bg-white rounded-lg p-6 text-center">
                  <p className="text-gray-500">No posts found</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="hidden lg:block">
            <RightSidebar communityId={communityIdOrSlug} />
          </div>
        </div>
      </div>
      
      {/* Modals for content creation */}
      {showPollCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Create Poll</h2>
              <button
                onClick={() => setShowPollCreator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <PollCreator
                communityId={communityUuid || ''}
                onPollCreated={handlePollCreated}
                onCancel={() => setShowPollCreator(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Announcement Creator Modal */}
      {showAnnouncementCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Create Announcement</h2>
              <button
                onClick={() => setShowAnnouncementCreator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <AnnouncementCreator
                communityId={communityUuid || ''}
                onAnnouncementCreated={handleAnnouncementCreated}
                onCancel={() => setShowAnnouncementCreator(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Question Creator Modal */}
      {showQuestionCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Ask a Question</h2>
              <button
                onClick={() => setShowQuestionCreator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <QuestionCreator
                communityId={communityUuid || ''}
                onQuestionCreated={handleQuestionCreated}
                onCancel={() => setShowQuestionCreator(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Event Creator Modal */}
      {showEventCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Create Event</h2>
              <button
                onClick={() => setShowEventCreator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <EventCreator
                communityId={communityUuid || ''}
                onEventCreated={handleEventCreated}
                onCancel={() => setShowEventCreator(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Media Uploader Modal */}
      {showMediaUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Upload Media</h2>
              <button
                onClick={() => setShowMediaUploader(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <MediaUploader
                onUploadComplete={(urls) => {
                  setMediaState(prev => ({
                    ...prev,
                    images: [...prev.images, ...urls]
                  }));
                  setShowMediaUploader(false);
                }}
                onCancel={() => setShowMediaUploader(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 