'use client';

import React, { useState } from 'react';
import { Sticker as StickerIcon } from 'lucide-react';
import StickerPicker, { Sticker, StickerPack } from './StickerPicker';

// Sample sticker packs data for demonstration
const SAMPLE_STICKER_PACKS: StickerPack[] = [
  {
    id: 'basic',
    name: 'Basic',
    stickers: [
      {
        id: 'thumbs-up',
        name: 'Thumbs Up',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44d.png'
      },
      {
        id: 'heart',
        name: 'Heart',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2764.png'
      },
      {
        id: 'laughing',
        name: 'Laughing',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f602.png'
      },
      {
        id: 'clap',
        name: 'Clapping',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44f.png'
      }
    ]
  },
  {
    id: 'coast',
    name: 'Coastline',
    stickers: [
      {
        id: 'wave',
        name: 'Wave',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f30a.png'
      },
      {
        id: 'beach',
        name: 'Beach',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3d6.png'
      },
      {
        id: 'sailboat',
        name: 'Sailboat',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26f5.png'
      },
      {
        id: 'fish',
        name: 'Fish',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f41f.png'
      }
    ]
  },
  {
    id: 'reactions',
    name: 'Reactions',
    stickers: [
      {
        id: 'love',
        name: 'Love',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f60d.png'
      },
      {
        id: 'wow',
        name: 'Wow',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f62e.png'
      },
      {
        id: 'angry',
        name: 'Angry',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f620.png'
      },
      {
        id: 'lol',
        name: 'LOL',
        url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f923.png'
      }
    ]
  }
];

interface StickerPickerButtonProps {
  onStickerSelect?: (sticker: Sticker) => void;
}

export default function StickerPickerButton({ onStickerSelect }: StickerPickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelectSticker = (sticker: Sticker) => {
    if (onStickerSelect) {
      onStickerSelect(sticker);
    }
    setIsOpen(false);
    console.log(`Selected sticker: ${sticker.name}`);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="Add sticker"
      >
        <StickerIcon size={20} />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 z-50">
          <StickerPicker
            onSelectSticker={handleSelectSticker}
            onClose={() => setIsOpen(false)}
            stickerPacks={SAMPLE_STICKER_PACKS}
          />
        </div>
      )}
    </div>
  );
}
 