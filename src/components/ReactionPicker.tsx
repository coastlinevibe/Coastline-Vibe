import React from 'react';
import Image from 'next/image';

interface ReactionPickerProps {
  onSelect: (reactionId: string, event: React.MouseEvent) => void;
}

// Mapping of reaction IDs to their image file names in the bucket
const reactionMap = {
  lol: 'lol-128.png',
  angry: 'angry-128.png', 
  love: 'love-128.png',
  like: 'like-128.png',
  wow: 'wow-128.png'
};

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect }) => {
  const baseUrl = 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/';

  return (
    <div className="flex items-center space-x-2 bg-white rounded-full p-2 shadow-lg">
      {Object.entries(reactionMap).map(([id, filename]) => (
        <button
          key={id}
          className="reaction-button transition-transform hover:scale-125 focus:outline-none"
          onClick={(e) => onSelect(id, e)}
          aria-label={`React with ${id}`}
        >
          <Image
            src={`${baseUrl}${filename}`}
            alt={id}
            width={32}
            height={32}
            className="rounded-full"
          />
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker; 