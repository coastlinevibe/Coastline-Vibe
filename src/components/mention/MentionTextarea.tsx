import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import type { Database } from '@/types/supabase';

// Simplified profile for suggestions
interface MentionSuggestion {
  id: string;
  username: string;
  avatar_url?: string | null;
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string | null;
}

interface MentionTextareaProps {
  value: string;
  setValue?: (value: string) => void;
  communityId: string;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  onBlur?: () => void;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  'data-post-id'?: string;
}

// Debounce utility
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: number | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = window.setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}

const MentionTextarea = React.forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  (props, ref) => {
    const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
    // Ensure resolvedRef is always a RefObject
    const resolvedRef = (ref && typeof ref !== 'function' ? ref : internalTextareaRef);

    const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
    const [isSuggestionsVisible, setSuggestionsVisible] = useState(false);
    const [currentMentionText, setCurrentMentionText] = useState('');
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [cursorPositionAfterUpdate, setCursorPositionAfterUpdate] = useState<number | null>(null);

    const suggestionsRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
      if (typeof props.value !== 'string') {
        props.setValue('');
        return;
      }
      // Update internal state when external value changes
      setSuggestions([]);
      setSuggestionsVisible(false);
      setCurrentMentionText('');
    }, [props.value, props.setValue]);

    const fetchUsersCallback = useCallback(async (query: string) => {
      if (!query || !props.communityId) {
        setSuggestions([]);
        setSuggestionsVisible(false);
        return;
      }
      setLoadingSuggestions(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url') 
          .eq('community_id', props.communityId)
          .ilike('username', `${query}%`)
          .limit(5);

        if (error) throw error;
        setSuggestions(data || []);
        setSuggestionsVisible(data && data.length > 0);
        setActiveSuggestionIndex(0); 
      } catch (error) {
        console.error('Error fetching users for mention:', error);
        setSuggestions([]);
        setSuggestionsVisible(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, [props.communityId]);

    const debouncedFetchUsers = useCallback(
      debounce(fetchUsersCallback, 300),
      [fetchUsersCallback]
    );

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = event.target.value;
      if (props.setValue) {
        props.setValue(text);
      }
      if (props.onChange) {
        props.onChange(event);
      }

      const cursorPosition = event.target.selectionStart;
      const textBeforeCursor = text.substring(0, cursorPosition);
      const atSignIndex = textBeforeCursor.lastIndexOf('@');

      if (atSignIndex !== -1) {
        const mentionQuery = textBeforeCursor.substring(atSignIndex + 1);
        if (/^[a-zA-Z0-9_]*$/.test(mentionQuery)) { 
          setCurrentMentionText(mentionQuery);
          if (mentionQuery.length > 0) {
             debouncedFetchUsers(mentionQuery);
             setSuggestionsVisible(true);
          } else {
            setSuggestions([]); 
            setSuggestionsVisible(false);
          }
        } else {
          setSuggestions([]);
          setSuggestionsVisible(false);
          setCurrentMentionText('');
        }
      } else {
        setSuggestions([]);
        setSuggestionsVisible(false);
        setCurrentMentionText('');
      }
    };

    const handleSelectUser = (user: UserProfile) => {
      const TRefCurrent = resolvedRef.current;
      if (!TRefCurrent) return;

      const currentDOMValue = TRefCurrent.value;
      const currentDOMCursorPos = TRefCurrent.selectionStart;

      let actualMentionStartIndex = -1;
      if (currentMentionText) {
        const potentialStart = currentDOMCursorPos - currentMentionText.length - 1;
        if (potentialStart >= 0 && currentDOMValue[potentialStart] === '@' && 
            currentDOMValue.substring(potentialStart + 1, currentDOMCursorPos) === currentMentionText) {
          actualMentionStartIndex = potentialStart;
        }
      }
      if (actualMentionStartIndex === -1) {
        actualMentionStartIndex = currentDOMValue.substring(0, currentDOMCursorPos).lastIndexOf('@');
      }

      if (actualMentionStartIndex !== -1) {
        const textBefore = currentDOMValue.substring(0, actualMentionStartIndex);
        const textAfter = currentDOMValue.substring(currentDOMCursorPos);
        
        const newText = `${textBefore}@${user.username} ${textAfter}`;

        if (props.setValue) {
          props.setValue(newText);
        }
        
        const newCursorPosition = actualMentionStartIndex + `@${user.username} `.length;
        setCursorPositionAfterUpdate(newCursorPosition);

      } else {
        const fallbackText = `${props.value || ''}${user.username} `;
         if (props.setValue) {
            props.setValue(fallbackText);
        }
        setCursorPositionAfterUpdate(fallbackText.length);
      }

      setSuggestions([]);
      setSuggestionsVisible(false);
      setCurrentMentionText('');
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (isSuggestionsVisible && suggestions.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setActiveSuggestionIndex((prevIndex) => (prevIndex + 1) % suggestions.length);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setActiveSuggestionIndex((prevIndex) => (prevIndex - 1 + suggestions.length) % suggestions.length);
        } else if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          handleSelectUser(suggestions[activeSuggestionIndex]);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setSuggestionsVisible(false);
          setSuggestions([]);
        }
      }
    };
    
    const handleBlur = () => {
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (suggestionsRef.current && !suggestionsRef.current.contains(activeEl)) {
            setSuggestionsVisible(false);
        }
      }, 100);
      if (props.onBlur) {
        props.onBlur();
      }
    };

    useEffect(() => {
      const TRefCurrent = resolvedRef.current;
      if (cursorPositionAfterUpdate !== null && TRefCurrent) {
        TRefCurrent.focus();
        TRefCurrent.setSelectionRange(cursorPositionAfterUpdate, cursorPositionAfterUpdate);
        setCursorPositionAfterUpdate(null); 
      }
    }, [props.value, cursorPositionAfterUpdate, resolvedRef]);


    return (
      <div className="relative w-full">
        <textarea
          ref={resolvedRef} 
          value={props.value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={props.placeholder}
          className={`w-full resize-none focus:outline-none ${props.className || "p-2 border rounded"}`}
          rows={props.rows}
          disabled={props.disabled}
          data-post-id={props['data-post-id'] || undefined}
        />
        {isSuggestionsVisible && suggestions.length > 0 && (
          <ul 
            ref={suggestionsRef} 
            className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
          >
            {loadingSuggestions ? (
              <li className="p-2 text-gray-500">Loading...</li>
            ) : (
              suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  className={`p-2 hover:bg-gray-100 cursor-pointer ${
                    index === activeSuggestionIndex ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => handleSelectUser(suggestion)}
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                >
                  <div className="flex items-center space-x-2">
                    {suggestion.avatar_url ? (
                      <img src={suggestion.avatar_url} alt={suggestion.username} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white">
                        {suggestion.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span>{suggestion.username}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    );
  }
);
MentionTextarea.displayName = 'MentionTextarea';
export default MentionTextarea; 