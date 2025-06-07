import React, { useState, useEffect } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { moderateContent } from '@/utils/aiUtils';

interface KindnessReminderProps {
  content: string;
  onContentChange?: (newContent: string) => void;
  disabled?: boolean;
}

export default function KindnessReminder({
  content,
  onContentChange,
  disabled = false,
}: KindnessReminderProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [recentlyDismissed, setRecentlyDismissed] = useState(false);
  const [debug, setDebug] = useState<string | null>(null);

  // Get the base URL based on current window location
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:3001';
  };

  // Debounce content changes to avoid too many API calls
  useEffect(() => {
    // Only check content that's substantial
    if (!content || content.length < 15 || disabled || recentlyDismissed) {
      setSuggestion(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkContent(content);
    }, 1500); // 1.5 second delay

    return () => {
      clearTimeout(timeoutId);
    };
  }, [content, disabled, recentlyDismissed]);

  const checkContent = async (textToCheck: string) => {
    if (isChecking || !textToCheck) return;
    
    setIsChecking(true);
    setDebug(`Checking content: "${textToCheck.substring(0, 30)}..."`);
    
    try {
      const baseUrl = getBaseUrl();
      setDebug(`Using API base URL: ${baseUrl}`);
      
      const result = await moderateContent(textToCheck);
      
      if (!result.isAppropriate && result.kindnessSuggestion) {
        setDebug('Content flagged, showing kindness suggestion');
        setSuggestion(result.kindnessSuggestion);
      } else {
        setDebug('Content passed moderation check');
        setSuggestion(null);
      }
    } catch (err: any) {
      console.error('Error checking content:', err);
      setDebug(`Error: ${JSON.stringify(err)}`);
      setSuggestion(null);
    } finally {
      setIsChecking(false);
    }
  };

  const applySuggestion = () => {
    if (onContentChange && suggestion) {
      onContentChange(suggestion);
      setSuggestion(null);
    }
  };

  const dismissSuggestion = () => {
    setSuggestion(null);
    setRecentlyDismissed(true);
    
    // Reset the dismissal after 1 minute
    setTimeout(() => {
      setRecentlyDismissed(false);
    }, 60000);
  };

  // Test the API directly
  const testDirectApi = async () => {
    try {
      const baseUrl = getBaseUrl();
      setDebug(`Testing direct API call to ${baseUrl}/api/ai/moderate...`);
      
      const response = await fetch(`${baseUrl}/api/ai/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      const data = await response.json();
      setDebug(`Direct API response: ${JSON.stringify(data)}`);
    } catch (err: any) {
      setDebug(`Direct API error: ${err.message}`);
    }
  };

  if (!suggestion) {
    return (
      <>
        {debug && process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mt-1 mb-1 p-1 border border-gray-200 rounded max-w-xs">
            {debug}
            <button 
              className="block text-blue-500 text-xs mt-1" 
              onClick={testDirectApi}
            >
              Test Direct API
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
      <div className="flex items-start">
        <AlertCircle className="text-amber-500 w-5 h-5 mr-2 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-amber-800 font-medium mb-1">Kindness Reminder</p>
          <p className="text-sm text-amber-700">{suggestion}</p>
          
          <div className="mt-2 flex space-x-2">
            <button
              type="button"
              onClick={applySuggestion}
              className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
            >
              <Check className="w-3 h-3 inline-block mr-1" />
              Use Suggestion
            </button>
            <button
              type="button"
              onClick={dismissSuggestion}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              Keep My Text
            </button>
          </div>
        </div>
      </div>
      
      {debug && process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2 p-1 border border-gray-200 rounded bg-white">
          {debug}
          <button 
            className="block text-blue-500 text-xs mt-1" 
            onClick={testDirectApi}
          >
            Test Direct API
          </button>
        </div>
      )}
    </div>
  );
} 