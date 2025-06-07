import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { politeRewrite } from '@/utils/aiUtils';

interface PoliteRewriterProps {
  originalText: string;
  onRewritten: (rewrittenText: string) => void;
  disabled?: boolean;
}

export default function PoliteRewriter({ 
  originalText, 
  onRewritten, 
  disabled = false 
}: PoliteRewriterProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);

  // Get the base URL based on current window location
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:3001';
  };

  const handleRewrite = async () => {
    if (!originalText.trim() || disabled || isRewriting) return;
    
    setIsRewriting(true);
    setError(null);
    setDebug(`Attempting to rewrite: "${originalText.substring(0, 30)}..."`);
    
    try {
      // First check if the API is configured
      const baseUrl = getBaseUrl();
      setDebug(`Using API base URL: ${baseUrl}`);
      
      const testResponse = await fetch(`${baseUrl}/api/ai/test`);
      const testData = await testResponse.json();
      
      if (!testData.apiKeyConfigured) {
        throw new Error('OpenAI API key is not configured');
      }
      
      // If the API key is configured, proceed with the rewrite
      const rewrittenText = await politeRewrite(originalText);
      
      if (rewrittenText === originalText) {
        // If the text wasn't changed, check if there was an error
        setDebug('Rewrite returned unchanged text - possible API issue');
      } else {
        setDebug('Rewrite successful');
        onRewritten(rewrittenText);
      }
    } catch (err: any) {
      console.error('Error rewriting text:', err);
      setError(err.message || 'Failed to rewrite text. Please try again.');
      setDebug(`Error: ${JSON.stringify(err)}`);
    } finally {
      setIsRewriting(false);
    }
  };

  // Add a direct test function that bypasses the aiUtils
  const testDirectApi = async () => {
    try {
      const baseUrl = getBaseUrl();
      setDebug(`Testing direct API call to ${baseUrl}/api/ai/rewrite...`);
      
      const response = await fetch(`${baseUrl}/api/ai/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText }),
      });
      
      const data = await response.json();
      setDebug(`Direct API response: ${JSON.stringify(data)}`);
    } catch (err: any) {
      setDebug(`Direct API error: ${err.message}`);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleRewrite}
        disabled={disabled || isRewriting || !originalText.trim()}
        className={`inline-flex items-center text-xs text-gray-600 hover:text-cyan-600 ${isRewriting || disabled || !originalText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Rewrite as more polite"
      >
        <Wand2 className="w-4 h-4 mr-1" />
        {isRewriting ? 'Rewriting...' : 'Polite Rewrite'}
      </button>
      
      {error && (
        <div className="text-xs text-red-500 mt-1">
          {error}
        </div>
      )}
      
      {debug && process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-1 absolute top-full left-0 bg-white p-1 border border-gray-200 rounded z-10 max-w-xs">
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