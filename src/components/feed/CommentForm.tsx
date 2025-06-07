import React from 'react';
import { Send, Loader2, X } from 'lucide-react';
import EmojiPicker from '@/components/shared/EmojiPicker';
import MentionTextarea from '@/components/mention/MentionTextarea';

interface CommentFormProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  value: string;
  onChange: (value: string) => void;
  isSubmitting: boolean;
  placeholder?: string;
  communityId: string;
  replyingTo?: {
    id: string;
    authorName: string;
  } | null;
  onCancelReply?: () => void;
  'data-post-id'?: string;
  showSubmitButton?: boolean;
}

export default function CommentForm({
  onSubmit,
  value,
  onChange,
  isSubmitting,
  placeholder = "Write a comment...",
  communityId,
  replyingTo = null,
  onCancelReply,
  'data-post-id': dataPostId,
  showSubmitButton = false,
}: CommentFormProps) {
  const handleEmojiInsert = (emoji: string) => {
    onChange(value + emoji);
  };

  // Create a handler for the MentionTextarea that adapts our onChange to its expected format
  const handleMentionTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <form onSubmit={onSubmit} className="relative mt-4" data-post-id={dataPostId}>
      {replyingTo && (
        <div className="flex items-center text-sm mb-2 text-muted-foreground">
          <span>Replying to <span className="font-medium text-primary">{replyingTo.authorName}</span></span>
          {onCancelReply && (
            <button 
              type="button" 
              onClick={onCancelReply}
              className="ml-2 text-muted-foreground hover:text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      <div className="flex items-start gap-2">
        <div className="flex-1 border rounded-md overflow-hidden bg-white">
          <div className="flex items-center">
            <MentionTextarea
              value={value}
              onChange={handleMentionTextareaChange}
              setValue={onChange}
              placeholder={placeholder}
              communityId={communityId}
              className="w-full p-2 min-h-[60px] resize-none focus:outline-none"
              data-post-id={dataPostId}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md flex items-center h-full mx-2 ${
                isSubmitting 
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } transition-colors`}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="ml-1 font-medium">Submit</span>
                </>
              )}
            </button>
          </div>
          <div className="flex justify-between items-center p-2 border-t">
            <div>
              <EmojiPicker onEmojiSelect={handleEmojiInsert} />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
} 