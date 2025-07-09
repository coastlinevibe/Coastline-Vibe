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
  const [rewrittenText, setRewrittenText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRewrite = async () => {
    if (!originalText.trim() || disabled || isRewriting) return;
    
    setIsRewriting(true);
    setError(null);
    
    try {
      const rewritten = await politeRewrite(originalText);
      
      if (rewritten && rewritten !== originalText) {
        setRewrittenText(rewritten);
      } else {
        setError('Unable to rewrite the text. Please try again.');
      }
    } catch (err: any) {
      console.error('Error rewriting text:', err);
      setError(err.message || 'Failed to rewrite text. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleAcceptRewrite = () => {
    if (rewrittenText) {
      onRewritten(rewrittenText);
      setRewrittenText(null);
    }
  };

  const handleCancelRewrite = () => {
    setRewrittenText(null);
  };

  return (
    <div className="w-full">
      {!rewrittenText ? (
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleRewrite}
            disabled={disabled || isRewriting || !originalText.trim()}
            className={`flex items-center text-sm px-2 py-1 rounded bg-cyan-50 text-cyan-700 hover:bg-cyan-100 ${
              isRewriting || disabled || !originalText.trim() 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
            }`}
            title="Polish Text"
          >
            <Wand2 className="w-4 h-4 mr-1" />
            {isRewriting ? 'Rewriting...' : 'Polish Text'}
          </button>
          
          {error && (
            <div className="text-xs text-red-500 ml-2">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-blue-50 rounded-md p-3 border border-blue-200 mb-3">
          <div className="text-sm font-medium text-blue-600 mb-1">Suggested polite version:</div>
          <div className="text-gray-700 mb-3 p-2 bg-white rounded border border-blue-100">
            {rewrittenText}
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleAcceptRewrite}
              className="text-sm px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={handleCancelRewrite}
              className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 