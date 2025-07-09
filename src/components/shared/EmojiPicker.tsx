import React, { useState } from 'react';
import { Smile } from 'lucide-react';

// Empty emoji list - removed all default emojis
const EMOJI_LIST: string[] = [];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export default function EmojiPicker({ onEmojiSelect, className = '' }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
      >
        <Smile size={20} />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-50 min-w-[320px] w-80">
          <div className="grid grid-cols-10 gap-2 max-h-48 overflow-y-auto">
            {EMOJI_LIST.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onEmojiSelect(emoji);
                  setIsOpen(false);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 