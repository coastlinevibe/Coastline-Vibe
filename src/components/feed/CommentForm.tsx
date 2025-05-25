import React, { useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import EmojiPicker from '@/components/shared/EmojiPicker';

interface CommentFormProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  value: string;
  onChange: (value: string) => void;
  isSubmitting: boolean;
  placeholder?: string;
}

export default function CommentForm({
  onSubmit,
  value,
  onChange,
  isSubmitting,
  placeholder = "Write a comment..."
}: CommentFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <form onSubmit={onSubmit} className="mb-4 flex items-start space-x-2">
      <div className="flex-grow relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-2.5 border rounded-lg text-sm resize-none overflow-hidden dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          rows={1}
          disabled={isSubmitting}
        />
        <div className="absolute right-2 bottom-2">
          <EmojiPicker
            onEmojiSelect={(emoji) => {
              const textarea = textareaRef.current;
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newValue = value.substring(0, start) + emoji + value.substring(end);
                onChange(newValue);
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
      <button 
        type="submit" 
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center justify-center disabled:opacity-60"
        disabled={isSubmitting || !(typeof value === 'string' && value.trim())}
        title="Submit comment"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </button>
    </form>
  );
} 