'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Sample predefined list of hashtags - replace or expand as needed
const PREDEFINED_HASHTAGS = [
  'news', 'events', 'local', 'community', 'discussion', 'update', 'important',
  'announcement', 'social', 'meetup', 'sports', 'weather', 'traffic', 'lostfound',
  'recommendation', 'question', 'offer', 'lookingfor', 'pets', 'family',
  'happy', 'suggestion', 'test' // Added for testing
  // Add up to 100 or more as required
];

interface HashtagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const HashtagInput: React.FC<HashtagInputProps> = ({
  value,
  onChange,
  placeholder,
  rows = 2,
  className = '',
  onFocus,
  onBlur,
}) => {
  const [hashtagQuery, setHashtagQuery] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const checkForHashtag = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastWordMatch = textBeforeCursor.match(/#([a-zA-Z0-9_]*)$/);

    if (lastWordMatch) {
      const query = lastWordMatch[1].toLowerCase();
      setHashtagQuery(query);
      const filteredSuggestions = PREDEFINED_HASHTAGS.filter(tag => 
        tag.toLowerCase().startsWith(query)
      ).slice(0, 7); // Limit suggestions shown
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
      setActiveSuggestionIndex(0);
    } else {
      setHashtagQuery(null);
      setShowSuggestions(false);
    }
  }, [value]);

  useEffect(() => {
    checkForHashtag();
  }, [value, checkForHashtag]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setShowSuggestions(false);
        setHashtagQuery(null);
      }
    }
  };
  
  const handleSelectSuggestion = (selectedTag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const currentText = value;
    const cursorPos = textarea.selectionStart;
    let startIndex = cursorPos;
    while (startIndex > 0 && currentText[startIndex - 1] !== '#') {
      startIndex--;
    }
    if (currentText[startIndex - 1] !== '#') startIndex = cursorPos;
    if (startIndex > 0) startIndex--; 

    const textBeforeHashtag = currentText.substring(0, startIndex);
    const textAfterHashtag = currentText.substring(cursorPos);
    const newText = `${textBeforeHashtag}#${selectedTag} ${textAfterHashtag}`;
    onChange(newText);
    setShowSuggestions(false);
    setHashtagQuery(null);
    setSuggestions([]);
    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = (textBeforeHashtag + `#${selectedTag} `).length;
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    });
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlurCapture={() => setTimeout(() => setShowSuggestions(false), 150)} // Delay hide to allow click
        placeholder={placeholder}
        rows={rows}
        className={`w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 resize-none ${className}`}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
          {suggestions.map((tag, index) => (
            <div
              key={tag}
              className={`p-2 hover:bg-slate-100 cursor-pointer text-sm ${index === activeSuggestionIndex ? 'bg-slate-100' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(tag); }}
            >
              #{tag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HashtagInput; 