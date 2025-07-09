'use client';

import React, { useState } from 'react';
import CommentFormWithStickers from '@/components/feed/CommentFormWithStickers';
import { Sticker } from '@/components/feed/StickerPicker';

export default function StickerDemo() {
  const [comments, setComments] = useState<Array<{text: string; sticker?: Sticker; id: number}>>([]);
  
  const handleCommentSubmit = async (text: string, sticker?: Sticker) => {
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Add the comment to our list
    setComments(prev => [
      ...prev,
      {
        id: Date.now(),
        text,
        sticker,
      }
    ]);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Sticker Picker Demo</h1>
      
      <div className="mb-8">
        <CommentFormWithStickers onSubmit={handleCommentSubmit} />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-2">Comments</h2>
        
        {comments.length === 0 ? (
          <p className="text-gray-500 italic">No comments yet. Be the first to comment!</p>
        ) : (
          <div className="space-y-3">
            {comments.map(comment => (
              <div key={comment.id} className="bg-white rounded-lg p-4 shadow-sm">
                {comment.sticker && (
                  <div className="mb-2">
                    <img 
                      src={comment.sticker.url} 
                      alt={comment.sticker.name} 
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                )}
                <p className="text-gray-800">{comment.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Posted {new Date().toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
