'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Heart, MessageSquare, Send, Image as ImageIcon, X, BarChart2, HelpCircle, Megaphone, Calendar } from 'lucide-react';
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
    setPosts(formattedPosts);
    
    // Apply initial filter
    filterPosts(formattedPosts, activeFilter);
    
    setPostsLoading(false);
  }, [communityUuid, supabase, activeFilter, searchQuery, activeHashtag, postId]);

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
        const postData = {
          content: newPostContent,
          user_id: user.id,
          community_id: communityUuid,
          type: postType,
          is_visible: true,
          images: mediaState.images.length > 0 ? mediaState.images : null,
          video_url: mediaState.video
        };
        
        console.log('Attempting to create post with:', postData);

        const { error } = await supabase.from('posts').insert(postData);

        if (error) {
          console.error('Error creating post:', error);
          // Here you might want to show an error message to the user
        } else {
          console.log('Post created successfully!');
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Community Feed</h1>
      
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
        
        <div className="w-48">
          <SortDropdown 
            onSortChange={handleSortChange}
            currentSort={currentSort}
          />
        </div>
      </div>

      {/* Post form */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handlePostSubmit} className="mb-6 bg-white p-4 rounded-lg shadow">
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={3}
          placeholder="What's on your mind?"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          disabled={isPosting}
        />
        
        {/* Image preview area */}
          {mediaState.images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
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
                      // Remove image from state and revoke URL
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
                  <span>Post</span>
                </>
              )}
          </button>
        </div>
      </form>

        {/* Media uploader modal */}
        {showMediaUploader && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Upload Media</h3>
                <button 
                  type="button" 
                  onClick={() => setShowMediaUploader(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <MediaUploader 
                onMediaSelected={(media) => {
                  setMediaState(media);
                  setShowMediaUploader(false);
                }}
                onError={(error) => {
                  console.error('Media upload error:', error);
                  // Optionally show an error message to the user
                }}
              />
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
                  <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden mr-3">
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
                <div>
                    <div className="font-medium">{post.author_username || 'Anonymous'}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleString()}
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
                            className="max-h-64 rounded"
                          />
                      ))}
                    </div>
                  )}
                </>
              )}
              
                {/* Post actions */}
                <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
                  {/* Like button */}
                <button 
                  onClick={() => handleToggleLike(post.id)}
                    className={`flex items-center mr-4 ${likedPosts[post.id] ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
                >
                    <Heart size={18} className="mr-1" fill={likedPosts[post.id] ? 'currentColor' : 'none'} />
                  <span>{post.like_count || 0}</span>
                </button>
                
                  {/* Comment button */}
                <button
                  onClick={() => toggleComments(post.id)}
                    className="flex items-center text-gray-500 hover:text-blue-500"
                >
                    <MessageSquare size={18} className="mr-1" />
                    <span>{post.comment_count || 0}</span>
                </button>
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
          </div>
        )}
      </div>
    </div>
  );
} 