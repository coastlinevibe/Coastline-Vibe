'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row']; // Assuming you have a profiles type

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  supabaseClient: SupabaseClient<Database>;
  placeholder?: string;
  rows?: number;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  supabaseClient,
  placeholder,
  rows = 2,
  className = '',
  onFocus,
  onBlur,
}) => {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Pick<Profile, 'id' | 'username' | 'avatar_url'>[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Function to parse text and identify potential mention query
  const checkForMention = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastWordMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    
    console.log('[MentionInput] checkForMention - value:', value, 'cursorPos:', cursorPos, 'lastWordMatch:', lastWordMatch);

    if (lastWordMatch) {
      setMentionQuery(lastWordMatch[1]);
      console.log('[MentionInput] checkForMention - setting mentionQuery to:', lastWordMatch[1]);
      setShowSuggestions(true);
      setActiveSuggestionIndex(0);
    } else {
      setMentionQuery(null);
      // console.log('[MentionInput] checkForMention - no match, setting mentionQuery to null');
      setShowSuggestions(false);
    }
  }, [value]);

  // Effect to check for mentions when input value changes
  useEffect(() => {
    checkForMention();
  }, [value, checkForMention]);

  // Debounced function to fetch suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    console.log('[MentionInput] fetchSuggestions - query:', query);
    if (!query || query.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, username, avatar_url')
        .like('username', `${query}%`) // Using like for 'starts with'
        // .ilike('username', `%${query}%`) // Use ilike for 'contains' (case-insensitive) if preferred
        .limit(5);

      if (error) {
        console.error('[MentionInput] Error fetching mention suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      console.log('[MentionInput] fetchSuggestions - data:', data);
      setSuggestions(data || []);
      setShowSuggestions(data && data.length > 0);

    } catch (e) {
      console.error('Exception fetching mention suggestions:', e);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [supabaseClient]);

  useEffect(() => {
    if (mentionQuery !== null) {
      const handler = setTimeout(() => {
        fetchSuggestions(mentionQuery);
      }, 300); // Debounce time
      return () => clearTimeout(handler);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [mentionQuery, fetchSuggestions]);


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
        setMentionQuery(null);
      }
    }
  };
  
  const handleSelectSuggestion = (profile: Pick<Profile, 'id' | 'username' | 'avatar_url'>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const currentText = value; // Use the prop value passed to the component
    const cursorPos = textarea.selectionStart;
    
    // Find the start of the @mention query
    let startIndex = cursorPos;
    while (startIndex > 0 && currentText[startIndex - 1] !== '@') {
      startIndex--;
    }
    if (currentText[startIndex - 1] !== '@') { // Should not happen if showSuggestions is true
        startIndex = cursorPos; // Fallback, replace just at cursor or append
    }
    if (startIndex > 0) startIndex--; // Include the '@' symbol

    const textBeforeMention = currentText.substring(0, startIndex);
    const textAfterMention = currentText.substring(cursorPos);
    
    const newText = `${textBeforeMention}@${profile.username} ${textAfterMention}`;
    onChange(newText);
    
    setShowSuggestions(false);
    setMentionQuery(null);
    setSuggestions([]);

    // Move cursor after the inserted mention + space
    requestAnimationFrame(() => {
      textarea.focus(); // Ensure textarea is focused
      const newCursorPos = (textBeforeMention + `@${profile.username} `).length;
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
        onBlurCapture={(e) => { // Use onBlurCapture or a timeout to allow suggestion click
            // If the blur is to a suggestion item, don't hide
            // This needs more robust logic if suggestions are outside this component tree
            if (onBlur) onBlur();
            // setTimeout(() => setShowSuggestions(false), 100); // Delay hiding
        }}
        placeholder={placeholder}
        rows={rows}
        className={`w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 resize-none ${className}`}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div 
            className="absolute z-10 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto"
            // style={{ top: textareaRef.current?.offsetHeight ? textareaRef.current.offsetHeight + 2 : '100%' }} // Position below textarea
        >
          {suggestions.map((profile, index) => (
            <div
              key={profile.id}
              className={`p-2 hover:bg-slate-100 cursor-pointer flex items-center text-sm ${index === activeSuggestionIndex ? 'bg-slate-100' : ''}`}
              onMouseDown={(e) => { 
                e.preventDefault(); // Prevent textarea blur before click is processed
                handleSelectSuggestion(profile);
              }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-6 h-6 rounded-full mr-2" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 mr-2 flex items-center justify-center text-slate-500 text-xs">{profile.username?.[0]?.toUpperCase()}</div>
              )}
              {profile.username}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput; 