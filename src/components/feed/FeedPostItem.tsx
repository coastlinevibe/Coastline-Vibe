'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, UserCircle2, Send, Loader2, Trash2, Edit3, XSquare, CheckSquare, 
  Megaphone, CalendarDays, HelpCircle, BarChart3, Pin, PinOff, Flag, Smile, ShieldCheck,
  Sailboat, ChevronLeft, ChevronRight, Reply, MapPin, Calendar, CheckCircle2, XCircle, Image as ImageIcon, Paperclip, 
  Lock, AlertTriangle, Download, FileSpreadsheet, FilePdf, File, Video, Shield, User, Pencil, Plus, ChevronDown, ChevronUp
} from 'lucide-react'; 
import CommentItem, { type CommentItemProps } from './CommentItem';
import FeedPostReactionBar from './FeedPostReactionBar';
import FeedPostReactionDisplay from './FeedPostReactionDisplay';
import { formatDistanceToNow } from 'date-fns';
import { renderFormattedText } from '@/utils/textProcessing';
import FormattedPostContent from './FormattedPostContent';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // Assuming this path is correct
// import HashtagInput from '@/components/shared/HashtagInput'; // Uncomment if used
import { type PostType } from '@/components/PostToolbar'; // Adjusted path assuming PostToolbar is in components
import PollCard from './PollCard'; // Removed PollCardProps, PollOption
import Link from 'next/link';
import PostImage from './PostImage';
import CommentForm from './CommentForm';
import { CommentsList, CommentData } from './CommentsList';
import { createBrowserClient } from '@supabase/ssr'; // Ensure this is the correct import path
import { supabase } from '@/lib/supabaseClient'; // Corrected import path for Supabase client
import UserTooltipWrapper from '@/components/user/UserTooltipWrapper';
import { type UserTooltipProfileData } from '@/components/user/UserTooltipDisplay'; // Corrected import path for the type
import { createPollVoteNotification, createRsvpNotification } from '@/utils/notificationUtils';
import { Sticker as StickerType } from '@/lib/stickers/sticker-client';

// Interface for props passed to FeedPostItem
export interface FeedPostItemProps {
  id: string;
  postAuthorUserId: string;
  currentUserId?: string | null;
  currentUserRole?: string | null;
  authorName: string;
  authorFullName?: string | null;
  authorRole?: string | null;
  authorIsLocationVerified?: boolean;
  authorAvatarUrl?: string | null;
  authorIsOnline?: boolean;
  timestamp: string;
  title?: string | null;
  textContent: string;
  updated_at?: string | null;
  imageUrl?: string | null;
  poll_id?: string | null; 
  is_pinned?: boolean;
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser: boolean;
  onToggleLike: (postId: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<CommentItemProps[]>;
  onCommentSubmit: (postId: string, commentText: string, files?: File[]) => Promise<boolean>;
  onDeletePost?: (postId: string) => Promise<void>;
  onUpdatePost?: (postId: string, newContent: string) => Promise<boolean>;
  onTogglePin?: (postId: string, currentPinStatus: boolean) => Promise<boolean>;
  onActualDeleteComment?: (commentId: string) => Promise<boolean>;
  onActualUpdateComment?: (commentId: string, newContent: string) => Promise<boolean>;
  onReplySubmit?: (parentCommentId: string, replyText: string, parentDepth: number, files?: File[]) => Promise<boolean>;
  onLikeComment?: (commentId: string) => Promise<void>;
  onUnlikeComment?: (commentId: string) => Promise<void>;
  post_type: PostType;
  event_start_time?: string | null; 
  event_end_time?: string | null;
  event_location_text?: string | null; 
  event_description?: string | null;
  images?: string[] | null;
  video_url?: string | null;
  openCommentsByDefault?: boolean;
  onOpenCommentsModal?: () => void;
  onCloseModal?: () => void;
  canPin?: boolean;
  documents?: string[];
  onRsvpAction?: (postId: string, rsvpStatus: 'yes' | 'no' | 'maybe') => Promise<boolean>;
  communityId: string;
  authorEmail?: string | null;
  authorBio?: string | null;
  authorProfileCreatedAt?: string | null;
}

// NEW: Interface for RSVP data
interface RsvpData {
  user_id: string;
  status: 'yes' | 'no' | 'maybe';
  profile: {
    username: string | null;
    avatar_url: string | null;
  } | null; 
}

// For comment hierarchy
type CommentItemPropsWithReplies = CommentItemProps & {
  replies: CommentItemPropsWithReplies[];
};

// Utility to build comment hierarchy
const buildCommentHierarchy = (comments: CommentItemProps[], rootPostId: string): CommentItemPropsWithReplies[] => {
  const commentsById: { [key: string]: CommentItemPropsWithReplies } = {};
  const nestedComments: CommentItemPropsWithReplies[] = [];
  
  // First pass: create a map of all comments by ID with empty replies array
  comments.forEach(comment => { 
    commentsById[comment.id] = { ...comment, replies: [] }; 
  });
  
  // Second pass: organize comments into parent-child relationships
  comments.forEach(comment => {
    const currentCommentWithReplies = commentsById[comment.id];
    
    // If this is a reply (has parent_id and parent exists in our map)
    if (comment.parent_id && comment.parent_id !== rootPostId && commentsById[comment.parent_id]) {
      // Add as a reply to its parent
      commentsById[comment.parent_id].replies.push(currentCommentWithReplies);
    } 
    // If this is a top-level comment or direct reply to post
    else if (comment.parent_id === rootPostId || comment.depth === 1 || !comment.parent_id) {
      nestedComments.push(currentCommentWithReplies);
    }
    // If parent doesn't exist but this is a reply, add to top level as fallback
    else if (comment.parent_id && !commentsById[comment.parent_id]) {
      console.log(`Parent comment ${comment.parent_id} not found for comment ${comment.id}, adding to top level`);
      nestedComments.push(currentCommentWithReplies);
    }
  });
  
  // Sort all comments and replies by timestamp
  const sortByTimestamp = (a: CommentItemPropsWithReplies, b: CommentItemPropsWithReplies) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  
  // Sort replies for each comment
  Object.values(commentsById).forEach(comment => { 
    comment.replies.sort(sortByTimestamp); 
  });
  
  // Sort top-level comments
  nestedComments.sort(sortByTimestamp);
  
  return nestedComments;
};

// NEW: Utility to map CommentItemPropsWithReplies to CommentData for CommentsList
const mapToCommentDataStructure = (commentsToMap: CommentItemPropsWithReplies[]): CommentData[] => {
  return commentsToMap.map((comment) => ({
    id: comment.id,
    authorName: comment.authorName,
    authorAvatarUrl: comment.authorAvatarUrl || '',
    content: comment.textContent, // Map textContent to content
    timestamp: comment.timestamp,
    likeCount: comment.likeCount,
    isLikedByCurrentUser: comment.isLikedByCurrentUser,
    replies: comment.replies ? mapToCommentDataStructure(comment.replies) : [],
    commentAuthorId: comment.commentAuthorId, 
    updated_at: comment.updated_at,
    depth: comment.depth,
    parent_id: comment.parent_id,
  }));
};

// For Poll data structure within FeedPostItem state
interface PollOptionWithVotes { id: string; text: string; votes: number; isVotedByUser?: boolean; }
interface PollFullDetails {
  question: string;
  options: PollOptionWithVotes[];
  totalVotesDistinctUsers?: number;
}

// NEW: Interface for author tooltip data to ensure structure
interface AuthorTooltipInfo {
  id: string;
  username: string;
  avatar_url: string;
  email?: string | null;
  bio?: string | null;
  created_at?: string; // Join date
  role?: string | null;
  is_location_verified?: boolean;
  is_online?: boolean; // Added for online status
}

// Helper component for type-specific rendering
const PostTypeSpecificElements: React.FC<{
  post_type: PostType;
  title?: string | null;
  event_start_time?: string | null;
  event_end_time?: string | null;
  event_location_text?: string | null;
  event_description?: string | null;
  poll_id?: string | null;
  postIdForPollCard: string;
  pollDetails: PollFullDetails | null;
  isLoadingPoll: boolean;
  pollError: string | null;
  onVote: (pollOptionId: string) => Promise<void>;
  userVote: string | null;
  currentUserId?: string | null;
  communityId: string;
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
  communityId,
}) => {
  let indicatorStyle: React.CSSProperties = {};
  let icon: React.ReactNode | null = null;
  let headerContent = title ? <h3 className={`text-lg font-semibold mb-1 ${post_type === 'announce' ? 'text-yellow-700' : 'text-gray-800'}`}>{title}</h3> : null;

  // Create supabase client instance here if PostTypeSpecificElements needs it directly
  // OR pass supabase client as a prop if it's created in FeedPostItem main body

  switch (post_type) {
    case 'ask':
      indicatorStyle = { borderLeft: '4px solid #3b82f6', paddingLeft: '12px' };
      icon = <HelpCircle className="w-5 h-5 text-blue-500 mr-2" />;
      headerContent = (
        <div className="flex items-center mb-1">
          {icon}
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
        </div>
      );
      break;
    case 'announce':
      indicatorStyle = { borderLeft: '4px solid #f59e0b', paddingLeft: '12px', background: 'rgba(245, 158, 11, 0.05)' };
      icon = <Megaphone className="w-5 h-5 text-yellow-600 mr-2" />;
       headerContent = (
        <div className="flex items-center mb-1">
          {icon}
          {title && <h3 className="text-xl font-bold text-yellow-700">{title}</h3>}
        </div>
      );
      break;
    case 'event':
      indicatorStyle = { borderLeft: '4px solid #8b5cf6', paddingLeft: '12px' };
      icon = <CalendarDays className="w-5 h-5 text-purple-500 mr-2" />;
      headerContent = (
         <div className="flex items-center mb-1">
          {icon}
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
        </div>
      );
      break;
    case 'poll':
      indicatorStyle = { borderLeft: '4px solid #10b981', paddingLeft: '12px' };
      icon = <BarChart3 className="w-5 h-5 text-green-500 mr-2" />;
      headerContent = (
        <div className="flex items-center mb-1">
          {icon}
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
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
        <div className="text-sm text-purple-600 mb-2 bg-purple-50 rounded p-2">
          {event_start_time && (
            <p>
              <strong>Event Date:</strong>{' '}
              {new Date(event_start_time).toLocaleDateString()} {new Date(event_start_time).toLocaleTimeString()}
            </p>
          )}
          {event_end_time && (
            <p>
              <strong>Ends:</strong>{' '}
              {new Date(event_end_time).toLocaleDateString()} {new Date(event_end_time).toLocaleTimeString()}
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
      {post_type === 'poll' && poll_id && (
        isLoadingPoll ? (
          <div className="flex justify-center items-center py-4"><Loader2 className="animate-spin text-blue-500" size={24} /><span className="ml-2 text-gray-600">Loading poll...</span></div>
        ) : pollError ? (
          <p className="text-xs text-red-500 mb-2">Error loading poll: {pollError}</p>
        ) : pollDetails && (
          <PollCard
            key={`poll-${postIdForPollCard}`}
            postId={postIdForPollCard}
            pollId={poll_id || ''}
            communityId={communityId}
            question={pollDetails.question}
            options={pollDetails.options}
            userVote={userVote}
            onVote={onVote}
            totalVotesOverall={pollDetails.totalVotesDistinctUsers}
          />
        )
      )}
    </div>
  );
};

const defaultAvatar = 'https://ui-avatars.com/api/?name=?&background=random';

// Helper function to count total comments including replies
const countTotalComments = (commentsToCount: CommentItemProps[]): number => {
  let count = 0;
  for (const comment of commentsToCount) {
    count++; // Count the comment itself
    if (comment.replies && comment.replies.length > 0) {
      // Recursively call with comment.replies, which is CommentItemProps[]
      count += countTotalComments(comment.replies);
    }
  }
  return count;
};

function filterProfanity(text: string): string {
  // Basic profanity filter example (replace with a more robust solution if needed)
  const badWords = ['examplebadword', 'anotherone']; // Add more words
  let filteredText = text;
  badWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  });
  return filteredText;
}

export default function FeedPostItem({ 
  id, postAuthorUserId, currentUserId, currentUserRole, authorName, authorFullName, authorRole, authorIsLocationVerified, authorAvatarUrl, authorIsOnline, timestamp, title, textContent: initialTextContent,
  updated_at, imageUrl, poll_id, is_pinned = false, likeCount, commentCount: initialCommentCount, isLikedByCurrentUser,
  onToggleLike, fetchComments, onCommentSubmit, onDeletePost, onUpdatePost, onTogglePin,
  onActualDeleteComment, onActualUpdateComment, onReplySubmit, onLikeComment, onUnlikeComment, post_type,
  event_start_time, event_end_time, event_location_text, event_description,
  images, video_url, openCommentsByDefault, onOpenCommentsModal, onCloseModal, canPin,
  documents, onRsvpAction, communityId,
  authorEmail, authorBio, authorProfileCreatedAt,
}: FeedPostItemProps) {
  // State for reactions refresh
  const [refreshReactions, setRefreshReactions] = useState(0);
  
  // Handler for when a reaction is added
  const handleReactionAdded = () => {
    // Trigger refresh of reactions display
    setRefreshReactions(prev => prev + 1);
  };
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [textContent, setTextContent] = useState(initialTextContent);
  const [editMode, setEditMode] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [optimisticIsLiked, setOptimisticIsLiked] = useState(isLikedByCurrentUser);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(likeCount);
  const [isLiking, setIsLiking] = useState(false); // For like button loading

  const [showComments, setShowComments] = useState(openCommentsByDefault || false);
  const [comments, setComments] = useState<CommentItemPropsWithReplies[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [optimisticCommentCount, setOptimisticCommentCount] = useState(initialCommentCount);
  const [showCommentInput, setShowCommentInput] = useState(true);

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const moreOptionsRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);

  const [showAuthorTooltip, setShowAuthorTooltip] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const MAX_CHARS = 300; // Max characters before truncating
  const shouldTruncate = textContent.length > MAX_CHARS;
  const truncatedText = shouldTruncate ? textContent.substring(0, MAX_CHARS) + '...' : textContent;

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reactionError, setReactionError] = useState<string | null>(null); // General purpose error for reactions/reporting

  const [showCopied, setShowCopied] = useState(false);

  const [pollDetails, setPollDetails] = useState<PollFullDetails | null>(null);
  const [isLoadingPoll, setIsLoadingPoll] = useState(false);
  const [userPollVote, setUserPollVote] = useState<string | null>(null);
  const [pollFetchError, setPollFetchError] = useState<string | null>(null);

  const [rsvps, setRsvps] = useState<RsvpData[]>([]);
  const [isLoadingRsvps, setIsLoadingRsvps] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [currentUserRsvpStatus, setCurrentUserRsvpStatus] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const [showShareOptions, setShowShareOptions] = useState(false);
  const shareOptionsRef = useRef<HTMLDivElement>(null);

  const handleAuthorMouseEnter = () => {
    setShowAuthorTooltip(true);
  };

  const handleAuthorMouseLeave = () => {
    setShowAuthorTooltip(false);
  };

  const handleTooltipMouseEnter = () => {
    setShowAuthorTooltip(true); // Keep tooltip shown when mouse is over it
  };

  const handleTooltipMouseLeave = () => {
    setShowAuthorTooltip(false); // Hide when mouse leaves tooltip
  };

  useEffect(() => {
    setTextContent(initialTextContent);
  }, [initialTextContent]);

  useEffect(() => {
    setOptimisticIsLiked(isLikedByCurrentUser);
  }, [isLikedByCurrentUser]);

  useEffect(() => {
    setOptimisticLikeCount(likeCount);
  }, [likeCount]);

  useEffect(() => {
    setOptimisticCommentCount(initialCommentCount);
  }, [initialCommentCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target as Node)) {
        setShowMoreOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadComments = useCallback(async () => {
    if (!id || !fetchComments) return;
    setIsLoadingComments(true);
    setCommentError(null);
    try {
      const fetchedComments = await fetchComments(id);
      console.log("Fetched comments:", fetchedComments);
      
      // Build the comment hierarchy
      const hierarchicalComments = buildCommentHierarchy(fetchedComments, id);
      console.log("Hierarchical comments:", hierarchicalComments);
      
      setComments(hierarchicalComments);
      
      // Update optimisticCommentCount with the total number of comments and replies
      setOptimisticCommentCount(countTotalComments(fetchedComments));
    } catch (err) {
      console.error("Error loading comments:", err);
      setCommentError('Failed to load comments.');
    } finally {
      setIsLoadingComments(false);
    }
  }, [id, fetchComments]);

  useEffect(() => {
    if (showComments && comments.length === 0 && initialCommentCount > 0) {
      loadComments();
    }
  }, [showComments, comments.length, initialCommentCount, loadComments]);
  
  const debouncedSetTextContent = useCallback(
    debounce((value: string) => setTextContent(value), 300),
    []
  );

  function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
      new Promise(resolve => {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => resolve(func(...args)), waitFor);
      });
  }

  // Fetch Poll Data
  useEffect(() => {
    const fetchPoll = async () => {
      if (!poll_id || !supabase) return;
    setIsLoadingPoll(true);
    setPollFetchError(null);
    try {
        const { data: pollQuestionData, error: pollError } = await supabase
        .from('polls')
          .select('question, poll_options ( id, option_text, poll_votes (user_id) )')
          .eq('id', poll_id)
          .single();

        if (pollError) throw pollError;

        if (pollQuestionData) {
          let userVoteOptionId: string | null = null;
          const optionsWithVotes: PollOptionWithVotes[] = pollQuestionData.poll_options.map(opt => {
            const isVoted = currentUserId ? opt.poll_votes.some(vote => vote.user_id === currentUserId) : false;
            if (isVoted) userVoteOptionId = opt.id;
            return {
              id: opt.id,
              text: opt.option_text,
              votes: opt.poll_votes.length,
              isVotedByUser: isVoted,
            };
          });
          
          const totalDistinctVotes = new Set(pollQuestionData.poll_options.flatMap(opt => opt.poll_votes.map(v => v.user_id))).size;

        setPollDetails({ 
            question: pollQuestionData.question,
          options: optionsWithVotes, 
            totalVotesDistinctUsers: totalDistinctVotes
        });
          if (userVoteOptionId) setUserPollVote(userVoteOptionId);

      } else {
          setPollFetchError('Poll not found.');
        }
      } catch (err: any) {
        console.error("Error fetching poll data:", err);
        if (err.message === "JSON object requested, multiple (or no) rows returned") {
          console.log(`[FeedPostItem] Poll data retrieval failed for poll_id: ${poll_id}. This ID may be incorrect, the poll deleted, or inaccessible due to RLS.`);
          setPollFetchError('Poll data not found or is invalid for this post. The poll might have been deleted or the ID is incorrect.');
        } else {
          setPollFetchError(err.message || 'Failed to load poll data.');
        }
        // Fallback fetch logic (can be reviewed if it's problematic for this error)
        const { data: pollQuestionDataFallback } = await supabase.from('polls').select('question, poll_options ( id, option_text, poll_votes (user_id) )').eq('id', poll_id).single();
        if (pollQuestionDataFallback) {
            let userVoteOptionId: string | null = null;
            const optionsWithVotes: PollOptionWithVotes[] = pollQuestionDataFallback.poll_options.map(opt => {
                const isVoted = currentUserId ? opt.poll_votes.some(vote => vote.user_id === currentUserId) : false;
                if (isVoted) userVoteOptionId = opt.id;
                return { id: opt.id, text: opt.option_text, votes: opt.poll_votes.length, isVotedByUser: isVoted, };
            });
            const totalDistinctVotes = new Set(pollQuestionDataFallback.poll_options.flatMap(opt => opt.poll_votes.map(v => v.user_id))).size;
            setPollDetails({ question: pollQuestionDataFallback.question, options: optionsWithVotes, totalVotesDistinctUsers: totalDistinctVotes });
            if (userVoteOptionId) setUserPollVote(userVoteOptionId); else setUserPollVote(null);
        } // No explicit setReactionError here as it's about fetching initial poll data.
    } finally {
      setIsLoadingPoll(false);
    }
    };

    if (post_type === 'poll' && poll_id) {
      fetchPoll();
    }
  }, [poll_id, post_type, supabase, currentUserId]);

  const handleVoteOnPoll = async (optionId: string) => {
    if (!currentUserId || !poll_id || userPollVote) return; // Prevent voting if not logged in, no poll, or already voted
    try {
      // Optimistically update UI
      const previousVote = userPollVote;
      setUserPollVote(optionId);
      setPollDetails(prev => {
        if (!prev) return null;
        let newTotalVotes = prev.totalVotesDistinctUsers || 0;
        const newOptions = prev.options.map(opt => {
          let newVoteCount = opt.votes;
          // If this is the new vote
          if (opt.id === optionId) {
            if (!opt.isVotedByUser) newVoteCount++; // Increment if not previously voted by user
            if (!previousVote) newTotalVotes++; // Increment total if user hadn't voted before at all
            return { ...opt, votes: newVoteCount, isVotedByUser: true };
          }
          // If this was a previous vote by the user, and it's not the current one
          if (opt.id === previousVote && opt.id !== optionId) {
            // newVoteCount--; // Don't decrement here, backend handles single vote
            return { ...opt, isVotedByUser: false }; // Just unmark as voted
          }
          return opt;
        });
        return { ...prev, options: newOptions, totalVotesDistinctUsers: newTotalVotes };
      });

      const { error } = await supabase.rpc('vote_on_poll', {
        _poll_id: poll_id,
        _poll_option_id: optionId,
        _user_id: currentUserId
      });

      if (error) {
        throw new Error(error.message);
      }

      // Send notification to poll creator if it's not the current user
      if (postAuthorUserId !== currentUserId) {
        try {
          // Get current user's profile to get username
          const { data: userData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', currentUserId)
            .single();

          const username = userData?.username || 'Someone';

          await createPollVoteNotification(
            postAuthorUserId,
            currentUserId,
            poll_id,
            id, // post ID
            communityId || '',
            username
          );
        } catch (notifError) {
          console.error('Error sending poll vote notification:', notifError);
          // Don't throw here, we still want the vote to count even if notification fails
        }
      }

      // Refetch poll details to get accurate data
      fetchPollDetails();
    } catch (err) {
      console.error('Error voting on poll:', err);
      // Revert optimistic updates
      setUserPollVote(userPollVote);
      // Reset poll details to previous state by refetching
      fetchPollDetails();
    }
  };

  // Add fetchPollDetails function to refetch poll data
  const fetchPollDetails = async () => {
    if (!poll_id || !currentUserId) return;
    
    try {
      const { data: pollData } = await supabase
        .from('polls')
        .select('question, poll_options ( id, option_text, poll_votes (user_id) )')
        .eq('id', poll_id)
        .single();
        
      if (pollData) {
            let userVoteOptionId: string | null = null;
        const optionsWithVotes: PollOptionWithVotes[] = pollData.poll_options.map(opt => {
                const isVoted = currentUserId ? opt.poll_votes.some(vote => vote.user_id === currentUserId) : false;
                if (isVoted) userVoteOptionId = opt.id;
          return { 
            id: opt.id, 
            text: opt.option_text, 
            votes: opt.poll_votes.length, 
            isVotedByUser: isVoted 
          };
            });
        
        const totalDistinctVotes = new Set(pollData.poll_options.flatMap(opt => 
          opt.poll_votes.map(v => v.user_id)
        )).size;
        
        setPollDetails({ 
          question: pollData.question, 
          options: optionsWithVotes, 
          totalVotesDistinctUsers: totalDistinctVotes 
        });
        
        setUserPollVote(userVoteOptionId);
      }
    } catch (err) {
      console.error('Error fetching poll details:', err);
    }
  };

  useEffect(() => { 
    const fetchRsvps = async () => {
      if (post_type !== 'event' || !id || !supabase || !communityId) return;
      setIsLoadingRsvps(true);
      setRsvpError(null);
      try {
        const { data, error } = await supabase
          .from('event_rsvps')
          .select('user_id, status, profile:profiles(username, avatar_url)')
          .eq('event_post_id', id)
          .eq('community_id', communityId);
        if (error) throw error;
        const transformedData = data.map(rsvp => ({
          ...rsvp,
          profile: rsvp.profile && Array.isArray(rsvp.profile) && rsvp.profile.length > 0 ? rsvp.profile[0] : null
        }));
        setRsvps(transformedData as RsvpData[]);
        const currentUserRsvp = transformedData.find(rsvp => rsvp.user_id === currentUserId);
        setCurrentUserRsvpStatus(currentUserRsvp ? currentUserRsvp.status : null);
      } catch (err: any) {
        console.error('Error fetching RSVPs:', err);
        setRsvpError(err.message || 'Failed to load RSVP information.');
      } finally {
        setIsLoadingRsvps(false);
      }
    };
    fetchRsvps();
  }, [id, post_type, supabase, currentUserId, communityId]);

  const handleOptimisticLike = async () => {
    if (!currentUserId || !onToggleLike) return;
    setIsLiking(true);
    const previousIsLiked = optimisticIsLiked;
    const previousLikeCount = optimisticLikeCount;

    setOptimisticIsLiked(!previousIsLiked);
    setOptimisticLikeCount(previousIsLiked ? previousLikeCount - 1 : previousLikeCount + 1);

    try {
      await onToggleLike(id);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setOptimisticIsLiked(previousIsLiked);
      setOptimisticLikeCount(previousLikeCount);
      setReactionError("Couldn't update like. Please try again.");
      setTimeout(() => setReactionError(null), 3000);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmitInternal = async (data: { commentText: string; files?: File[]; sticker?: StickerType }) => {
    const { commentText, files, sticker } = data;
    if (!commentText.trim() && (!files || files.length === 0) && !sticker) return false;
    if (!currentUserId || !onCommentSubmit) return false;

    setIsSubmittingComment(true);
    try {
      const success = await onCommentSubmit(id, commentText, files);
      if (success) {
        setNewCommentText('');
        setOptimisticCommentCount(prev => prev + 1); // Optimistic update
        setShowCommentInput(true); // Keep input open or re-open if it was closed
        // Comments will be reloaded by the parent page or via loadComments() if triggered
        // Potentially trigger a direct reload here too if needed:
        loadComments(); 
        return true;
      } else {
        setReactionError("Failed to submit comment. Please try again.");
        setTimeout(() => setReactionError(null), 3000);
        return false;
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      setReactionError("An error occurred while submitting your comment.");
      setTimeout(() => setReactionError(null), 3000);
      return false;
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Extract sticker data if present
    const customEvent = event as any;
    const sticker = customEvent.sticker;
    
    await handleCommentSubmitInternal({ 
      commentText: newCommentText,
      sticker: sticker
    });
  };

  const handleTogglePinInternal = async () => {
    if (!onTogglePin) return;
    setIsPinning(true); // For visual feedback if any
    try {
      const success = await onTogglePin(id, is_pinned);
      if (success) {
        // is_pinned prop will be updated by parent, this component will re-render
        setShowMoreOptions(false);
    } else {
         setReactionError("Failed to update pin status.");
         setTimeout(() => setReactionError(null), 3000);
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
      setReactionError("An error occurred while updating pin status.");
      setTimeout(() => setReactionError(null), 3000);
    } finally {
      setIsPinning(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !currentUserId) {
      setReactionError("Please provide a reason for reporting.");
      return;
    }
    setReactionError(null);
    try {
      const { error } = await supabase.from('post_reports').insert({
        reported_content_id: id,
        content_type: 'post',
        reason: reportReason,
        reporter_user_id: currentUserId,
        // community_id: communityId, // TODO: Uncomment this line after adding 'community_id' column to 'post_reports' table
      });
      if (error) throw error;
      setShowReportModal(false);
      setReportReason('');
      // Show some success feedback, e.g. using a toast notification library
      alert('Post reported successfully. Our team will review it.'); 
    } catch (error) {
      console.error("Error reporting post:", error);
      setReactionError("Failed to submit report. Please try again.");
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/community/${communityId}/feed?postId=${id}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => {
    setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy link:', err));
  };

  const renderAuthorInfo = () => {
    // Determine online status for direct display
    let displayOnline: boolean | undefined = authorIsOnline; // Prioritize prop from parent

    const profileDataForTooltip: UserTooltipProfileData = {
      id: postAuthorUserId,
      username: authorName,
      avatar_url: authorAvatarUrl,
      email: authorEmail,
      bio: authorBio,
      created_at: authorProfileCreatedAt,
      role: authorRole,
      is_location_verified: authorIsLocationVerified,
    };

    if (displayOnline === undefined && postAuthorUserId === currentUserId) {
      // If prop is undefined and it's the current user's post, mark as online for direct display
      displayOnline = true;
    }

    return (
    <div className="flex items-center relative"> {/* Removed 'group' class as UserTooltipWrapper handles hover individually */}
      <UserTooltipWrapper profileData={profileDataForTooltip}>
        <Link href={`/profile/${postAuthorUserId}`} legacyBehavior>
          <a 
            className="flex-shrink-0"
            // onMouseEnter={handleAuthorMouseEnter} -- Removed
            // onMouseLeave={handleAuthorMouseLeave} -- Removed
          >
            <Image
              src={authorAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`}
              alt={authorName}
              width={40}
              height={40}
              className="rounded-full mr-3"
            />
          </a>
        </Link>
      </UserTooltipWrapper>
      <div className="text-sm">
        <div className="flex items-center">
          <UserTooltipWrapper profileData={profileDataForTooltip}>
            <span
              className="font-semibold text-black cursor-pointer hover:underline"
              // onMouseEnter={handleAuthorMouseEnter} -- Removed
              // onMouseLeave={handleAuthorMouseLeave} -- Removed
            >
              {authorFullName || authorName}
            </span>
          </UserTooltipWrapper>

          {/* Online Status Indicator for the main post display */}
          {displayOnline !== undefined ? (
            displayOnline ? (
              <span title="Online"><Sailboat size={14} className="ml-1.5 text-green-500" /></span>
            ) : (
              <span title="Offline"><Sailboat size={14} className="ml-1.5 text-slate-400" /></span>
            )
          ) : authorIsOnline !== undefined ? ( // Use direct prop for fallback if available
            authorIsOnline ? (
              <span title="Online"><Sailboat size={14} className="ml-1.5 text-green-500" /></span>
            ) : (
              <span title="Offline"><Sailboat size={14} className="ml-1.5 text-slate-400" /></span>
            )
          ) : (
             // Default if no prop and no tooltip data yet
             <span title="Offline (status pending)"><Sailboat size={14} className="ml-1.5 text-slate-400 opacity-50" /></span>
          )}

          {authorIsLocationVerified &&
            <span title="Location Verified"><ShieldCheck className="ml-1.5 h-4 w-4 text-blue-500" /></span>
          }
          {authorRole && authorRole !== 'member' && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full capitalize">
              {authorRole.replace(/_/g, ' ')}
            </span>
            )}
        </div>
        <Link href={`/community/${communityId}/feed#post-${id}`} legacyBehavior>
          <a className="text-xs text-gray-500 hover:underline">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            {updated_at && new Date(updated_at) > new Date(timestamp) && " (edited)"}
          </a>
        </Link>
      </div>

      {/* Tooltip Content - Render based on showAuthorTooltip - REMOVED */}
      {/* {showAuthorTooltip && ( ... old tooltip code ... )} */}
    </div>
  );
};

const handleRsvpButtonClick = async (status: 'yes' | 'no' | 'maybe') => {
  if (!currentUserId || !onRsvpAction || !id || !communityId) return;
  setIsSubmittingRsvp(true);
  const previousStatus = currentUserRsvpStatus;
  setCurrentUserRsvpStatus(status); // Optimistic update

  try {
    const success = await onRsvpAction(id, status);
    if (!success) {
      setCurrentUserRsvpStatus(previousStatus); // Revert on failure
      setRsvpError('Failed to update RSVP. Please try again.');
      setTimeout(() => setRsvpError(null), 3000);
    } else {
      // Re-fetch RSVPs to get accurate counts and other users' data
      const { data, error } = await supabase
      .from('event_rsvps')
        .select('user_id, status, profile:profiles(username, avatar_url)')
        .eq('event_post_id', id)
        .eq('community_id', communityId);
      if (error) throw error;
      const transformedDataAfterRsvp = data.map(rsvp => ({
        ...rsvp,
        profile: rsvp.profile && Array.isArray(rsvp.profile) && rsvp.profile.length > 0 ? rsvp.profile[0] : null
      }));
      setRsvps(transformedDataAfterRsvp as RsvpData[]);
      // Trigger RSVP notification if not self
      if (postAuthorUserId !== currentUserId) {
        await createRsvpNotification(
          postAuthorUserId,
          currentUserId,
          id,
          communityId,
          authorName,
          status
        );
      }
    }
  } catch (err: any) {
    console.error('Error submitting RSVP:', err);
    setCurrentUserRsvpStatus(previousStatus); // Revert on error
    setRsvpError(err.message || 'An error occurred while updating your RSVP.');
    setTimeout(() => setRsvpError(null), 3000);
  } finally {
    setIsSubmittingRsvp(false);
  }
};

const rsvpCounts = useMemo(() => {
  const counts = { yes: 0, no: 0, maybe: 0 };
  rsvps.forEach(rsvp => {
    if (rsvp.status) counts[rsvp.status]++;
  });
  return counts;
}, [rsvps]);

const totalRsvps = rsvps.length;

const handleReplySubmitWrapper = async (parentCommentId: string, replyText: string, parentDepth: number, files?: File[]) => {
  if (onReplySubmit) {
    setIsSubmittingComment(true); // Consider a specific state for reply submitting if needed
    try {
      const success = await onReplySubmit(parentCommentId, replyText, parentDepth, files);
    if (success) {
        // Reload all comments to show the new reply
        await loadComments();
    } else {
         setReactionError('Failed to submit reply.');
         setTimeout(() => setReactionError(null), 3000);
    }
      return success;
  } catch (error) {
      console.error("Error submitting reply:", error);
      setReactionError('An error occurred while submitting your reply.');
      setTimeout(() => setReactionError(null), 3000);
      return false;
  } finally {
      setIsSubmittingComment(false);
    }
  }
  return false;
};

const handleAddToCalendar = () => {
  if (!event_start_time || !title) return;
  // Basic iCalendar link generation
  const formatICalDate = (dateStr: string) => new Date(dateStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//YourApp//EN',
    'BEGIN:VEVENT',
    `UID:${id}@yourapp.com`,
    `DTSTAMP:${formatICalDate(new Date().toISOString())}`,
    `DTSTART:${formatICalDate(event_start_time)}`,
    event_end_time ? `DTEND:${formatICalDate(event_end_time)}` : '',
    `SUMMARY:${title}`,
    event_description ? `DESCRIPTION:${event_description.replace(/\n/g, '\\\\n')}` : '',
    event_location_text ? `LOCATION:${event_location_text}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const renderGallery = () => {
  if (!images || images.length === 0) return null;

  const openImageModal = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };
  
  const closeImageModal = () => {
    setGalleryOpen(false);
  };

  const nextImage = () => {
    setGalleryIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setGalleryIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

    return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 my-2">
        {images.slice(0, 6).map((src, i) => (
          <div key={i} className="aspect-square relative cursor-pointer group bg-slate-100" onClick={() => openImageModal(i)}>
            <Image src={src} alt={title || `Image ${i + 1}`} layout="fill" objectFit="cover" className="rounded"/>
            {i === 5 && images.length > 6 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-bold">
                +{images.length - 6}
              </div>
            )}
          </div>
        ))}
      </div>

      {galleryOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" 
          onClick={closeImageModal}
        >
          <div 
            className="relative bg-white p-2 sm:p-4 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeImageModal} 
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-50 text-gray-400 hover:text-gray-600"
              aria-label="Close gallery"
            >
              <XSquare size={20} />
            </button>
            <div className="flex-grow flex items-center justify-center overflow-hidden">
               <img src={images[galleryIndex]} alt={title || `Image ${galleryIndex + 1}`} className="max-h-[calc(90vh-100px)] max-w-full object-contain rounded-md" />
          </div>
            {images.length > 1 && (
              <div className="flex items-center justify-between mt-2 sm:mt-3">
                <button 
                  onClick={prevImage} 
                  className="text-white bg-black/30 hover:bg-black/60 rounded-full p-2 sm:p-3 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <p className="text-xs sm:text-sm text-white mx-2">{galleryIndex + 1} / {images.length}</p>
                <button 
                  onClick={nextImage} 
                  className="text-white bg-black/30 hover:bg-black/60 rounded-full p-2 sm:p-3 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

return (
  <div className={`max-w-3xl w-full mx-auto bg-white shadow-md rounded-lg p-4 mb-6${is_pinned ? ' border-2 border-teal-400' : ''}`}>
    <div className="flex items-start justify-between mb-3">
      {renderAuthorInfo()}
      {(currentUserId && (currentUserId === postAuthorUserId || currentUserRole === 'community admin') && (onDeletePost || onUpdatePost || onTogglePin)) && (
        <div className="relative" ref={moreOptionsRef}>
          <button onClick={(e) => { e.preventDefault(); setShowMoreOptions(!showMoreOptions); }} className="text-gray-500 hover:text-gray-700 p-1 rounded-full">
            <MoreHorizontal size={20} />
          </button>
          {showMoreOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
              {onUpdatePost && currentUserId === postAuthorUserId &&(
                <button onClick={(e) => { e.preventDefault(); setEditMode(true); setShowMoreOptions(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                  <Edit3 size={16} className="mr-2" /> Edit Post
                </button>
              )}
              {onDeletePost && (currentUserId === postAuthorUserId || currentUserRole === 'community admin') && (
                <button onClick={(e) => { e.preventDefault(); setIsDeleting(true); setShowMoreOptions(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                  <Trash2 size={16} className="mr-2" /> Delete Post
                </button>
              )}
              {onTogglePin && canPin && (currentUserRole === 'community admin' ) && (
                <button onClick={(e) => { e.preventDefault(); handleTogglePinInternal(); setShowMoreOptions(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" disabled={isPinning}>
                  {isPinning ? <Loader2 size={16} className="mr-2 animate-spin"/> : (is_pinned ? <PinOff size={16} className="mr-2 text-yellow-600" /> : <Pin size={16} className="mr-2 text-yellow-500" />)}
                  {is_pinned ? 'Unpin Post' : 'Pin Post'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>

    <PostTypeSpecificElements 
      post_type={post_type}
      title={title}
      event_start_time={event_start_time}
      event_end_time={event_end_time}
      event_location_text={event_location_text} event_description={event_description}
      poll_id={poll_id} postIdForPollCard={id} pollDetails={pollDetails} isLoadingPoll={isLoadingPoll}
      pollError={pollFetchError} onVote={handleVoteOnPoll} userVote={userPollVote} currentUserId={currentUserId}
      communityId={communityId}
    />

    {!editMode && textContent && post_type !== 'poll' && post_type !== 'event' && (
      <div className="prose prose-sm sm:prose max-w-none break-words whitespace-pre-wrap mt-2 text-black">
        <FormattedPostContent content={filterProfanity(expanded || !shouldTruncate ? textContent : truncatedText)} />
        {shouldTruncate && !expanded && (
          <button className="ml-1 text-cyan-700 font-semibold hover:underline text-xs" onClick={(e) => { e.preventDefault(); setExpanded(true); }}>Read More</button>
        )}
        {shouldTruncate && expanded && (
          <button className="ml-1 text-cyan-700 font-semibold hover:underline text-xs" onClick={(e) => { e.preventDefault(); setExpanded(false); }}>Read Less</button>
        )}
      </div>
    )}
    {!editMode && documents && documents.length > 0 && (
      <div className="mt-2">
        <p className="text-xs text-slate-500 mb-1">Attached document(s):</p>
        <ul className="space-y-1">
          {documents.map((url, idx) => (
            <li key={idx}>
              <a href={url} target="_blank" rel="noopener noreferrer" download className="text-cyan-700 underline hover:text-cyan-600 text-sm break-all flex items-center gap-1.5">
                <svg className="w-4 h-4 text-cyan-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                {decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'Document')}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )}

    {editMode && (
      <div className="mb-3">
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)} // Using direct setTextContent for responsiveness in textarea
          className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500 bg-white text-black"
          rows={Math.max(3, textContent.split('\n').length)}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        <div className="flex justify-end space-x-2 mt-2">
          <button onClick={(e) => { e.preventDefault(); setEditMode(false); setTextContent(initialTextContent); /* Reset text on cancel */ }} className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md" disabled={isSavingEdit}>
            Cancel
          </button>
          <button onClick={async (e) => { e.preventDefault(); setIsSavingEdit(true); setError(null); if (onUpdatePost) { const success = await onUpdatePost(id, textContent.trim()); if (success) setEditMode(false); else setError("Failed to save post.");} setIsSavingEdit(false); }} className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center disabled:opacity-70" disabled={isSavingEdit || !textContent.trim()}>
            {isSavingEdit ? <Loader2 size={16} className="animate-spin mr-1" /> : <CheckSquare size={16} className="mr-1" />} 
            Save
          </button>
        </div>
      </div>
    )}

    {!editMode && video_url && (
      <div className="my-3 rounded-lg overflow-hidden flex justify-center bg-gray-100">
        <video src={video_url} controls className="rounded-md max-h-[400px] w-full" />
      </div>
    )}

    {!editMode && !video_url && images && images.length > 0 && renderGallery()}
    {!editMode && !video_url && (!images || images.length === 0) && imageUrl && (
      <div className="my-3 rounded-lg overflow-hidden flex justify-center bg-gray-100">
        <img src={imageUrl} alt={title || "Post image"} className="rounded-md w-full max-h-[400px] object-contain" />
      </div>
    )}

    {post_type === 'event' && (
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">RSVP to this Event:</h4>
        {isLoadingRsvps && <div className="text-sm text-gray-500"><Loader2 className="inline animate-spin mr-2" size={16}/>Loading RSVP info...</div>}
        {rsvpError && <p className="text-xs text-red-500 mb-2">{rsvpError}</p>}
        {!isLoadingRsvps && !rsvpError && (
          <div className="flex space-x-2 mb-3">
            {(['yes', 'maybe', 'no'] as const).map(status => (
            <button
                key={status}
                onClick={() => handleRsvpButtonClick(status)}
              disabled={isSubmittingRsvp || !currentUserId}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${currentUserRsvpStatus === status 
                    ? status === 'yes' ? 'bg-green-600 text-white ring-2 ring-green-400' 
                    : status === 'maybe' ? 'bg-yellow-500 text-white ring-2 ring-yellow-400' 
                    : 'bg-red-600 text-white ring-2 ring-red-400'
                    : status === 'yes' ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : status === 'maybe' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }
                `}
              >
                {isSubmittingRsvp && currentUserRsvpStatus !== status && (rsvps.find(r=>r.user_id === currentUserId && r.status === status)) === undefined ? <Loader2 className="inline animate-spin mr-1" size={12}/> : null}
                {status === 'yes' ? 'Going' : status === 'maybe' ? 'Maybe' : 'Not Going'}
            </button>
            ))}
          </div>
        )}
        {event_start_time && (
          <div className="mt-3 flex items-center justify-between">
            <button onClick={handleAddToCalendar} className="text-xs text-blue-600 hover:text-blue-500 flex items-center">
              <CalendarDays size={14} className="mr-1"/> Add to Calendar
            </button>
            {totalRsvps > 0 && <p className="text-xs text-slate-500">{rsvpCounts.yes} Going, {rsvpCounts.maybe} Maybe, {rsvpCounts.no} Not Going</p>}
          </div>
        )}
        {rsvpError && <p className="text-xs text-red-500 mt-1">{rsvpError}</p>}
      </div>
    )}

    {/* Add FeedPostReactionDisplay before the action buttons */}
    <FeedPostReactionDisplay 
      postId={id} 
      key={`reactions-${id}-${refreshReactions}`} 
    />
    
    <div className="flex items-center justify-between text-gray-500 border-t border-gray-200 pt-3 mt-4">
      <div className="flex items-center space-x-2">
        <button onClick={handleOptimisticLike} className={`flex items-center transition-colors px-2 py-1 rounded disabled:opacity-60 ${optimisticIsLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'}`} disabled={!currentUserId || isLiking}>
          {isLiking ? <Loader2 className="animate-spin w-4 h-4 mr-1" /> : <Heart className={`w-4 h-4 mr-1 ${optimisticIsLiked ? 'fill-current' : ''}`} />}
        </button>
        <button onClick={handleCommentSubmitInternal} className="flex items-center transition-colors px-2 py-1 rounded disabled:opacity-60 text-gray-500 hover:text-gray-700">
          <MessageCircle size={16} className="mr-1" />
        </button>
        <button onClick={handleReport} className="flex items-center transition-colors px-2 py-1 rounded disabled:opacity-60 text-gray-500 hover:text-gray-700">
          <AlertTriangle size={16} className="mr-1" />
        </button>
        <button onClick={handleShare} className="flex items-center transition-colors px-2 py-1 rounded disabled:opacity-60 text-gray-500 hover:text-gray-700">
          <Share2 size={16} className="mr-1" />
        </button>
      </div>
    </div>
  </div>
);
}
