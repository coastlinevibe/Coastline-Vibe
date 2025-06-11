'use client';

import React, { useState } from 'react';
import { useTideReactions } from '@/context/TideReactionsContext';
import { COASTAL_REACTION_PACK } from '@/types/tide-reactions';

export default function TideReactionsTest() {
  const [postId] = useState('test-post-1');
  const { reactions, addReaction, removeReaction, isOnline } = useTideReactions();
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  
  const postReactions = reactions[postId] || [];
  
  const handleAddReaction = (reactionCode: string) => {
    const reaction = COASTAL_REACTION_PACK.reactions.find(r => r.code === reactionCode);
    if (!reaction) return;
    
    console.log('Adding reaction:', reaction);
    addReaction(postId, reaction.code, reaction.type, reaction.url);
    setSelectedReaction(reactionCode);
  };
  
  const handleRemoveReaction = (reactionId: string) => {
    console.log('Removing reaction:', reactionId);
    removeReaction(reactionId);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Tide Reactions Test</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Post</h2>
        <p className="text-gray-700 mb-6">This is a test post to try out the Tide Reactions feature.</p>
        
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-medium mb-3">Add a reaction:</h3>
          <div className="flex flex-wrap gap-3 mb-6">
            {COASTAL_REACTION_PACK.reactions.map(reaction => (
              <button
                key={reaction.code}
                onClick={() => handleAddReaction(reaction.code)}
                className={`p-2 rounded-lg border ${
                  selectedReaction === reaction.code 
                    ? 'bg-blue-100 border-blue-300' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                disabled={!isOnline}
              >
                <div className="flex flex-col items-center">
                  <img 
                    src={reaction.url} 
                    alt={reaction.name}
                    width={40}
                    height={40}
                    className="mb-1"
                    onError={(e) => {
                      console.error(`Failed to load image: ${reaction.url}`);
                      e.currentTarget.src = 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/wave.svg'; // Fallback
                    }}
                  />
                  <span className="text-xs">{reaction.name}</span>
                </div>
              </button>
            ))}
          </div>
          
          {postReactions.length > 0 ? (
            <div>
              <h3 className="font-medium mb-3">Current reactions:</h3>
              <div className="flex flex-wrap gap-2">
                {postReactions.map(reaction => (
                  <div key={reaction.id} className="bg-gray-50 rounded-full px-3 py-1 flex items-center gap-2 border border-gray-200">
                    <img 
                      src={reaction.reactionUrl} 
                      alt={reaction.reactionCode}
                      width={24}
                      height={24}
                      onError={(e) => {
                        console.error(`Failed to load image in display: ${reaction.reactionUrl}`);
                        e.currentTarget.src = 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/wave.svg'; // Fallback
                      }}
                    />
                    <span className="text-sm">{reaction.username}</span>
                    <button 
                      onClick={() => handleRemoveReaction(reaction.id)}
                      className="text-red-500 text-xs ml-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No reactions yet. Add one above!</p>
          )}
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Online status: <span className={isOnline ? 'text-green-500' : 'text-red-500'}>{isOnline ? 'Online' : 'Offline'}</span></p>
            <p className="mt-1">Reactions will disappear when you go offline or after 20 minutes of inactivity.</p>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
        <h3 className="font-medium text-blue-800 mb-2">Debug Information</h3>
        <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-60">
          {JSON.stringify({ reactions, postReactions }, null, 2)}
        </pre>
      </div>
    </div>
  );
} 