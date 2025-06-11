'use client';

import React, { useState, useEffect } from 'react';
import { useTideReactions } from '@/context/TideReactionsContext';
import Image from 'next/image';

interface TideReactionDisplayProps {
  postId: string;
  className?: string;
}

export default function TideReactionDisplay({ postId, className = '' }: TideReactionDisplayProps) {
  const { reactions, removeReaction } = useTideReactions();
  const postReactions = reactions[postId] || [];
  const [error, setError] = useState<string | null>(null);
  
  // Debug log
  useEffect(() => {
    console.log(`TideReactionDisplay for post ${postId}:`, postReactions);
  }, [postId, postReactions]);
  
  // Group reactions by code
  const groupedReactions = postReactions.reduce((acc, reaction) => {
    if (!acc[reaction.reactionCode]) {
      acc[reaction.reactionCode] = [];
    }
    acc[reaction.reactionCode].push(reaction);
    return acc;
  }, {} as Record<string, typeof postReactions>);
  
  const handleRemoveReaction = (reactionId: string) => {
    setError(null);
    try {
      removeReaction(reactionId);
    } catch (err) {
      console.error('Error removing reaction:', err);
      setError('Failed to remove reaction');
    }
  };
  
  if (Object.keys(groupedReactions).length === 0) {
    return null;
  }
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {Object.entries(groupedReactions).map(([reactionCode, reactions]) => {
        // Get the URL from the first reaction
        const reactionUrl = reactions[0]?.reactionUrl || '';
        console.log(`Displaying reaction ${reactionCode} with URL:`, reactionUrl);
        
        return (
          <div key={reactionCode} className="relative group">
            <button
              onClick={() => {
                // Find if user has this reaction and remove it
                const userReaction = reactions.find(r => r.userId === getUserId());
                if (userReaction) {
                  handleRemoveReaction(userReaction.id);
                }
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full border ${
                reactions.some(r => r.userId === getUserId())
                  ? 'bg-blue-100 border-blue-300'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="w-5 h-5 relative overflow-hidden rounded-full">
                <img
                  src={reactionUrl}
                  alt={reactionCode}
                  className="w-full h-full object-contain"
                  width={20}
                  height={20}
                  onError={(e) => {
                    console.error(`Failed to load image: ${reactionUrl}`);
                    e.currentTarget.src = 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/like.svg'; // Fallback
                  }}
                />
              </div>
              <span className="text-xs font-medium">{reactions.length}</span>
            </button>
            
            {/* Simple tooltip */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
              <div className="bg-black bg-opacity-80 text-white text-xs rounded py-1 px-2 min-w-[100px]">
                {reactions.slice(0, 3).map((r) => (
                  <div key={r.id} className="whitespace-nowrap">
                    {r.username || 'Unknown user'}
                    {r.userId === getUserId() && ' (you)'}
                  </div>
                ))}
                {reactions.length > 3 && (
                  <div>+{reactions.length - 3} more</div>
                )}
                <div className="absolute top-full left-1/2 border-4 border-transparent border-t-black border-opacity-80"></div>
              </div>
            </div>
          </div>
        );
      })}
      
      {error && (
        <div className="text-xs text-red-500">{error}</div>
      )}
      
      {postReactions.length > 0 && (
        <div className="w-full text-xs text-gray-500 mt-1">
          {postReactions.length} tide {postReactions.length === 1 ? 'reaction' : 'reactions'}
        </div>
      )}
    </div>
  );
}

// Helper function to get the current user ID
function getUserId(): string {
  if (typeof window === 'undefined') return '';
  
  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      return JSON.parse(userData).id;
    }
    
    const sessionData = sessionStorage.getItem('supabase.auth.token');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      const user = parsed?.currentSession?.user;
      if (user) return user.id;
    }
  } catch (e) {
    console.error('Error getting user ID', e);
  }
  
  return '';
} 