'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Sailboat } from 'lucide-react';

// Define basic types
export interface Sticker {
  id: string;
  name: string;
  url: string;
}

export interface StickerPack {
  id: string;
  name: string;
  stickers: Sticker[];
}

interface StickerPickerProps {
  onSelectSticker: (sticker: Sticker) => void;
  onClose: () => void;
  stickerPacks: StickerPack[];
}

export default function StickerPicker({ 
  onSelectSticker,
  onClose,
  stickerPacks
}: StickerPickerProps) {
  const [activePackId, setActivePackId] = useState<string>(stickerPacks[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Get stickers for the active pack
  const activeStickers = stickerPacks.find(pack => pack.id === activePackId)?.stickers || [];
  
  // Filter stickers based on search query
  const filteredStickers = searchQuery
    ? activeStickers.filter(sticker => 
        sticker.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeStickers;

  return (
    <div 
      ref={containerRef}
      className="bg-white rounded-lg shadow-lg border border-gray-200 w-[350px] flex flex-col"
      style={{ maxHeight: '450px' }}
    >
      {/* Header with search */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="text-base font-medium">Coastal Reactions</div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Search input */}
      <div className="px-3 pt-2 pb-2 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search stickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Stickers grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredStickers.length > 0 ? (
          <div className="grid grid-cols-5 gap-2">
            {filteredStickers.map((sticker) => (
              <button 
                key={sticker.id}
                onClick={() => onSelectSticker(sticker)}
                className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center hover:bg-blue-50 transition"
              >
                <img
                  src={sticker.url}
                  alt={sticker.name}
                  className="max-w-full max-h-full object-contain p-1"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Sailboat size={32} className="mb-2 opacity-50" />
            <p>No stickers found</p>
          </div>
        )}
      </div>
      
      {/* Sticker packs selector */}
      <div className="border-t p-2 flex items-center overflow-x-auto">
        {stickerPacks.map((pack) => (
          <button
            key={pack.id}
            onClick={() => {
              setActivePackId(pack.id);
              setSearchQuery('');
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0 mr-2 ${
              activePackId === pack.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {pack.name}
          </button>
        ))}
      </div>
    </div>
  );
}
 