'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  UserCircle2, 
  MoreHorizontal,
  Edit3,
  Trash2,
  CheckSquare,
  XSquare,
  Loader2,
  Send,
  Heart
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { renderFormattedText } from '@/utils/textProcessing';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import HashtagInput from '@/components/shared/HashtagInput';
import EmojiPicker from '@/components/shared/EmojiPicker';

export interface CommentItemProps {
  id: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  timestamp: string;
  textContent: string;
  commentAuthorId: string;
  currentUserId?: string | null;
  updated_at?: string | null;
  onUpdateComment?: (commentId: string, newContent: string) => Promise<boolean>;
  onDeleteComment?: (commentId: string) => Promise<boolean>;
  onReplySubmit?: (parentCommentId: string, replyText: string, parentDepth: number) => Promise<boolean>;
  depth: number;
  parent_id?: string | null;
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
  onLikeComment?: (commentId: string) => Promise<void>;
  onUnlikeComment?: (commentId: string) => Promise<void>;
  supabaseClient: SupabaseClient<Database>;
  replies?: CommentItemProps[];
}

export interface CommentItemPropsWithRecursiveReplies extends CommentItemProps {
  replies?: CommentItemPropsWithRecursiveReplies[];
}

export default function CommentItem({
  id,
  authorName,
  authorAvatarUrl,
  timestamp,
  textContent: initialTextContent,
  commentAuthorId,
  currentUserId,
  updated_at,
  onUpdateComment,
  onDeleteComment,
  onReplySubmit,
  depth,
  parent_id,
  likeCount = 0,
  isLikedByCurrentUser = false,
  onLikeComment,
  onUnlikeComment,
  supabaseClient,
  replies,
}: CommentItemPropsWithRecursiveReplies) {
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(initialTextContent);
  const [displayedTextContent, setDisplayedTextContent] = useState(initialTextContent);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const [optimisticLikeCount, setOptimisticLikeCount] = useState(likeCount);
  const [optimisticIsLiked, setOptimisticIsLiked] = useState(isLikedByCurrentUser);

  // Add state for showing/hiding replies
  const [showReplies, setShowReplies] = useState(false);

  useEffect(() => {
    setDisplayedTextContent(initialTextContent);
    if (!isEditing) {
      setEditedText(initialTextContent);
    }
  }, [initialTextContent, isEditing]);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [optionsMenuRef]);

  useEffect(() => {
    setOptimisticLikeCount(likeCount);
  }, [likeCount]);

  useEffect(() => {
    setOptimisticIsLiked(isLikedByCurrentUser);
  }, [isLikedByCurrentUser]);

  const canModify = currentUserId && commentAuthorId === currentUserId;

  let isActuallyEdited = false;
  let formattedTimestamp = timestamp;
  let formattedUpdatedAt: string | undefined = undefined;

  try {
    formattedTimestamp = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (e) {
    console.warn("Could not format main timestamp for comment:", timestamp, e);
  }

  if (updated_at) {
    try {
      const createdAtDate = new Date(timestamp);
      const updatedAtDate = new Date(updated_at);
      if (updatedAtDate.getTime() > createdAtDate.getTime() + 5000) {
        isActuallyEdited = true;
        formattedUpdatedAt = formatDistanceToNow(updatedAtDate, { addSuffix: true });
      }
    } catch (e) {
      console.warn("Could not parse or format dates for comment edited check", timestamp, updated_at, e);
    }
  }

  const handleEdit = () => {
    setEditedText(displayedTextContent);
    setIsEditing(true);
    setShowOptionsMenu(false);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText(displayedTextContent);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    console.log('[CommentItem_SaveEdit] Called. onUpdateComment available?', !!onUpdateComment);
    if (!onUpdateComment) {
      setIsEditing(false);
      return;
    }
    if (editedText.trim() === displayedTextContent.trim()) {
      console.log('[CommentItem_SaveEdit] Text unchanged, exiting edit mode.');
      setIsEditing(false);
      return;
    }
    if (!editedText.trim()) {
      setEditError("Comment cannot be empty.");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    try {
      console.log(`[CommentItem_SaveEdit] Calling onUpdateComment with id: ${id}, newContent: '${editedText.trim()}'`);
      const success = await onUpdateComment(id, editedText.trim());
      console.log('[CommentItem_SaveEdit] onUpdateComment success status:', success);
      if (success) {
        setIsEditing(false);
        setDisplayedTextContent(editedText.trim());
        console.log('[CommentItem_SaveEdit] Successfully updated, displayed text set.');
      } else {
        setEditError("Failed to save comment. Please try again.");
        console.warn('[CommentItem_SaveEdit] onUpdateComment returned false.');
      }
    } catch (error) {
      console.error("[CommentItem_SaveEdit] Error saving comment edit:", error);
      setEditError("An unexpected error occurred while saving.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (onDeleteComment && window.confirm("Are you sure you want to delete this comment?")) {
      setShowOptionsMenu(false);
      try {
        await onDeleteComment(id);
      } catch (error) {
        console.error("Error deleting comment from CommentItem:", error);
      }
    }
  };

  const handleToggleReplyForm = () => {
    setShowReplyForm(!showReplyForm);
    setReplyText("");
    setReplyError(null);
  };

  const handleReplyTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(event.target.value);
  };

  const handleSubmitReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onReplySubmit || !replyText.trim()) {
      if (!replyText.trim()) setReplyError("Reply cannot be empty.");
      return;
    }

    // Check if we've reached max reply depth
    if (depth >= 3) {
      setReplyError("Maximum reply depth reached. You cannot reply to this comment.");
      return;
    }

    setIsSubmittingReply(true);
    setReplyError(null);
    try {
      const success = await onReplySubmit(id, replyText.trim(), depth);
      if (success) {
        setShowReplyForm(false);
        setReplyText("");
      } else {
        setReplyError("Failed to submit reply. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting reply from CommentItem:", error);
      setReplyError("An unexpected error occurred while submitting your reply.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!onLikeComment || !onUnlikeComment) return;

    if (optimisticIsLiked) {
      setOptimisticIsLiked(false);
      setOptimisticLikeCount(prev => prev - 1);
      try {
        await onUnlikeComment(id);
      } catch (error) {
        console.error("Error unliking comment:", error);
        setOptimisticIsLiked(true);
        setOptimisticLikeCount(prev => prev + 1);
      }
    } else {
      setOptimisticIsLiked(true);
      setOptimisticLikeCount(prev => prev + 1);
      try {
        await onLikeComment(id);
      } catch (error) {
        console.error("Error liking comment:", error);
        setOptimisticIsLiked(false);
        setOptimisticLikeCount(prev => prev - 1);
      }
    }
  };

  // Positioning and Indentation Constants
  const ABSOLUTE_TRUNK_X_PX = 4;          // Absolute X pos of the main vertical trunk line
  const MAIN_COMMENT_CONTENT_SHIFT_PX = 8; // Margin for main comment content (ml-2)
  const REPLY_INDENTATION_BASE_PX = 20;    // Base indentation for each reply level (approx pl-5)
  const EXTRA_REPLY_INDENT_PX = 16;      // Extra indent for deeper replies (approx pl-4 on top of base)

  const indentStyle: React.CSSProperties = {
    paddingLeft: `${depth > 1 ? REPLY_INDENTATION_BASE_PX + (depth - 2) * EXTRA_REPLY_INDENT_PX : 0}px`,
  };

  return (
    <div className={`comment-item-depth-${depth} group relative`} style={indentStyle}>
      {/* Vertical Thread Lines - Experimental - May need refinement */}
      {depth > 1 && parent_id && (
        <>
          {/* Trunk line connecting to parent */}
          <div 
            className="absolute bg-gray-300 dark:bg-gray-600"
            style={{
              width: '2px',
              left: `${ABSOLUTE_TRUNK_X_PX}px`, 
              top: '-16px', // Adjust to connect from above comment to mid-avatar of parent roughly
              height: 'calc(1.25rem + 8px)' // Height to reach approx mid-avatar (h-10/2 + space-x-3/2 roughly)
            }}
          ></div>
          {/* Horizontal line connecting this comment to the trunk */}
          <div 
            className="absolute bg-gray-300 dark:bg-gray-600"
            style={{
              width: `${(REPLY_INDENTATION_BASE_PX / 2) - ABSOLUTE_TRUNK_X_PX + 4}px`, // Width from trunk to comment content edge
              height: '2px',
              left: `${ABSOLUTE_TRUNK_X_PX + 2}px`, 
              top: 'calc(1.25rem - 1px)' // Vertically align with avatar center
            }}
          ></div>
        </>
      )}

      <div className={`flex items-start space-x-2.5 w-full`}>
        {authorAvatarUrl ? (
          <Image
            src={authorAvatarUrl}
            alt={`${authorName}'s avatar`}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <UserCircle2 className="w-8 h-8 text-slate-400" />
        )}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-0.5">
            <p className="font-semibold text-slate-800 text-xs">{authorName}</p>
            <p className="text-xxs text-slate-400">
              {formattedTimestamp}
              {isActuallyEdited && formattedUpdatedAt && <span className="text-slate-500 ml-1 text-xxs">(edited {formattedUpdatedAt})</span>}
              {isActuallyEdited && !formattedUpdatedAt && <span className="text-slate-500 ml-1 text-xxs">(edited)</span>}
            </p>
          </div>
          {isEditing ? (
            <div className="mt-1">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full p-2 border border-cyan-500 rounded-md focus:ring-cyan-500 focus:border-cyan-500 resize-y text-sm"
                rows={2}
                disabled={isSavingEdit}
                autoFocus
              />
              {editError && <p className="text-xs text-red-500 mt-1">{editError}</p>}
              <div className="mt-1.5 flex justify-end space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-md hover:bg-slate-100 flex items-center disabled:opacity-50"
                  disabled={isSavingEdit}
                >
                  <XSquare size={12} className="mr-1" /> Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 text-xs bg-cyan-500 text-white rounded-md hover:bg-cyan-600 flex items-center disabled:opacity-70"
                  disabled={isSavingEdit || !editedText.trim() || editedText.trim() === displayedTextContent.trim()}
                >
                  {isSavingEdit ? (
                    <Loader2 size={12} className="animate-spin mr-1" />
                  ) : (
                    <CheckSquare size={12} className="mr-1" />
                  )}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-700 text-sm whitespace-pre-wrap">{renderFormattedText(displayedTextContent)}</p>
          )}
          {!isEditing && (
            <div className="flex items-center space-x-3 mt-1">
              {onLikeComment && onUnlikeComment && (
                <button
                  onClick={handleLikeToggle}
                  className={`flex items-center text-xs font-medium hover:underline disabled:opacity-50 ${optimisticIsLiked ? 'text-rose-600' : 'text-slate-500 hover:text-slate-600'}`}
                  disabled={!currentUserId}
                  aria-pressed={optimisticIsLiked}
                >
                  <Heart size={14} className={`mr-1 ${optimisticIsLiked ? 'fill-rose-600' : ''}`} />
                  {optimisticLikeCount > 0 ? optimisticLikeCount : 'Like'}
                </button>
              )}
              {onReplySubmit && depth < 3 && (
                <button 
                  onClick={handleToggleReplyForm}
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-medium self-end flex items-center"
                >
                  {showReplyForm ? 'Cancel Reply' : 'Reply'}
                </button>
              )}
            </div>
          )}
          {showReplyForm && !isEditing && onReplySubmit && (
            <form onSubmit={handleSubmitReply} className="mt-2 w-full">
              <div className="relative">
              <HashtagInput 
                value={replyText}
                onChange={setReplyText}
                placeholder={`Replying to ${authorName}...`}
                rows={2}
                className="w-full text-sm bg-white focus:bg-white disabled:bg-slate-50"
              />
                <div className="absolute right-2 bottom-2">
                  <EmojiPicker
                    onEmojiSelect={(emoji) => {
                      const textarea = document.querySelector('textarea');
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newValue = replyText.substring(0, start) + emoji + replyText.substring(end);
                        setReplyText(newValue);
                        // Set cursor position after the inserted emoji
                        setTimeout(() => {
                          textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                          textarea.focus();
                        }, 0);
                      }
                    }}
                  />
                </div>
              </div>
              {replyError && <p className="text-xs text-red-500 mt-1">{replyError}</p>}
              <div className="mt-1.5 flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1 text-xs bg-rose-500 text-white rounded-md hover:bg-rose-600 flex items-center disabled:opacity-70"
                  disabled={isSubmittingReply || !replyText.trim()}
                >
                  {isSubmittingReply ? (
                    <Loader2 size={12} className="animate-spin mr-1" />
                  ) : (
                    <Send size={12} className="mr-1" />
                  )}
                  Post Reply
                </button>
              </div>
            </form>
          )}
        </div>
        {canModify && onUpdateComment && onDeleteComment && !isEditing && !showReplyForm && (
          <div className="ml-auto relative self-start" ref={optionsMenuRef}>
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              aria-label="Comment options"
              aria-expanded={showOptionsMenu}
            >
              <MoreHorizontal size={16} />
            </button>
            {showOptionsMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5">
                <button
                  onClick={handleEdit}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center"
                >
                  <Edit3 size={14} className="mr-2" /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center"
                >
                  <Trash2 size={14} className="mr-2" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render Replies */}
      {replies && replies.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium mb-2 ml-2"
            onClick={() => setShowReplies(v => !v)}
          >
            {showReplies ? `Hide Replies (${replies.length})` : `Show Replies (${replies.length})`}
          </button>
          {showReplies && (
            <div className="space-y-3 pl-5 border-l-2 border-gray-200 dark:border-gray-700 ml-5">
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              {...reply}
              currentUserId={currentUserId}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              onReplySubmit={onReplySubmit}
              onLikeComment={onLikeComment}
              onUnlikeComment={onUnlikeComment}
              supabaseClient={supabaseClient}
            />
          ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 