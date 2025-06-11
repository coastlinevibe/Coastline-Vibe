import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import EmojiPicker from '@/components/shared/EmojiPicker';
import MentionTextarea from '@/components/mention/MentionTextarea';
import CommentKindnessReminder from '@/components/moderation/CommentKindnessReminder';
import { checkContentViolations, getKindnessMessage } from '@/utils/moderationUtils';

interface CommentFormProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  value: string;
  onChange: (value: string) => void;
  isSubmitting: boolean;
  placeholder?: string;
  communityId: string;
}

export default function CommentForm({
  onSubmit,
  value,
  onChange,
  isSubmitting,
  placeholder = "Write a comment...",
  communityId,
}: CommentFormProps) {
  const [showKindnessReminder, setShowKindnessReminder] = useState(false);
  const [moderationMessage, setModerationMessage] = useState('');

  const handleEmojiInsert = (emoji: string) => {
    onChange(value + emoji);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check content for violations
    const contentCheck = checkContentViolations(value);
    if (contentCheck.isViolation) {
      setModerationMessage(getKindnessMessage(contentCheck.violationType));
      setShowKindnessReminder(true);
      return;
    }
    
    // If no violations, proceed with submission
    await onSubmit(e);
  };

  const handleEditComment = () => {
    setShowKindnessReminder(false);
  };

  const handleIgnoreWarning = async () => {
    setShowKindnessReminder(false);
    // Create a synthetic event to pass to onSubmit
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>;
    await onSubmit(syntheticEvent);
  };

  return (
    <div>
      <CommentKindnessReminder
        isVisible={showKindnessReminder}
        message={moderationMessage}
        onEdit={handleEditComment}
        onIgnore={handleIgnoreWarning}
      />
      
      <form onSubmit={handleFormSubmit} className="flex items-start space-x-2">
      <div className="flex-grow relative">
        <MentionTextarea
          communityId={communityId}
          value={value}
          setValue={onChange}
          placeholder={placeholder}
          className="w-full p-2.5 border rounded-lg text-sm resize-none bg-white text-black border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 pr-10 placeholder-gray-500"
          rows={1}
        />
        <div className="absolute top-1/2 right-2.5 transform -translate-y-1/2 z-10 flex items-center">
          <EmojiPicker
            onEmojiSelect={handleEmojiInsert}
          />
        </div>
      </div>
      <button 
        type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm flex items-center justify-center disabled:opacity-60 h-[40px]"
        disabled={isSubmitting || !(typeof value === 'string' && value.trim())}
        title="Submit comment"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </button>
    </form>
    </div>
  );
} 