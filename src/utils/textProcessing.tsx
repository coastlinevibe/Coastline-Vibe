import React from 'react';

// Renamed function to handle both mentions and hashtags
export const renderFormattedText = (text: string | null | undefined): React.ReactNode[] => {
  if (!text) return [];

  // Regex to match @mentions or #hashtags
  // It will capture either a mention like @username or a hashtag like #tagname
  const pattern = /(\B@[a-zA-Z0-9_]+|\B#[a-zA-Z0-9_]+)/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null; // Handle cases where split might produce empty strings

    if (part.startsWith('@')) {
      // It's a mention
      return (
        <span key={index} style={{ color: '#2563eb', fontWeight: '600' }}>
          {part}
        </span>
      );
    } else if (part.startsWith('#')) {
      // It's a hashtag - for now, same style as mentions
      return (
        <span key={index} style={{ color: '#2563eb', fontWeight: '600' }}>
          {part}
        </span>
      );
    }
    // It's a regular text part
    return part;
  }).filter(part => part !== null); // Filter out any null parts added
}; 