import React, { useState, useRef, useEffect, useCallback } from "react";
import { MoreHorizontal, Edit3, Trash2, Send, Loader2, Heart, MessageSquare, Sailboat, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { renderFormattedText } from '@/utils/textProcessing';
import CommentForm from './CommentForm';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import UserTooltipWrapper from '@/components/user/UserTooltipWrapper';
import type { UserTooltipProfileData } from '@/components/user/UserTooltipDisplay';

export interface CommentData {
  id: string;
  authorName: string;
  authorAvatarUrl: string;
  content: string;
  timestamp: string; // This is created_at
  replies?: CommentData[];
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
  commentAuthorId: string;
  updated_at?: string | null;
  depth?: number;
  parent_id?: string | null;
}

interface CommentsListProps {
  comments: CommentData[];
  onLikeComment?: (commentId: string) => Promise<void>;
  onUnlikeComment?: (commentId: string) => Promise<void>;
  currentUserId?: string | null;
  parentDepth?: number;
  onActualUpdateComment?: (commentId: string, newContent: string) => Promise<boolean>;
  onActualDeleteComment?: (commentId: string) => Promise<boolean>;
  communityId: string;
}

interface InternalCommentItemProps {
  comment: CommentData;
  onLikeComment?: (commentId: string) => Promise<void>;
  onUnlikeComment?: (commentId: string) => Promise<void>;
  currentUserId?: string | null;
  onActualUpdateComment?: (commentId: string, newContent: string) => Promise<boolean>;
  onActualDeleteComment?: (commentId: string) => Promise<boolean>;
  communityId: string;
}

interface CommenterTooltipDetails {
  bio?: string | null;
  created_at?: string | null;
  email?: string | null;
  last_seen_at?: string | null;
  is_location_verified?: boolean | null;
  username?: string;
  avatar_url?: string;
  role?: string | null;
}

const CommentItem: React.FC<InternalCommentItemProps> = ({ 
  comment, 
  onLikeComment, 
  onUnlikeComment,
  currentUserId, 
  onActualUpdateComment,
  onActualDeleteComment,
  communityId,
}) => {
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [isLiked, setIsLiked] = useState(comment.isLikedByCurrentUser || false);

  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const moreOptionsRef = useRef<HTMLDivElement>(null);
  const [currentContent, setCurrentContent] = useState(comment.content);
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState(comment.updated_at);

  // State for commenter's extended profile details for tooltip
  const [commenterTooltipDetails, setCommenterTooltipDetails] = useState<CommenterTooltipDetails | null>(null);
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setCurrentContent(comment.content);
    setCurrentUpdatedAt(comment.updated_at);
  }, [comment.content, comment.updated_at]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target as Node)) {
        setShowMoreOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch commenter's extended details for tooltip
  useEffect(() => {
    const fetchCommenterTooltipData = async () => {
      if (!comment.commentAuthorId || !supabase) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, bio, created_at, email, role, last_seen_at, is_location_verified')
          .eq('id', comment.commentAuthorId)
          .single();
        if (error) {
          console.error(`[CommentItem] Error fetching commenter tooltip data for ${comment.commentAuthorId}:`, error);
          setCommenterTooltipDetails(null);
        } else {
          if (data) {
            setCommenterTooltipDetails(data as CommenterTooltipDetails);
          } else {
            setCommenterTooltipDetails(null);
          }
        }
      } catch (e) {
        console.error(`[CommentItem] Exception fetching commenter tooltip data for ${comment.commentAuthorId}:`, e);
        setCommenterTooltipDetails(null);
      }
    };
    fetchCommenterTooltipData();
  }, [comment.commentAuthorId, comment.authorName, supabase]);

  const calculateIsOnline = (lastSeenAt?: string | null): boolean => {
    if (!lastSeenAt) return false;
    const lastSeenDate = new Date(lastSeenAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeenDate > fiveMinutesAgo;
  };

  const handleLike = async () => {
    if (!currentUserId) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount((prev) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));
    
    if (newLikedState) {
      if (onLikeComment) {
        try {
          await onLikeComment(comment.id);
        } catch (error) {
          setIsLiked(false);
          setLikeCount((prev) => Math.max(0, prev - 1));
          console.error("Failed to like comment:", error);
        }
      }
    } else {
      if (onUnlikeComment) {
        try {
          await onUnlikeComment(comment.id);
        } catch (error) {
          setIsLiked(true);
          setLikeCount((prev) => prev + 1);
          console.error("Failed to unlike comment:", error);
        }
      }
    }
  };

  const handleEditSave = async () => {
    if (!editedContent.trim() || !onActualUpdateComment) return;
    setIsSavingEdit(true);
    const success = await onActualUpdateComment(comment.id, editedContent.trim());
    if (success) {
      setCurrentContent(editedContent.trim());
      setCurrentUpdatedAt(new Date().toISOString());
      setEditMode(false);
    }
    setIsSavingEdit(false);
    setShowMoreOptions(false);
  };

  const handleDelete = async () => {
    if (!onActualDeleteComment) return;
    if (window.confirm("Are you sure you want to delete this comment?")) {
      const success = await onActualDeleteComment(comment.id);
      if (success) {
        // Comment will disappear from list if parent re-fetches or filters
        // For now, we don't do anything client-side to remove it directly, relying on parent list update
      }
    }
    setShowMoreOptions(false);
  };
  
  const isCommentAuthor = currentUserId === comment.commentAuthorId;
  const formattedTimestamp = formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true });
  const wasEdited = currentUpdatedAt && comment.timestamp !== currentUpdatedAt;
  const commentDepthForStyles = comment.depth || 1;

  // Prepare data for UserTooltipWrapper
  const profileDataForTooltip: UserTooltipProfileData | null = comment.commentAuthorId ? {
    id: comment.commentAuthorId,
    username: commenterTooltipDetails?.username || comment.authorName,
    avatar_url: commenterTooltipDetails?.avatar_url || comment.authorAvatarUrl,
    bio: commenterTooltipDetails?.bio,
    created_at: commenterTooltipDetails?.created_at,
    email: commenterTooltipDetails?.email,
    role: commenterTooltipDetails?.role,
    is_location_verified: commenterTooltipDetails?.is_location_verified,
    last_seen_at: commenterTooltipDetails?.last_seen_at,
  } : null;
  
  // isOnline calculation for inline sailboat icon (if needed separately from tooltip)
  const isOnlineForIcon = commenterTooltipDetails ? calculateIsOnline(commenterTooltipDetails.last_seen_at) : false;

  return (
    <div className={`py-3 flex flex-col ${commentDepthForStyles > 1 ? (commentDepthForStyles === 2 ? 'ml-6 pl-3 border-l-2 border-gray-100' : 'ml-10 pl-3 border-l-2 border-gray-100') : '' }`}>
      <div className="flex items-start space-x-3">
        <UserTooltipWrapper profileData={profileDataForTooltip}> 
          <Image
            src={comment.authorAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=random&size=32`}
            alt={comment.authorName}
            width={32}
            height={32}
            className="rounded-full object-cover cursor-pointer"
          />
        </UserTooltipWrapper>
        
        <div className="flex-1">
          <div className="bg-slate-50 p-2.5 rounded-md">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center">
                <UserTooltipWrapper profileData={profileDataForTooltip}>
                  <span className="font-semibold text-xs text-slate-700 hover:underline cursor-pointer">{comment.authorName}</span>
                </UserTooltipWrapper>
                {isOnlineForIcon && (
                   <span title="Online">
                     <Sailboat size={10} className="ml-1 text-green-500" />
                   </span>
                )}
                {commenterTooltipDetails?.is_location_verified && (
                   <span title="Verified Resident">
                     <ShieldCheck size={10} className="ml-1 text-primaryTeal" />
                   </span>
                )}
              </div>
              {isCommentAuthor && 
               typeof onActualUpdateComment === 'function' && 
               typeof onActualDeleteComment === 'function' && (
                <div className="relative" ref={moreOptionsRef}>
                  <button
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className="p-1 rounded-full hover:bg-slate-200"
                    aria-label="More options"
                  >
                    <MoreHorizontal size={16} className="text-slate-500" />
                  </button>
                  {showMoreOptions && (
                    <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-md shadow-lg z-20 py-1">
                      <button
                        onClick={() => {
                          setEditMode(true);
                          setEditedContent(currentContent);
                          setShowMoreOptions(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center"
                      >
                        <Edit3 size={12} className="mr-2" /> Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 size={12} className="mr-2" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!editMode ? (
              <div className="prose prose-sm max-w-none break-words whitespace-pre-wrap text-black text-sm mt-0.5">
                {renderFormattedText(currentContent)}
              </div>
            ) : (
              <div className="mt-1.5">
                <CommentForm
                  onSubmit={async (e) => { e.preventDefault(); await handleEditSave(); }}
                  value={editedContent}
                  onChange={setEditedContent}
                  isSubmitting={isSavingEdit}
                  placeholder="Edit your comment..."
                  communityId={communityId}
                />
              </div>
            )}

            {!editMode && (
              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1.5">
                <button onClick={handleLike} className={`flex items-center hover:text-red-500 ${isLiked ? 'text-red-500' : ''}`}>
                  <Heart size={14} className={`mr-1 ${isLiked ? 'fill-current' : ''}`} /> {likeCount}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CommentsList: React.FC<CommentsListProps> = ({ comments, onLikeComment, onUnlikeComment, currentUserId, parentDepth = 1, onActualUpdateComment, onActualDeleteComment, communityId }) => {
  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onLikeComment={onLikeComment}
          onUnlikeComment={onUnlikeComment}
          currentUserId={currentUserId}
          onActualUpdateComment={onActualUpdateComment}
          onActualDeleteComment={onActualDeleteComment}
          communityId={communityId}
        />
      ))}
    </div>
  );
};

// Example usage (remove in production):
const exampleComments: CommentData[] = [
  {
    id: "1",
    commentAuthorId: "user123",
    authorName: "John Doe",
    authorAvatarUrl: "https://randomuser.me/api/portraits/men/1.jpg",
    content: "This is a top-level comment that is a bit longer to see how the text wraps and if the layout holds up with multiple lines of content.",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    updated_at: null,
    likeCount: 3,
    isLikedByCurrentUser: false,
    depth: 1,
    parent_id: null,
    replies: [
      {
        id: "2",
        commentAuthorId: "user456",
        authorName: "Jane Smith (Editor)",
        authorAvatarUrl: "https://randomuser.me/api/portraits/women/2.jpg",
        content: "This is a reply that has been edited!",
        timestamp: new Date(Date.now() - 4000000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        likeCount: 1,
        isLikedByCurrentUser: true,
        depth: 2,
        parent_id: "1",
        replies: [],
      },
      {
        id: "3",
        commentAuthorId: "user123", // Same as top-level author for testing edit/delete
        authorName: "John Doe",
        authorAvatarUrl: "https://randomuser.me/api/portraits/men/1.jpg",
        content: "This is another reply by the original commenter, so I should be able to edit this one.",
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        updated_at: null,
        likeCount: 0,
        isLikedByCurrentUser: false,
        depth: 2,
        parent_id: "1",
        replies: [],
      }
    ],
  },
  {
    id: "4",
    commentAuthorId: "user789",
    authorName: "Another User",
    authorAvatarUrl: "https://randomuser.me/api/portraits/men/3.jpg",
    content: "A simple comment with no replies.",
    timestamp: new Date(Date.now() - 1000000).toISOString(),
    updated_at: null,
    likeCount: 0,
    isLikedByCurrentUser: false,
    depth: 1,
    parent_id: null,
    replies: [],
  }
];
// <CommentsList comments={exampleComments} onReplySubmit={async()=>true} onLikeComment={async()=>{}} onUnlikeComment={async()=>{}} currentUserId="123" /> 