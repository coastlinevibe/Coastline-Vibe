import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from 'lucide-react';
import CommentItem from './CommentItem';

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
  onReplySubmit?: (parentCommentId: string, replyText: string, parentDepth: number, files?: File[]) => Promise<boolean>;
  communityId: string;
}

export const CommentsList: React.FC<CommentsListProps> = ({ 
  comments, 
  onLikeComment, 
  onUnlikeComment, 
  currentUserId, 
  parentDepth = 1, 
  onActualUpdateComment, 
  onActualDeleteComment, 
  onReplySubmit, 
  communityId 
}) => {
  if (!comments || comments.length === 0) {
    return null;
  }

  // State to track which comment threads have visible replies
  const [visibleReplies, setVisibleReplies] = useState<Record<string, boolean>>({});
  const [allCommentsVisible, setAllCommentsVisible] = useState(true);

  // Initialize all replies to be visible by default
  useEffect(() => {
    if (comments && comments.length > 0) {
      const initialVisibility: Record<string, boolean> = {};
      comments.forEach(comment => {
        initialVisibility[comment.id] = true; // Set all replies to visible by default
      });
      setVisibleReplies(initialVisibility);
    }
  }, [comments]);

  // Toggle all comments visibility
  const toggleAllComments = () => {
    setAllCommentsVisible(!allCommentsVisible);
  };

  // Handler for toggling replies for a specific comment
  const handleToggleReplies = (commentId: string) => {
    setVisibleReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  return (
    <div className="space-y-3">
      {/* Toggle button for all comments if we have more than one comment */}
      {comments.length > 1 && (
        <div className="mb-2">
          <button
            onClick={toggleAllComments}
            className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {allCommentsVisible ? (
              <>
                <ChevronUp size={14} className="mr-1" />
                Hide all comments ({comments.length})
              </>
            ) : (
              <>
                <ChevronDown size={14} className="mr-1" />
                Show all comments ({comments.length})
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Only render comments if allCommentsVisible is true */}
      {allCommentsVisible && comments.map((comment) => (
        <div key={comment.id} className="comment-thread">
          <CommentItem
            id={comment.id}
            authorName={comment.authorName}
            authorAvatarUrl={comment.authorAvatarUrl}
            timestamp={comment.timestamp}
            textContent={comment.content}
            commentAuthorId={comment.commentAuthorId}
            currentUserId={currentUserId}
            updated_at={comment.updated_at}
            onUpdateComment={onActualUpdateComment}
            onDeleteComment={onActualDeleteComment}
            onReplySubmit={onReplySubmit}
            depth={comment.depth || 1}
            parent_id={comment.parent_id}
            likeCount={comment.likeCount}
            isLikedByCurrentUser={comment.isLikedByCurrentUser}
            onLikeComment={onLikeComment}
            onUnlikeComment={onUnlikeComment}
            communityId={communityId}
            hasReplies={comment.replies && comment.replies.length > 0}
            repliesCount={comment.replies ? comment.replies.length : 0}
            repliesVisible={visibleReplies[comment.id]}
            onToggleReplies={() => handleToggleReplies(comment.id)}
          />
          
          {/* Render nested replies when toggle is on */}
          {comment.replies && comment.replies.length > 0 && visibleReplies[comment.id] && (
            <div className="ml-8 mt-3 border-l-2 border-blue-100 pl-2">
              <CommentsList
                comments={comment.replies}
                onLikeComment={onLikeComment}
                onUnlikeComment={onUnlikeComment}
                currentUserId={currentUserId}
                parentDepth={(comment.depth || 1) + 1}
                onActualUpdateComment={onActualUpdateComment}
                onActualDeleteComment={onActualDeleteComment}
                onReplySubmit={onReplySubmit}
                communityId={communityId}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 