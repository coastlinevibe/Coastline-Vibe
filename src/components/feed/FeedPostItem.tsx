'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, UserCircle2, Send, Loader2, Trash2, Edit3, XSquare, CheckSquare, 
  Megaphone, CalendarDays, HelpCircle, BarChart3, Pin, PinOff, Flag // Added Flag
} from 'lucide-react'; 
import CommentItem, { type CommentItemProps } from './CommentItem';
import { formatDistanceToNow } from 'date-fns';
import { renderFormattedText } from '@/utils/textProcessing';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // Assuming this path is correct
// import HashtagInput from '@/components/shared/HashtagInput'; // Uncomment if used
import { type PostType } from '@/components/PostToolbar'; // Adjusted path assuming PostToolbar is in components
import PollCard from './PollCard'; // Removed PollCardProps, PollOption
import Link from 'next/link';
import PostImage from './PostImage';
import CommentForm from './CommentForm';

// Interface for props passed to FeedPostItem
export interface FeedPostItemProps {
  id: string;
  postAuthorUserId: string;
  currentUserId?: string | null; // Single definition of currentUserId
  authorName: string;
  authorAvatarUrl?: string | null;
  timestamp: string;
  title?: string | null;
  textContent: string;
  updated_at?: string | null;
  imageUrl?: string | null;
  poll_id?: string | null; 
  is_pinned?: boolean; // <<< Added is_pinned
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser: boolean;
  onToggleLike: (postId: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<CommentItemProps[]>;
  onCommentSubmit: (postId: string, commentText: string) => Promise<boolean>;
  onDeletePost?: (postId: string) => Promise<void>;
  onUpdatePost?: (postId: string, newContent: string) => Promise<boolean>;
  onTogglePin?: (postId: string, currentPinStatus: boolean) => Promise<boolean>; // <<< Added onTogglePin
  onActualDeleteComment?: (commentId: string) => Promise<boolean>;
  onActualUpdateComment?: (commentId: string, newContent: string) => Promise<boolean>;
  onReplySubmit?: (parentCommentId: string, replyText: string, parentDepth: number) => Promise<boolean>;
  onLikeComment?: (commentId: string) => Promise<void>;
  onUnlikeComment?: (commentId: string) => Promise<void>;
  supabaseClient: SupabaseClient<Database>;
  post_type: PostType;
  event_start_time?: string | null; 
  event_end_time?: string | null;
  event_location_text?: string | null; 
  event_description?: string | null;
  images?: string[] | null;
  video_url?: string | null;
}

// For comment hierarchy
export type CommentItemPropsWithReplies = CommentItemProps & {
  replies: CommentItemPropsWithReplies[];
};

// Utility to build comment hierarchy
const buildCommentHierarchy = (comments: CommentItemProps[], rootPostId: string): CommentItemPropsWithReplies[] => {
  // Debug: print all comment ids and parent_ids
  console.log('[buildCommentHierarchy] rootPostId:', rootPostId);
  comments.forEach(c => {
    console.log(`[buildCommentHierarchy] comment id: ${c.id}, parent_id: ${c.parent_id}, depth: ${c.depth}, text: ${c.textContent}`);
  });
  const commentsById: { [key: string]: CommentItemPropsWithReplies } = {};
  const nestedComments: CommentItemPropsWithReplies[] = [];
  comments.forEach(comment => { commentsById[comment.id] = { ...comment, replies: [] }; });
  comments.forEach(comment => {
    const currentCommentWithReplies = commentsById[comment.id];
    if (comment.parent_id && comment.parent_id !== rootPostId && commentsById[comment.parent_id]) {
      commentsById[comment.parent_id].replies.push(currentCommentWithReplies);
    } else if (comment.parent_id === rootPostId || comment.depth === 1) {
      nestedComments.push(currentCommentWithReplies);
    }
  });
  const sortByTimestamp = (a: CommentItemPropsWithReplies, b: CommentItemPropsWithReplies) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  Object.values(commentsById).forEach(comment => { comment.replies.sort(sortByTimestamp); });
  nestedComments.sort(sortByTimestamp);
  return nestedComments;
};

// For Poll data structure within FeedPostItem state
interface PollOptionWithVotes { id: string; text: string; votes: number; isVotedByUser?: boolean; }
interface PollFullDetails {
  question: string;
  options: PollOptionWithVotes[];
  totalVotesDistinctUsers?: number;
}

// Helper component for type-specific rendering
const PostTypeSpecificElements: React.FC<{
  post_type: PostType;
  title?: string | null;
  event_start_time?: string | null;
  event_end_time?: string | null;
  event_location_text?: string | null;
  event_description?: string | null;
  poll_id?: string | null; // The ID of the poll itself (from posts.poll_id)
  postIdForPollCard: string; // The ID of the main post (for PollCard keying)
  pollDetails: PollFullDetails | null;
  isLoadingPoll: boolean;
  pollError: string | null;
  onVote: (pollOptionId: string) => Promise<void>; // The vote handler function
  userVote: string | null; // The current user's vote option ID
  currentUserId?: string | null;
}> = ({
  post_type,
  title,
  event_start_time,
  event_end_time,
  event_location_text,
  event_description,
  poll_id,
  postIdForPollCard,
  pollDetails,
  isLoadingPoll,
  pollError,
  onVote,
  userVote,
  currentUserId,
}) => {
  let indicatorStyle: React.CSSProperties = {};
  let icon: React.ReactNode | null = null;
  let headerContent = title ? <h3 className={`text-lg font-semibold mb-1 ${post_type === 'announce' ? 'text-yellow-700 dark:text-yellow-500' : 'text-gray-800 dark:text-gray-200'}`}>{title}</h3> : null;

  switch (post_type) {
    case 'ask':
      indicatorStyle = { borderLeft: '4px solid #3b82f6', paddingLeft: '12px' };
      icon = <HelpCircle className="w-5 h-5 text-blue-500 mr-2" />;
      headerContent = (
        <div className="flex items-center mb-1">
          {icon}
          {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>}
        </div>
      );
      break;
    case 'announce':
      indicatorStyle = { borderLeft: '4px solid #f59e0b', paddingLeft: '12px', background: 'rgba(245, 158, 11, 0.05)' };
      icon = <Megaphone className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />;
       headerContent = (
        <div className="flex items-center mb-1">
          {icon}
          {title && <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-500">{title}</h3>}
        </div>
      );
      break;
    case 'event':
      indicatorStyle = { borderLeft: '4px solid #8b5cf6', paddingLeft: '12px' };
      icon = <CalendarDays className="w-5 h-5 text-purple-500 mr-2" />; // Corrected icon
      headerContent = (
         <div className="flex items-center mb-1">
          {icon}
          {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>}
        </div>
      );
      break;
    case 'poll':
      indicatorStyle = { borderLeft: '4px solid #10b981', paddingLeft: '12px' };
      icon = <BarChart3 className="w-5 h-5 text-green-500 mr-2" />; // Corrected icon
      headerContent = (
        <div className="flex items-center mb-1">
          {icon}
          {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>}
        </div>
      );
      break;
    case 'general':
    default:
      // No specific border or icon for general posts
      break;
  }

  return (
    <div style={indicatorStyle} className="mb-2">
      {headerContent}
      {post_type === 'event' && (
        <div className="text-sm text-purple-600 dark:text-purple-400 mb-2 bg-purple-50 rounded p-2">
          {event_start_time && (
            <p>
              <strong>Event Date:</strong>{' '}
              {new Date(event_start_time).toLocaleDateString()} {new Date(event_start_time).toLocaleTimeString()}
            </p>
          )}
          {event_location_text && (
            <p>
              <strong>Location:</strong> {event_location_text}
            </p>
          )}
          {event_description && (
            <p>
              <strong>Description:</strong> {event_description}
            </p>
          )}
        </div>
      )}
      {post_type === 'poll' && poll_id && ( // Ensure poll_id (from post) exists
        isLoadingPoll ? (
          <div className="flex justify-center items-center py-4"><Loader2 className="animate-spin text-blue-500" size={24} /><span className="ml-2 text-gray-600 dark:text-gray-300">Loading poll...</span></div>
        ) : pollError ? (
          <p className="text-xs text-red-500 mb-2">Error loading poll: {pollError}</p>
        ) : pollDetails ? (
          <PollCard
            postId={postIdForPollCard} // Main post ID for unique radio names
            question={pollDetails.question}
            options={pollDetails.options.map(opt => ({ id: opt.id, text: opt.text, votes: opt.votes }))} // Map to PollCard's expected PollOption structure
            userVote={userVote}
            onVote={onVote} // Pass the handler from FeedPostItem
            totalVotesOverall={pollDetails.totalVotesDistinctUsers}
          />
        ) : <p className="text-xs text-gray-500 dark:text-gray-400">Poll data not available.</p>
      )}
    </div>
  );
};

const EMOJI_REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'heart', emoji: '❤️', label: 'Heart' },
  { key: 'angry', emoji: '😡', label: 'Angry' },
  { key: 'cry', emoji: '😢', label: 'Cry' },
];

export default function FeedPostItem({ 
  id, postAuthorUserId, currentUserId, authorName, authorAvatarUrl, timestamp, title, textContent: initialTextContent,
  updated_at, imageUrl, poll_id, is_pinned = false, likeCount, commentCount: initialCommentCount, isLikedByCurrentUser,
  onToggleLike, fetchComments, onCommentSubmit, onDeletePost, onUpdatePost, onTogglePin,
  onActualDeleteComment, 
  onActualUpdateComment, onReplySubmit, onLikeComment, onUnlikeComment, supabaseClient, post_type,
  event_start_time, event_end_time, event_location_text, event_description,
  images,
  video_url,
}: FeedPostItemProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItemProps[]>([]);
  const [displayedCommentsHierarchy, setDisplayedCommentsHierarchy] = useState<CommentItemPropsWithReplies[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentCommentCount, setCurrentCommentCount] = useState(initialCommentCount);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const [commentInputValue, setCommentInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(initialTextContent); 
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [displayedTextContent, setDisplayedTextContent] = useState(initialTextContent);
  
  // State for Poll Data - Restored
  const [pollDetails, setPollDetails] = useState<PollFullDetails | null>(null);
  const [userPollVote, setUserPollVote] = useState<string | null>(null);
  const [isLoadingPoll, setIsLoadingPoll] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const [optimisticLikeCount, setOptimisticLikeCount] = useState(likeCount);
  const [optimisticIsLiked, setOptimisticIsLiked] = useState(isLikedByCurrentUser);

  const [isProcessingPin, setIsProcessingPin] = useState(false); // <<< State for pin processing

  // --- Emoji Reaction State ---
  const [emojiCounts, setEmojiCounts] = useState<{ [key: string]: number }>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Gallery modal state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);

  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    setDisplayedTextContent(initialTextContent);
    if (!isEditing) setEditedText(initialTextContent);
  }, [initialTextContent, isEditing]);

  useEffect(() => { setCurrentCommentCount(initialCommentCount); }, [initialCommentCount]);
  useEffect(() => { setOptimisticLikeCount(likeCount); }, [likeCount]);
  useEffect(() => { setOptimisticIsLiked(isLikedByCurrentUser); }, [isLikedByCurrentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadComments = useCallback(async () => {
    if (!id || !fetchComments) return;
    setIsLoadingComments(true);
    setCommentError(null);
    try {
      const fetched = await fetchComments(id);
      setComments(fetched || []); 
      setDisplayedCommentsHierarchy(buildCommentHierarchy(fetched || [], id)); 
    } catch (error) {
      console.error("Error fetching comments for post", id, error);
      setCommentError("Failed to load comments.");
      setDisplayedCommentsHierarchy([]);
    } finally {
      setIsLoadingComments(false);
    }
  }, [id, fetchComments]);

  useEffect(() => {
    if (showComments) loadComments();
  }, [showComments, loadComments]);

  const fetchPollData = useCallback(async () => {
    if (post_type !== 'poll' || !id || !poll_id) return; 
    setIsLoadingPoll(true); // Restored
    setPollError(null); // Restored
    try {
      const { data: pollDataFromDb, error: pollErrorFromDb } = await supabaseClient
        .from('polls')
        .select(`question, poll_options (id, option_text, poll_votes (user_id))`)
        .eq('post_id', poll_id)
        .single();
      if (pollErrorFromDb) throw pollErrorFromDb;
      if (!pollDataFromDb) throw new Error('Poll data not found.');

      const optionsWithCounts: PollOptionWithVotes[] = pollDataFromDb.poll_options.map((opt: any) => ({
        id: opt.id,
        text: opt.option_text,
        votes: opt.poll_votes.length,
        isVotedByUser: currentUserId ? opt.poll_votes.some((vote: any) => vote.user_id === currentUserId) : false,
      }));

      let currentUserVoteOptionId: string | null = null;
      optionsWithCounts.forEach(opt => { if (opt.isVotedByUser) currentUserVoteOptionId = opt.id; });
      
      const allVoterIds = new Set<string>();
      pollDataFromDb.poll_options.forEach((opt: any) => {
        opt.poll_votes.forEach((vote: any) => allVoterIds.add(vote.user_id));
      });
      const totalVotesDistinctUsers = allVoterIds.size;

      setPollDetails({ question: pollDataFromDb.question, options: optionsWithCounts, totalVotesDistinctUsers });
      if (currentUserVoteOptionId) setUserPollVote(currentUserVoteOptionId); // Restored

    } catch (e) {
      const err = e as Error;
      console.error(`Poll data error for post ${id}:`, err);
      setPollError(err.message || 'Failed to load poll details.'); // Restored
      setPollDetails(null);
    } finally {
      setIsLoadingPoll(false); // Restored
    }
  }, [id, poll_id, post_type, supabaseClient, currentUserId]); // Added currentUserId

  useEffect(() => { if (post_type === 'poll') fetchPollData(); }, [post_type, fetchPollData]);

  const handleOptimisticLike = async () => {
    if (!onToggleLike) return;
    const originalLiked = optimisticIsLiked;
    const originalCount = optimisticLikeCount;
    setOptimisticIsLiked(!originalLiked);
    setOptimisticLikeCount(prev => originalLiked ? Math.max(0, prev - 1) : prev + 1);
    try { await onToggleLike(id); } 
    catch { setOptimisticIsLiked(originalLiked); setOptimisticLikeCount(originalCount); }
  };

  const handleCommentSubmitInternal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const commentText = commentInputValue.trim();
    if (!commentText || !onCommentSubmit) return;
    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const success = await onCommentSubmit(id, commentText);
      if (success) {
        setCommentInputValue('');
        setCurrentCommentCount(prev => prev + 1);
        if (showComments) loadComments(); 
        if (commentInputRef.current) commentInputRef.current.style.height = 'auto';
        // Refetch the post to get the latest comment count
        try {
          const { data: postData, error: postError } = await supabaseClient
            .from('community_feed_view')
            .select('comment_count')
            .eq('id', id)
            .single();
          if (!postError && postData && typeof postData.comment_count === 'number') {
            setCurrentCommentCount(postData.comment_count);
          }
        } catch (e) { /* ignore error, keep optimistic count */ }
      } else { setCommentError("Failed to submit comment."); }
    } catch (e) {
      const err = e as Error;
      console.error("Error submitting comment:", err);
      setCommentError(err.message || "An error occurred.");
    } finally { setIsSubmittingComment(false); }
  };

  const handleDeleteInternal = async () => {
    if (onDeletePost && window.confirm("Are you sure you want to delete this post?")) {
      setShowOptionsMenu(false);
      try { 
        await onDeletePost(id); 
        // If successful, the post should disappear from the feed. 
        // No explicit 'if(success)' needed if onDeletePost is Promise<void>
      } catch (e) { 
        console.error("Error deleting post:", e); 
        // Optionally, show an error to the user
        alert("Failed to delete post.");
      }
    }
  };

  const handleEditInternal = () => { setEditedText(displayedTextContent); setIsEditing(true); setShowOptionsMenu(false); setEditError(null); };
  const handleCancelEditInternal = () => { setIsEditing(false); setEditedText(displayedTextContent); setEditError(null); };
  
  const handleSaveEditInternal = async () => {
    if (!onUpdatePost || !editedText.trim() || editedText.trim() === displayedTextContent.trim()) {
      if (!editedText.trim()) setEditError("Content cannot be empty.");
      else if (editedText.trim() === displayedTextContent.trim()) setIsEditing(false); 
      return;
    }
    setIsSavingEdit(true); setEditError(null);
    try {
      const success = await onUpdatePost(id, editedText.trim());
      if (success) { setIsEditing(false); setDisplayedTextContent(editedText.trim()); }
      else { setEditError("Failed to save. Please try again."); }
    } catch (e) { const err = e as Error; setEditError(err.message || "Save failed."); }
    finally { setIsSavingEdit(false); }
  };
  
  const handlePollVoteInternal = async (optionId: string) => {
    if (!poll_id || !currentUserId) {
      console.warn("Poll ID or User ID missing for voting.");
      setPollError("Login to vote or poll ID is missing."); // User-facing error
      return;
    }
    
    const previousVote = userPollVote;
    setUserPollVote(optionId); // Optimistic update

    try {
      const { data: existingVote, error: fetchVoteError } = await supabaseClient
        .from('poll_votes')
        .select('id, poll_option_id')
        .eq('poll_post_id', poll_id) 
        .eq('user_id', currentUserId)
        .single();

      if (fetchVoteError && fetchVoteError.code !== 'PGRST116') { 
        // PGRST116 means "single row not found", which is fine for a new vote
        console.error('[PollVoteInternal] Error fetching existing vote:', fetchVoteError);
        throw fetchVoteError;
      }

      if (existingVote) {
        if (existingVote.poll_option_id === optionId) {
          // Unvoting: User clicked the same option again
          console.log(`[PollVoteInternal] User ${currentUserId} is UNVOTING. Poll ID: ${poll_id}, Option ID: ${optionId}. Existing vote ID: ${existingVote.id}`);
          const { error: deleteError } = await supabaseClient
            .from('poll_votes')
            .delete()
            .match({ id: existingVote.id });
          if (deleteError) {
            console.error('[PollVoteInternal] Error deleting vote:', deleteError);
            throw deleteError;
          }
          setUserPollVote(null); // Clear optimistic vote, was successful
          console.log(`[PollVoteInternal] Successfully DELETED vote for user ${currentUserId}, poll ${poll_id}`);
        } else {
          // Changing vote: User clicked a different option
          console.log(`[PollVoteInternal] User ${currentUserId} is CHANGING VOTE. Poll ID: ${poll_id}, From Option ID: ${existingVote.poll_option_id}, To Option ID: ${optionId}. Existing vote ID: ${existingVote.id}`);
          const { error: updateError } = await supabaseClient
            .from('poll_votes')
            .update({ poll_option_id: optionId, voted_at: new Date().toISOString() })
            .match({ id: existingVote.id });
          if (updateError) {
            console.error('[PollVoteInternal] Error updating vote:', updateError);
            throw updateError;
          }
          console.log(`[PollVoteInternal] Successfully UPDATED vote for user ${currentUserId}, poll ${poll_id} to option ${optionId}`);
        }
      } else {
        // New vote
        console.log(`[PollVoteInternal] User ${currentUserId} is CASTING NEW VOTE. Poll ID: ${poll_id}, Option ID: ${optionId}`);
        const votePayload = {
          poll_option_id: optionId,
          user_id: currentUserId,
          poll_post_id: poll_id, 
          voted_at: new Date().toISOString(),
        };
        console.log('[PollVoteInternal] New vote payload:', votePayload);
        const { error: insertError } = await supabaseClient
          .from('poll_votes')
          .insert(votePayload);
        if (insertError) {
          console.error('[PollVoteInternal] Error inserting new vote:', insertError);
          throw insertError;
        }
        console.log(`[PollVoteInternal] Successfully INSERTED new vote for user ${currentUserId}, poll ${poll_id}, option ${optionId}`);
      }
      fetchPollData(); // Refresh poll data, which includes vote counts and user's vote
    } catch (error: any) { // Changed to any to access error properties
      console.error(`[PollVoteInternal_Catch] Error processing poll vote for poll ${poll_id}, option ${optionId}. Error Code: ${error?.code}, Message: ${error?.message}, Details: ${error?.details}, Hint: ${error?.hint}`, error);
      setPollError('Failed to record vote. Please try again.'); // Set user-facing error
      // Revert optimistic update if there was an error
      if (previousVote !== undefined) { 
         setUserPollVote(previousVote);
      } else {
         setUserPollVote(null); 
      }
    }
  };

  const handleTogglePinInternal = async () => {
    if (!onTogglePin) return;
    setIsProcessingPin(true);
    try {
      const success = await onTogglePin(id, is_pinned);
      if (!success) {
        // Error is handled by the parent component
        setShowOptionsMenu(false);
      }
    } catch (e) {
      console.error("Error toggling pin status:", e);
    } finally {
      setIsProcessingPin(false);
    }
  };

  useEffect(() => {
    const textarea = commentInputRef.current;
    if (textarea) {
      const adjustHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      };
      textarea.addEventListener('input', adjustHeight);
      adjustHeight(); 
      return () => textarea.removeEventListener('input', adjustHeight);
    }
  }, [commentInputValue]);

  // Fetch emoji reactions for this post
  useEffect(() => {
    let isMounted = true;
    const fetchReactions = async () => {
      const { data, error } = await supabaseClient
        .from('feed_post_likes')
        .select('reaction, user_id')
        .eq('post_id', id);
      if (!isMounted) return;
      if (error) return;
      const counts: { [key: string]: number } = {};
      let userReact: string | null = null;
      data?.forEach(row => {
        if (typeof row.reaction === 'string') {
          counts[row.reaction] = (counts[row.reaction] || 0) + 1;
          if (row.user_id === currentUserId) userReact = row.reaction;
        }
      });
      setEmojiCounts(counts);
      setUserReaction(userReact);
    };
    fetchReactions();
    return () => { isMounted = false; };
  }, [id, supabaseClient, currentUserId]);

  // Handle emoji reaction
  const handleEmojiReaction = async (reactionKey: string) => {
    if (!currentUserId) return;
    setShowEmojiPicker(false);
    setUserReaction(reactionKey);
    // Upsert reaction
    await supabaseClient.from('feed_post_likes').upsert({
      user_id: currentUserId,
      post_id: id,
      reaction: reactionKey,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,post_id' });
    // Refetch reactions
    const { data, error } = await supabaseClient
      .from('feed_post_likes')
      .select('reaction, user_id')
      .eq('post_id', id);
    if (error) return;
    const counts: { [key: string]: number } = {};
    let userReact: string | null = null;
    data?.forEach(row => {
      if (typeof row.reaction === 'string') {
        counts[row.reaction] = (counts[row.reaction] || 0) + 1;
        if (row.user_id === currentUserId) userReact = row.reaction;
      }
    });
    setEmojiCounts(counts);
    setUserReaction(userReact);
  };

  // Modal keyboard navigation
  useEffect(() => {
    if (!galleryOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGalleryOpen(false);
      if (e.key === 'ArrowLeft') setGalleryIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight' && images && galleryIndex < images.length - 1) setGalleryIndex(i => i + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [galleryOpen, images, galleryIndex]);

  // Gallery grid layout logic
  const renderGallery = () => {
    if (!images || images.length === 0) return null;
    const imgs = images.slice(0, 5);
    const extra = images.length > 5 ? images.length - 5 : 0;

    // 1 image: full width
    if (imgs.length === 1) {
      return (
        <div className="mt-3 w-full aspect-[4/3] rounded-lg overflow-hidden cursor-pointer" onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}>
          <PostImage src={imgs[0]} alt={title || 'Post image'} />
        </div>
      );
    }

    // 2 images: side by side
    if (imgs.length === 2) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-1">
          {imgs.map((src, i) => (
            <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer" onClick={() => { setGalleryIndex(i); setGalleryOpen(true); }}>
              <PostImage src={src} alt={title || `Image ${i+1}`} />
            </div>
          ))}
        </div>
      );
    }

    // 3 images: one large left, two stacked right
    if (imgs.length === 3) {
      return (
        <div className="mt-3 grid grid-cols-3 gap-1 h-56">
          <div className="col-span-2 row-span-2 h-full rounded-lg overflow-hidden cursor-pointer" onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}>
            <PostImage src={imgs[0]} alt={title || 'Image 1'} className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col gap-1 h-full">
            <div className="flex-1 rounded-lg overflow-hidden cursor-pointer" onClick={() => { setGalleryIndex(1); setGalleryOpen(true); }}>
              <PostImage src={imgs[1]} alt={title || 'Image 2'} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 rounded-lg overflow-hidden cursor-pointer" onClick={() => { setGalleryIndex(2); setGalleryOpen(true); }}>
              <PostImage src={imgs[2]} alt={title || 'Image 3'} className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      );
    }

    // 4 images: 2x2 grid
    if (imgs.length === 4) {
      return (
        <div className="mt-3 grid grid-cols-2 grid-rows-2 gap-1">
          {imgs.map((src, i) => (
            <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer" onClick={() => { setGalleryIndex(i); setGalleryOpen(true); }}>
              <PostImage src={src} alt={title || `Image ${i+1}`} />
            </div>
          ))}
        </div>
      );
    }

    // 5 images: 2 on top, 3 below (quilted)
    if (imgs.length === 5) {
      return (
        <div className="mt-3 flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="flex-1 aspect-[4/3] rounded-lg overflow-hidden cursor-pointer" onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}>
              <PostImage src={imgs[0]} alt={title || 'Image 1'} />
            </div>
            <div className="flex-1 aspect-[4/3] rounded-lg overflow-hidden cursor-pointer" onClick={() => { setGalleryIndex(1); setGalleryOpen(true); }}>
              <PostImage src={imgs[1]} alt={title || 'Image 2'} />
            </div>
          </div>
          <div className="flex gap-1">
            <div className="flex-1 aspect-[4/3] rounded-lg overflow-hidden cursor-pointer" onClick={() => { setGalleryIndex(2); setGalleryOpen(true); }}>
              <PostImage src={imgs[2]} alt={title || 'Image 3'} />
            </div>
            <div className="flex-1 aspect-[4/3] rounded-lg overflow-hidden cursor-pointer" onClick={() => { setGalleryIndex(3); setGalleryOpen(true); }}>
              <PostImage src={imgs[3]} alt={title || 'Image 4'} />
            </div>
            <div className="flex-1 aspect-[4/3] rounded-lg overflow-hidden cursor-pointer relative" onClick={() => { setGalleryIndex(4); setGalleryOpen(true); }}>
              <PostImage src={imgs[4]} alt={title || 'Image 5'} />
              {extra > 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-xl font-bold rounded-lg">
                  +{extra}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  const handleReport = async () => {
    setReportError(null);
    if (!reportReason.trim()) {
      setReportError('Please provide a reason for reporting.');
      return;
    }
    try {
      await supabaseClient.from('post_reports').insert({
        post_id: id,
        reporter_id: currentUserId,
        reason: reportReason.trim(),
      });
      setShowReportModal(false);
      setReportReason('');
      alert('Report submitted. Thank you!');
    } catch (e) {
      setReportError('Failed to submit report. Please try again.');
    }
  };

  // Share handler
  const handleShare = () => {
    const url = `${window.location.origin}/community/${post_type === 'general' ? 'miami' : post_type}/feed#post-${id}`;
    navigator.clipboard.writeText(url);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  };

  // Main Render
  return (
    <div className="max-w-3xl w-full mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6 ${is_pinned ? 'border-2 border-yellow-400 dark:border-yellow-500' : ''}">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          {is_pinned && <Pin size={16} className="text-yellow-500 dark:text-yellow-400 mr-2 flex-shrink-0" />}
          {authorAvatarUrl ? (
            <Image src={authorAvatarUrl} alt={`${authorName}'s avatar`} width={40} height={40} className="rounded-full mr-3" />
          ) : (
            <UserCircle2 className="w-10 h-10 text-gray-400 dark:text-gray-500 mr-3" />
          )}
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 hover:underline">
                <Link href={`/user/${postAuthorUserId}`}>{authorName}</Link>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
              {updated_at && new Date(updated_at).getTime() > new Date(timestamp).getTime() + 60000 && ( // Only show edited if significant diff
                <span title={`Original: ${new Date(timestamp).toLocaleString()}, Edited: ${new Date(updated_at).toLocaleString()}`}> (edited)</span>
              )}
            </p>
          </div>
        </div>
        {currentUserId && currentUserId === postAuthorUserId && (onDeletePost || onUpdatePost || onTogglePin) && (
          <div className="relative" ref={optionsMenuRef}>
            <button 
              onClick={() => setShowOptionsMenu(!showOptionsMenu)} 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-full"
              disabled={isProcessingPin}
            >
              {isProcessingPin ? <Loader2 size={20} className="animate-spin" /> : <MoreHorizontal size={20} />}
            </button>
            {showOptionsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-20 border dark:border-gray-600">
                {onUpdatePost && (
                  <button 
                    onClick={handleEditInternal} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center"
                  >
                    <Edit3 size={16} className="mr-2" /> Edit Post
                  </button>
                )}
                {onDeletePost && (
                  <button 
                    onClick={handleDeleteInternal} 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-700 dark:hover:text-red-300 flex items-center"
                  >
                    <Trash2 size={16} className="mr-2" /> Delete Post
                  </button>
                )}
                {onTogglePin && (
                  <button
                    onClick={handleTogglePinInternal}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center"
                  >
                    {is_pinned ? <PinOff size={16} className="mr-2 text-yellow-600" /> : <Pin size={16} className="mr-2 text-yellow-500" />}
                    {is_pinned ? 'Unpin Post' : 'Pin Post'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Type Specific Elements */}
      <PostTypeSpecificElements 
        post_type={post_type}
        title={title}
        event_start_time={event_start_time}
        event_end_time={event_end_time}
        event_location_text={event_location_text}
        event_description={event_description}
        poll_id={poll_id} // Pass the actual poll_id from the post
        postIdForPollCard={id} // Pass the main post ID
        pollDetails={pollDetails}
        isLoadingPoll={isLoadingPoll}
        pollError={pollError}
        onVote={handlePollVoteInternal}
        userVote={userPollVote}
        currentUserId={currentUserId}
      />

      {/* Post Content */}
      {!isEditing && displayedTextContent && post_type !== 'poll' && (
        <div className="prose prose-sm sm:prose dark:prose-invert max-w-none break-words whitespace-pre-wrap mt-2 text-gray-800 dark:text-gray-200">
          {renderFormattedText(displayedTextContent)}
        </div>
      )}
      {isEditing && (
        <div className="mb-3">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-1 focus:ring-blue-500"
            rows={Math.max(3, editedText.split('\n').length)} // Auto-adjust rows based on content
          />
          {editError && <p className="text-xs text-red-500 mt-1">{editError}</p>}
          <div className="flex justify-end space-x-2 mt-2">
            <button 
              onClick={handleCancelEditInternal}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md"
              disabled={isSavingEdit}
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveEditInternal}
              className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center disabled:opacity-70"
              disabled={isSavingEdit || !editedText.trim()}
            >
              {isSavingEdit ? <Loader2 size={16} className="animate-spin mr-1" /> : <CheckSquare size={16} className="mr-1" />} 
              Save
            </button>
          </div>
        </div>
      )}
      {/* Video Player (if present) */}
      {!isEditing && video_url && (
        <div className="mb-3 rounded-lg overflow-hidden flex justify-center bg-gray-100 dark:bg-gray-750">
          <video src={video_url} controls className="rounded-md max-h-96 w-full" />
        </div>
      )}

      {/* Post Image */}
      {!isEditing && !video_url && images && images.length > 0 && renderGallery()}
      {/* Fallback for legacy single image */}
      {!isEditing && !video_url && (!images || images.length === 0) && imageUrl && (
        <div className="mb-3 rounded-lg overflow-hidden flex justify-center bg-gray-100 dark:bg-gray-750">
          <PostImage src={imageUrl} alt={title || "Post image"} />
        </div>
      )}
      {/* Gallery Modal */}
      {galleryOpen && images && images.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setGalleryOpen(false)}>
          <div className="relative max-w-3xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-white text-3xl" onClick={() => setGalleryOpen(false)}>&times;</button>
            <div className="flex items-center justify-center w-full h-[60vh]">
              <button className="text-white text-4xl px-4" onClick={() => setGalleryIndex(i => Math.max(0, i - 1))} disabled={galleryIndex === 0}>&#8592;</button>
              <img src={images[galleryIndex]} alt={title || `Image ${galleryIndex+1}`} className="max-h-[55vh] max-w-full rounded-lg object-contain" />
              <button className="text-white text-4xl px-4" onClick={() => setGalleryIndex(i => Math.min(images.length - 1, i + 1))} disabled={galleryIndex === images.length - 1}>&#8594;</button>
            </div>
            <div className="flex gap-2 mt-4">
              {images.map((src, i) => (
                <img key={i} src={src} alt={title || `Thumb ${i+1}`} className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${i === galleryIndex ? 'border-cyan-500' : 'border-transparent'}`} onClick={() => setGalleryIndex(i)} />
              ))}
            </div>
          </div>
        </div>
      )}
      

      {/* Action Bar */}
      <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
        {/* Emoji Reaction Picker */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(v => !v)}
            className="flex items-center hover:text-cyan-600 transition-colors px-2 py-1 rounded"
            disabled={!currentUserId}
            aria-label="React to post"
          >
            <span className="text-2xl mr-1">
              {userReaction
                ? EMOJI_REACTIONS.find(e => e.key === userReaction)?.emoji || '🙂'
                : '🙂'}
            </span>
            <span className="text-sm font-medium">
              {userReaction
                ? EMOJI_REACTIONS.find(e => e.key === userReaction)?.label
                : 'Add emoji'}
            </span>
          </button>
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute z-30 left-0 mt-2 flex space-x-2 bg-white border border-cyan-200 rounded-xl shadow-lg p-2">
              {EMOJI_REACTIONS.map(e => (
        <button 
                  key={e.key}
                  onClick={() => handleEmojiReaction(e.key)}
                  className={`flex flex-col items-center px-2 py-1 rounded hover:bg-cyan-50 focus:bg-cyan-100 transition-colors ${userReaction === e.key ? 'bg-cyan-100' : ''}`}
                  disabled={!currentUserId}
        >
                  <span className="text-2xl">{e.emoji}</span>
                  <span className="text-xs font-medium mt-0.5">{emojiCounts[e.key] || 0}</span>
        </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
          <MessageCircle size={20} className="mr-1.5" /> 
          <span className="text-sm">{currentCommentCount} {currentCommentCount === 1 ? 'Comment' : 'Comments'}</span>
        </button>
        <button className="flex items-center hover:text-green-500 dark:hover:text-green-400 transition-colors" onClick={handleShare}>
          <Share2 size={20} className="mr-1.5" /> <span className="text-sm">Share</span>
        </button>
        {showCopied && <span className="ml-2 text-xs text-green-600">Link copied!</span>}
        <button className="flex items-center hover:text-red-500 dark:hover:text-red-400 transition-colors ml-2" onClick={() => setShowReportModal(true)}>
          <Flag size={20} className="mr-1.5" /> <span className="text-sm">Report</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <CommentForm
            value={commentInputValue}
            onChange={setCommentInputValue}
            isSubmitting={isSubmittingComment}
            onSubmit={handleCommentSubmitInternal}
          />
          {commentError && <p className="text-xs text-red-500 mb-2">{commentError}</p>}

          {isLoadingComments ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="animate-spin text-blue-500" size={24} /> 
              <span className="ml-2 text-gray-600 dark:text-gray-300">Loading comments...</span>
            </div>
          ) : displayedCommentsHierarchy.length > 0 ? (
            <div className="space-y-3">
              {displayedCommentsHierarchy.map(comment => (
                <CommentItem 
                  key={comment.id}
                  {...comment} 
                  currentUserId={currentUserId}
                  onDeleteComment={onActualDeleteComment} 
                  onUpdateComment={onActualUpdateComment}
                  onReplySubmit={onReplySubmit}
                  onLikeComment={onLikeComment}
                  onUnlikeComment={onUnlikeComment}
                  supabaseClient={supabaseClient} 
                  depth={comment.depth || 1} 
                  replies={comment.replies} 
                />
              ))}
            </div>
          ) : (
            !isLoadingComments && !commentError && <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-3">No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center">
            <Flag size={32} className="text-red-500 mb-2" />
            <h3 className="text-lg font-semibold mb-2">Report Post?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 text-center">Please provide a reason for reporting this post.</p>
            <textarea
              className="w-full border rounded px-2 py-1 text-sm mb-2"
              placeholder="Reason for reporting..."
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              rows={3}
              maxLength={300}
              autoFocus
            />
            {reportError && <div className="text-xs text-red-500 mb-2">{reportError}</div>}
            <div className="flex gap-3">
              <button onClick={() => { setShowReportModal(false); setReportReason(''); setReportError(null); }} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
              <button onClick={handleReport} className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600">Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 