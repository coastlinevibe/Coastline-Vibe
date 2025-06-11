'use client';

import React from 'react';
import Link from 'next/link';

interface HashtagTextProps {
  content: string;
  onHashtagClick?: (hashtag: string) => void;
}

const HashtagText: React.FC<HashtagTextProps> = ({ content, onHashtagClick }) => {
  if (!content) return null;
  
  // Split the content by hashtags and mentions
  // This regex matches both hashtags and mentions
  const regex = /(\B#\w+|\B@\w+)/g;
  const parts = content.split(regex);
  
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
        } else if (part.startsWith('@')) {
          const username = part.substring(1);
          return (
            <Link 
              key={index}
              href={`/profile/${username}`}
              legacyBehavior={false}
            >
              <span className="text-cyan-600 font-semibold cursor-pointer hover:underline">
                {part}
              </span>
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export default HashtagText; 