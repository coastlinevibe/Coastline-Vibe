'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import StickerPickerButton from './StickerPickerButton';
import { Sticker } from './StickerPicker';

interface CommentFormWithStickersProps {
  onSubmit: (text: string, sticker?: Sticker) => Promise<void>;
  placeholder?: string;
}

export default function CommentFormWithStickers({
  onSubmit,
  placeholder = 'Write a comment...'
}: CommentFormWithStickersProps) {
  const [text, setText] = useState('');
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!text.trim() && !selectedSticker) || isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(text, selectedSticker || undefined);
      setText('');
      setSelectedSticker(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStickerSelect = (sticker: Sticker) => {
    setSelectedSticker(sticker);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex items-center mb-2">
          {selectedSticker && (
            <div className="bg-gray-100 rounded-md px-2 py-1 flex items-center mr-2">
              <img 
                src={selectedSticker.url} 
                alt={selectedSticker.name} 
                className="w-6 h-6 mr-1"
              />
              <span className="text-sm text-gray-600">{selectedSticker.name}</span>
              <button
                type="button"
                className="ml-1 text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedSticker(null)}
              >
                ×
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={selectedSticker ? 'Add a message with your sticker...' : placeholder}
            className="flex-grow border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="flex items-center ml-2">
            <StickerPickerButton onStickerSelect={handleStickerSelect} />
            
            <button
              type="submit"
              disabled={isSubmitting || (!text.trim() && !selectedSticker)}
              className="ml-2 bg-blue-600 text-white rounded-full p-2 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
 