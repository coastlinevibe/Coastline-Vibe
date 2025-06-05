import React from 'react';
import Link from 'next/link';

// Renamed function to handle both mentions and hashtags
export const renderFormattedText = (text: string | null | undefined): React.ReactNode[] => {
  if (!text) return [];

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  // Regex to find @mentions or #hashtags.
  // Ensures they are preceded by a non-alphanumeric char or start of string.
  // Captures the mention/hashtag itself in group 1.
  const pattern = /(?:^|[^a-zA-Z0-9_])(@[a-zA-Z0-9_]+|#[a-zA-Z0-9_]+)/g;

  for (const match of text.matchAll(pattern)) {
    const matchTextWithPrecedingChar = match[0]; // e.g., " @world" or " #tag" or "@world" if at start
    const symbolAndName = match[1]; // e.g., "@world" or "#tag"
    const matchStartIndex = match.index!;
    
    // Determine the actual start of the symbolAndName (after any preceding char)
    const symbolStartIndex = matchStartIndex + (matchTextWithPrecedingChar.length - symbolAndName.length);

    // Add the text before this match's symbolAndName
    if (symbolStartIndex > lastIndex) {
      nodes.push(
        <span key={`text-${lastIndex}`} className="text-black">
          {text.substring(lastIndex, symbolStartIndex)}
        </span>
      );
    }

    if (symbolAndName.startsWith('@')) {
      const username = symbolAndName.substring(1);
      nodes.push(
        <Link key={`mention-${symbolStartIndex}`} href={`/profile/${username}`} legacyBehavior={false}>
          <span className="text-cyan-600 font-semibold cursor-pointer hover:underline">
            {symbolAndName}
          </span>
        </Link>
      );
    } else if (symbolAndName.startsWith('#')) {
      nodes.push(
        <span key={`hashtag-${symbolStartIndex}`} className="text-sky-600 font-semibold">
          {symbolAndName}
        </span>
      );
    }
    lastIndex = symbolStartIndex + symbolAndName.length;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    nodes.push(
      <span key={`text-${lastIndex}`} className="text-black">
        {text.substring(lastIndex)}
      </span>
    );
  }

  // If no matches were found (e.g. plain text), return the original text wrapped in an array.
  return nodes.length > 0 ? nodes : 
    (text ? 
      [<span key="text-only" className="text-black">{text}</span>] 
      : 
      []
    );
}; 