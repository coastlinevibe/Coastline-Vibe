'use client';

import React from 'react';

interface HashtagTextProps {
  content: string;
  onHashtagClick?: (hashtag: string) => void;
}

const HashtagText: React.FC<HashtagTextProps> = ({ content, onHashtagClick }) => {
  if (!content) return null;
  
  // Split the content by hashtags
  const parts = content.split(/(#\w+)/g);
  
  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          return (
            <span 
              key={index} 
              className="text-blue-500 hover:underline cursor-pointer"
              onClick={() => onHashtagClick && onHashtagClick(part.substring(1))}
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export default HashtagText; 