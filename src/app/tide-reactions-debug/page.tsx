'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { COASTAL_REACTION_PACK } from '@/types/tide-reactions';

export default function TideReactionsDebug() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tide Reactions Debug</h1>
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Reaction Images Test</h2>
          
          <div className="grid grid-cols-5 gap-4">
            {COASTAL_REACTION_PACK.reactions.map(reaction => (
              <div key={reaction.code} className="flex flex-col items-center">
                <div className="w-12 h-12 relative mb-2 border border-gray-200">
                  <img 
                    src={reaction.url} 
                    alt={reaction.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs text-center">{reaction.name}</div>
                <div className="text-xs text-gray-500">{reaction.url}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">UI Components Test</h2>
          
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-medium mb-2">Tooltip Test</h3>
              <div className="p-4 border border-gray-200 rounded">
                <span className="bg-blue-100 p-2 rounded">Hover me (tooltip should appear)</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Popover Test</h3>
              <div className="p-4 border border-gray-200 rounded">
                <button className="bg-blue-500 text-white px-4 py-2 rounded">
                  Click me (popover should appear)
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({
              reactionPack: {
                name: COASTAL_REACTION_PACK.name,
                reactionCount: COASTAL_REACTION_PACK.reactions.length
              },
              environment: {
                isClient: typeof window !== 'undefined',
                nextPublicUrl: process.env.NEXT_PUBLIC_URL
              }
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 