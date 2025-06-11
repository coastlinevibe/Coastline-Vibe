'use client';

import React, { useState } from 'react';
import TideReactionBar from '@/components/feed/TideReactionBar';
import TideReactionDisplay from '@/components/feed/TideReactionDisplay';
import { COASTAL_REACTION_PACK } from '@/types/tide-reactions';

export default function TideReactionsDemo() {
  const [posts] = useState([
    { id: 'post-1', title: 'Beach Day' },
    { id: 'post-2', title: 'Sunset Views' },
    { id: 'post-3', title: 'Coastal Adventures' },
  ]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Tide Reactions Demo</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">About Tide Reactions</h2>
        <p className="text-gray-700 mb-4">
          Tide Reactions are ephemeral reactions that disappear when users go offline or after 20 minutes of inactivity.
          They're designed to show real-time engagement without cluttering the database.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">Available Reactions</h3>
          <div className="grid grid-cols-5 gap-4">
            {COASTAL_REACTION_PACK.reactions.map(reaction => (
              <div key={reaction.code} className="flex flex-col items-center">
                <img 
                  src={reaction.url} 
                  alt={reaction.name}
                  className="w-12 h-12 object-cover"
                />
                <span className="text-xs text-center mt-1">{reaction.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
            <p className="text-gray-600 mb-4">
              This is a sample post to demonstrate the Tide Reactions feature.
              Try adding some reactions below!
            </p>
            
            <div className="border-t border-gray-200 pt-3 mt-4">
              <div className="flex items-center justify-between">
                <TideReactionBar postId={post.id} />
              </div>
              
              <div className="mt-3">
                <TideReactionDisplay postId={post.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 