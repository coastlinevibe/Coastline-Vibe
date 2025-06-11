'use client';

import { useState } from 'react';
import { Smile } from 'lucide-react';
import { FeedReactionsClient, ReactionType } from '@/lib/supabase/feed-reactions-client';

// Define coastal-themed emojis
const COASTAL_EMOJIS = [
  { code: 'wave', emoji: '🌊', name: 'Wave' },
  { code: 'sun', emoji: '🌅', name: 'Sunset' },
  { code: 'beach', emoji: '🏖️', name: 'Beach' },
  { code: 'palm', emoji: '🌴', name: 'Palm Tree' },
  { code: 'shell', emoji: '🐚', name: 'Shell' },
  { code: 'fish', emoji: '🐠', name: 'Fish' },
  { code: 'boat', emoji: '⛵', name: 'Sailboat' },
  { code: 'dolphin', emoji: '🐬', name: 'Dolphin' },
  { code: 'island', emoji: '🏝️', name: 'Island' },
  { code: 'swim', emoji: '🏊', name: 'Swimming' },
];

interface FeedPostReactionBarProps {
  postId: string;
  className?: string;
  onReactionAdded?: () => void;
}

export default function FeedPostReactionBar({ 
  postId, 
  className = '',
  onReactionAdded
}: FeedPostReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const reactionsClient = new FeedReactionsClient();

  const handleAddReaction = async (emoji: string) => {
    setIsAdding(true);
    setError(null);
    
    try {
      const { error } = await reactionsClient.addReaction(
        postId,
        'emoji',
        emoji,
        // Optional: make reactions expire after 20 minutes
        new Date(Date.now() + 20 * 60 * 1000).toISOString()
      );
      
      if (error) throw error;
      
      if (onReactionAdded) {
        onReactionAdded();
      }
    } catch (err) {
      console.error('Error adding reaction:', err);
      setError('Failed to add reaction');
    } finally {
      setIsAdding(false);
      setShowPicker(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button 
        onClick={() => setShowPicker(!showPicker)}
        disabled={isAdding}
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded"
        aria-label="Add reaction"
      >
        <Smile className="w-4 h-4 mr-1" />
        <span className="text-sm">React</span>
      </button>
      
      {showPicker && (
        <div className="absolute bottom-full mb-2 bg-white shadow-lg rounded-lg p-2 z-10">
          <div className="grid grid-cols-5 gap-2">
            {COASTAL_EMOJIS.map(item => (
              <button
                key={item.code}
                onClick={() => handleAddReaction(item.emoji)}
                disabled={isAdding}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg"
                title={item.name}
              >
                {item.emoji}
              </button>
            ))}
          </div>
          {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
        </div>
      )}
    </div>
  );
} 