'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTideReactions } from '@/context/TideReactionsContext';
import { COASTAL_REACTION_PACK } from '@/types/tide-reactions';
import { Smile } from 'lucide-react';
import Image from 'next/image';

interface TideReactionBarProps {
  postId: string;
  position?: 'top' | 'bottom';
  className?: string;
}

export default function TideReactionBar({ postId, position = 'bottom', className = '' }: TideReactionBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addReaction, hasUserReacted, isOnline } = useTideReactions();
  const barRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Debug log
  useEffect(() => {
    console.log('Available reactions:', COASTAL_REACTION_PACK.reactions);
  }, []);
  
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
  
  const handleReactionClick = (reactionCode: string) => {
    setError(null);
    
    if (!isOnline) {
      setError('You are offline. Cannot add reactions while offline.');
      return;
    }
    
    try {
      const reactionData = COASTAL_REACTION_PACK.reactions.find(r => r.code === reactionCode);
      if (!reactionData) return;
      
      // Use SVG files instead of GIF files
      const svgUrl = reactionData.url;
      console.log('Adding reaction with URL:', svgUrl);
      
      addReaction(
        postId,
        reactionData.code,
        reactionData.type,
        svgUrl
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
        className="flex items-center justify-center p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
        aria-label="Add reaction"
      >
        <Smile className="w-4 h-4 text-blue-600" />
        <span className="ml-1 text-xs text-blue-600 font-medium">React</span>
      </button>
      
      {isOpen && (
        <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-[280px]`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Tide Reactions</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          
          {/* Simple reactions grid */}
          <div className="grid grid-cols-5 gap-2 p-1">
            {COASTAL_REACTION_PACK.reactions.map((reaction) => (
              <div key={reaction.code} className="flex flex-col items-center">
                <button
                  onClick={() => handleReactionClick(reaction.code)}
                  className={`p-1 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center ${
                    hasUserReacted(postId, reaction.code) ? 'bg-blue-100' : ''
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
                        e.currentTarget.src = 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/wave.svg'; // Fallback
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
            <span>Reactions disappear when you go offline</span>
            {!isOnline && (
              <span className="text-red-500 font-medium">You're offline</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 