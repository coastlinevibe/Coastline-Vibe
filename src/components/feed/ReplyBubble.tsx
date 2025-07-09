import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Smile, Link, Bold, AtSign, X } from 'lucide-react';
import StickerPickerButton from './StickerPickerButton';
import { Sticker } from './StickerPicker';

interface ReplyBubbleProps {
  parentComment: {
    id: string;
    content: string;
    authorName: string;
  };
  onSend: (replyText: string, metadata?: any) => Promise<void>;
  onClose: () => void;
}

const ReplyBubble: React.FC<ReplyBubbleProps> = ({ parentComment, onSend, onClose }) => {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch AI suggestions when component mounts
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!parentComment.content) return;
      
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch('/api/ai/reply-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: parentComment.content }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error('Error fetching reply suggestions:', error);
        // Fallback suggestions if API fails
        setSuggestions([
          'Thanks for sharing your perspective!',
          'I completely agree with your point.',
          'Could you elaborate more on that?',
        ]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };
    
    fetchSuggestions();
  }, [parentComment.content]);

  // Helper to extract a short quote from the parent comment
  const getParentQuote = () => {
    const maxLength = 100;
    if (parentComment.content.length <= maxLength) return parentComment.content;
    return parentComment.content.substring(0, maxLength) + '...';
  };

  const handleStickerSelect = (sticker: Sticker) => {
    setSelectedSticker(sticker);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() && !selectedSticker) return;
    
    setIsSubmitting(true);
    try {
      const metadata = selectedSticker ? { sticker: selectedSticker } : undefined;
      await onSend(replyText, metadata);
      setReplyText('');
      setSelectedSticker(null);
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setReplyText(suggestion);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const toggleRecording = () => {
    // Mock implementation that simulates voice recording
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Start recording simulation
      const simulateRecording = () => {
        // Array of possible transcription phrases
        const phrases = [
          "I think this is a great point you're making.",
          "I'd like to add my thoughts on this topic.",
          "Thanks for bringing this up!",
          "Let me think about this further.",
          "I've had a similar experience before."
        ];
        
        // Select a random phrase
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        
        // Add phrase to existing text with spacing
        setReplyText(prev => prev + (prev ? ' ' : '') + randomPhrase);
        setIsRecording(false);
      };
      
      // Simulate processing time (1.5-2.5 seconds)
      const randomDelay = 1500 + Math.random() * 1000;
      setTimeout(simulateRecording, randomDelay);
    }
  };

  const applyRichTextFormat = (format: 'bold' | 'link' | 'mention') => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = replyText.substring(start, end);
    
    let newText = replyText;
    let newCursorPos = end;
    
    switch (format) {
      case 'bold':
        newText = replyText.substring(0, start) + `**${selectedText}**` + replyText.substring(end);
        newCursorPos = end + 4;
        break;
      case 'link':
        newText = replyText.substring(0, start) + `[${selectedText}](url)` + replyText.substring(end);
        newCursorPos = end + 7;
        break;
      case 'mention':
        newText = replyText.substring(0, start) + `@${selectedText}` + replyText.substring(end);
        newCursorPos = end + 1;
        break;
    }
    
    setReplyText(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  return (
    <div className="relative mt-3 mb-4 bg-white rounded-lg shadow-md border-l-4 border-blue-400 overflow-hidden">
      <div className="absolute top-2 right-2">
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
          aria-label="Close reply bubble"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Parent comment quote */}
      <div className="bg-gray-50 p-3 border-b border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Replying to {parentComment.authorName}</p>
        <blockquote className="text-sm text-gray-700 italic pl-2 border-l-2 border-gray-300">
          "{getParentQuote()}"
        </blockquote>
      </div>
      
      {/* AI Suggestions */}
      <div className="px-3 pt-2 pb-1 flex flex-wrap gap-2">
        {isLoadingSuggestions ? (
          <div className="text-xs text-gray-500 animate-pulse">Loading suggestions...</div>
        ) : suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors"
            >
              {suggestion}
            </button>
          ))
        ) : (
          <div className="text-xs text-gray-500">No suggestions available</div>
        )}
      </div>
      
      {/* Selected sticker preview */}
      {selectedSticker && (
        <div className="mx-3 mt-2 inline-block bg-gray-100 p-1 rounded-md">
          <div className="flex items-center">
            <img 
              src={selectedSticker.url} 
              alt={selectedSticker.name} 
              className="h-8 w-8 object-contain" 
            />
            <button
              onClick={() => setSelectedSticker(null)}
              className="ml-1 text-xs text-red-500 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      
      {/* Reply textarea */}
      <div className="p-3 pt-2">
        <textarea
          ref={textareaRef}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write your reply..."
          className="w-full border border-gray-200 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400 min-h-[80px] max-h-[200px]"
          rows={3}
        />
      </div>
      
      {/* Toolbar and send button */}
      <div className="px-3 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => applyRichTextFormat('bold')}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button 
            onClick={() => applyRichTextFormat('link')}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Add link"
          >
            <Link size={16} />
          </button>
          <button 
            onClick={() => applyRichTextFormat('mention')}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Mention someone"
          >
            <AtSign size={16} />
          </button>
          <button 
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Add emoji"
          >
            <Smile size={16} />
          </button>
          <StickerPickerButton onStickerSelect={handleStickerSelect} />
          <button 
            onClick={toggleRecording}
            className={`p-1.5 ${isRecording ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} rounded`}
            title={isRecording ? 'Stop recording' : 'Record voice'}
          >
            <Mic size={16} />
            {isRecording && <span className="ml-1 text-xs animate-pulse">Recording...</span>}
          </button>
        </div>
        
        <button
          onClick={handleSendReply}
          disabled={(!replyText.trim() && !selectedSticker) || isSubmitting}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} className="mr-1" />
          {isSubmitting ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ReplyBubble;
