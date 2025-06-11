'use client';

import React, { useEffect, useState } from 'react';
import { useTideReactions } from '@/context/TideReactionsContext';
import { TideReaction } from '@/types/tide-reactions';
import CoastlineReactionBar from './CoastlineReactionBar';

interface ReactionGroup {
  code: string;
  url: string;
  count: number;
  users: string[];
}

interface CoastlineReactionDisplayProps {
  postId: string;
  className?: string;
  showReactionBar?: boolean;
  barPosition?: 'top' | 'bottom';
  sectionType?: 'feed' | 'property' | 'market' | 'directory' | 'group';
}

export default function CoastlineReactionDisplay({
  postId,
  className = '',
  showReactionBar = true,
  barPosition = 'bottom',
  sectionType = 'feed'
}: CoastlineReactionDisplayProps) {
  const { reactions, addReaction } = useTideReactions();
  const [reactionGroups, setReactionGroups] = useState<ReactionGroup[]>([]);
  const [animatingReactions, setAnimatingReactions] = useState<TideReaction[]>([]);
  
  // Add debug log
  useEffect(() => {
    console.log(`CoastlineReactionDisplay mounted for post ${postId}`);
    console.log('Available reactions:', reactions);
    
    return () => {
      console.log(`CoastlineReactionDisplay unmounted for post ${postId}`);
    };
  }, [postId, reactions]);
  
  // Process the reactions into grouped format
  useEffect(() => {
    // Get reactions for this post and filter by section type if provided
    const postReactions = (reactions[postId] || []).filter(reaction => {
      // If no section type in metadata, include it (backward compatibility)
      if (!reaction.metadata?.sectionType) return true;
      
      // Otherwise, only include if it matches the current section
      return reaction.metadata.sectionType === sectionType;
    });
    
    console.log(`Post ${postId} has ${postReactions.length} reactions for section ${sectionType}`);
    
    // Check for any new animated reactions to display
    const newAnimatedReactions = postReactions.filter(
      r => r.reactionType === 'animated' && 
      !animatingReactions.some(ar => ar.id === r.id)
    );
    
    if (newAnimatedReactions.length > 0) {
      console.log(`Adding ${newAnimatedReactions.length} new animated reactions`);
      setAnimatingReactions(prev => [...prev, ...newAnimatedReactions]);
      
      // Schedule cleanup after animation completes
      newAnimatedReactions.forEach(reaction => {
        setTimeout(() => {
          setAnimatingReactions(prev => prev.filter(r => r.id !== reaction.id));
        }, 3000); // Animation duration
      });
    }
    
    // Group reactions by type
    const groups: Record<string, ReactionGroup> = {};
    
    postReactions.forEach(reaction => {
      const { reactionCode, reactionUrl, username } = reaction;
      
      if (!groups[reactionCode]) {
        groups[reactionCode] = {
          code: reactionCode,
          url: reactionUrl,
          count: 0,
          users: [],
        };
      }
      
      groups[reactionCode].count++;
      if (!groups[reactionCode].users.includes(username)) {
        groups[reactionCode].users.push(username);
      }
    });
    
    // Convert to array and sort by count (highest first)
    const groupsArray = Object.values(groups).sort((a, b) => b.count - a.count);
    console.log(`Grouped into ${groupsArray.length} reaction types`, groupsArray);
    setReactionGroups(groupsArray);
  }, [reactions, postId, sectionType, animatingReactions]);
  
  // Check if there are any reactions to display
  const hasReactions = reactionGroups.length > 0;
  
  // Generate tooltip text
  const getTooltipText = (group: ReactionGroup): string => {
    const { users, count } = group;
    
    if (users.length === 0) return 'No reactions yet';
    if (users.length === 1) return `${users[0]}`;
    if (users.length === 2) return `${users[0]} and ${users[1]}`;
    if (users.length === 3) return `${users[0]}, ${users[1]} and ${users[2]}`;
    
    return `${users[0]}, ${users[1]} and ${count - 2} others`;
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Animated reaction effects */}
      {animatingReactions.map(reaction => (
        <div 
          key={reaction.id}
          className="absolute pointer-events-none animate-reaction-float"
          style={{
            left: `${(reaction.metadata?.positionX || 0.5) * 100}%`,
            top: `${(reaction.metadata?.positionY || 0.5) * 100}%`,
            zIndex: 10,
          }}
        >
          <img
            src={reaction.reactionUrl}
            alt={reaction.reactionCode}
            className="w-10 h-10 object-contain"
          />
        </div>
      ))}
      
      {/* Reaction display */}
      <div className="flex flex-wrap items-center gap-1">        
        {hasReactions && (
          <div className="flex flex-wrap items-center gap-1 bg-teal-50 px-2 py-1 rounded-full border border-teal-100">
            {reactionGroups.map(group => (
              <div 
                key={group.code}
                className="flex items-center rounded-full hover:bg-teal-100 px-1.5 py-0.5 cursor-default transition-colors"
                title={getTooltipText(group)}
              >
                <img 
                  src={group.url} 
                  alt={group.code}
                  className="w-6 h-6 mr-1"
                />
                <span className="text-xs font-medium text-teal-700">{group.count}</span>
              </div>
            ))}
          </div>
        )}
        
        {showReactionBar && (
          <CoastlineReactionBar 
            postId={postId} 
            position={barPosition}
            sectionType={sectionType}
            className={hasReactions ? "ml-1" : ""}
          />
        )}
      </div>
    </div>
  );
} 