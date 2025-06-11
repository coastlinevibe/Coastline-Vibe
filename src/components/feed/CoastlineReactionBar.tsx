'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTideReactions } from '@/context/TideReactionsContext';
import { Smile } from 'lucide-react';
import { COASTLINE_REACTION_PACK } from '@/types/tide-reactions';

// Use the standard reactions from the COASTLINE_REACTION_PACK
const REACTION_IMAGES = COASTLINE_REACTION_PACK.reactions.map(reaction => ({
  code: reaction.code,
  name: reaction.name,
  url: reaction.url
}));

interface CoastlineReactionBarProps {
  postId: string;
  position?: 'top' | 'bottom';
  className?: string;
  sectionType?: 'feed' | 'property' | 'market' | 'directory' | 'group';
}

export default function CoastlineReactionBar({ 
  postId, 
  position = 'bottom', 
  className = '',
  sectionType = 'feed'
}: CoastlineReactionBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addReaction, hasUserReacted, isOnline } = useTideReactions();
  const barRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Close the reaction bar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleReactionClick = (reactionCode: string, reactionUrl: string) => {
    setError(null);
    
    if (!isOnline) {
      setError('You are offline. Cannot add reactions while offline.');
      return;
    }
    
    try {
      console.log(`Adding ${reactionCode} reaction for post ${postId} in ${sectionType} section`);
      
      // Add the reaction with section type in metadata
      addReaction(
        postId,
        reactionCode,
        'animated',
        reactionUrl,
        { 
          sectionType,
          positionX: Math.random(), // Random horizontal position
          positionY: Math.random()  // Random vertical position
        }
      );
      
      setIsOpen(false);
    } catch (err) {
      console.error('Error adding reaction:', err);
      setError('Failed to add reaction. Please try again.');
    }
  };
  
  return (
    <div 
      ref={barRef}
      className={`relative ${className}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-200"
        aria-label="Add reaction"
      >
        <Smile className="w-4 h-4 text-teal-600" />
        <span className="ml-1 text-xs text-teal-600 font-medium">React</span>
      </button>
      
      {isOpen && (
        <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 z-50 bg-white rounded-lg shadow-lg border border-teal-200 p-2 w-[280px]`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-teal-700">Coastal Reactions</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          
          {/* Reactions grid */}
          <div className="grid grid-cols-5 gap-2 p-1">
            {REACTION_IMAGES.map((reaction) => (
              <div key={reaction.code} className="flex flex-col items-center">
                <button
                  onClick={() => handleReactionClick(reaction.code, reaction.url)}
                  className={`p-1 rounded-lg hover:bg-teal-50 flex items-center justify-center ${
                    hasUserReacted(postId, reaction.code) ? 'bg-teal-100' : ''
                  }`}
                  disabled={!isOnline}
                >
                  <div className="w-8 h-8 relative overflow-hidden rounded-full">
                    <img 
                      src={reaction.url} 
                      alt={reaction.name}
                      className="w-full h-full object-cover"
                      width={32}
                      height={32}
                      onError={(e) => {
                        console.error(`Failed to load image: ${reaction.url}`);
                        e.currentTarget.src = 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/like.png'; // Fallback
                      }}
                    />
                  </div>
                </button>
                <span className="text-[10px] text-center mt-1">{reaction.name}</span>
              </div>
            ))}
          </div>
          
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              {error}
            </div>
          )}
          
          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
            <span>Reactions expire after 20 minutes</span>
            {!isOnline && (
              <span className="text-red-500 font-medium">You're offline</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 