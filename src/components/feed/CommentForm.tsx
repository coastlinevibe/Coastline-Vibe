import React, { useState } from 'react';
import { Send, Loader2, Sticker } from 'lucide-react';
import EmojiPicker from '@/components/shared/EmojiPicker';
import MentionTextarea from '@/components/mention/MentionTextarea';
import CommentKindnessReminder from '@/components/moderation/CommentKindnessReminder';
import { checkContentViolations, getKindnessMessage } from '@/utils/moderationUtils';
import StickerPicker, { Sticker as StickerType } from './StickerPicker';

// Define a custom event type that includes sticker data
interface CustomFormEvent extends React.FormEvent<HTMLFormElement> {
  sticker?: StickerType;
}

interface CommentFormProps {
  onSubmit: (event: CustomFormEvent) => Promise<void>;
  value: string;
  onChange: (value: string) => void;
  isSubmitting: boolean;
  placeholder?: string;
  communityId: string;
}

export default function CommentForm({
  onSubmit,
  value,
  onChange,
  isSubmitting,
  placeholder = "Write a comment...",
  communityId,
}: CommentFormProps) {
  const [showKindnessReminder, setShowKindnessReminder] = useState(false);
  const [moderationMessage, setModerationMessage] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<StickerType | null>(null);

  const handleEmojiInsert = (emoji: string) => {
    onChange(value + emoji);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check content for violations
    const contentCheck = checkContentViolations(value);
    if (contentCheck.isViolation) {
      setModerationMessage(getKindnessMessage(contentCheck.violationType));
      setShowKindnessReminder(true);
      return;
    }
    
    // Attach sticker data to the event
    const customEvent = e as CustomFormEvent;
    if (selectedSticker) {
      customEvent.sticker = selectedSticker;
    }
    
    // If no violations, proceed with submission
    await onSubmit(customEvent);
    
    // Clear selected sticker after submission
    setSelectedSticker(null);
  };

  const handleEditComment = () => {
    setShowKindnessReminder(false);
  };

  const handleIgnoreWarning = async () => {
    setShowKindnessReminder(false);
    // Create a synthetic event to pass to onSubmit
    const syntheticEvent = {
      preventDefault: () => {},
      sticker: selectedSticker || undefined,
    } as CustomFormEvent;
    await onSubmit(syntheticEvent);
    
    // Clear selected sticker after submission
    setSelectedSticker(null);
  };

  const handleStickerSelect = (sticker: StickerType) => {
    setSelectedSticker(sticker);
    setShowStickerPicker(false);
  };

  return (
    <div>
      <CommentKindnessReminder
        isVisible={showKindnessReminder}
        message={moderationMessage}
        onEdit={handleEditComment}
        onIgnore={handleIgnoreWarning}
      />
      
      {selectedSticker && (
        <div className="mb-2 flex items-center">
          <div className="bg-gray-100 rounded-md px-2 py-1 flex items-center">
            <img 
              src={selectedSticker.url} 
              alt={selectedSticker.name} 
              className="w-6 h-6 mr-1"
              data-id={selectedSticker.id}
            />
            <span className="text-sm text-gray-600">{selectedSticker.name}</span>
            <button
              type="button"
              className="ml-1 text-gray-400 hover:text-gray-600"
              onClick={() => setSelectedSticker(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleFormSubmit} className="flex items-start space-x-2">
        <div className="flex-grow relative">
          <MentionTextarea
            communityId={communityId}
            value={value}
            setValue={onChange}
            placeholder={selectedSticker ? "Add a message with your sticker..." : placeholder}
            className="w-full p-2.5 border rounded-lg text-sm resize-none bg-white text-black border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 pr-10 placeholder-gray-500"
            rows={1}
          />
          <div className="absolute top-1/2 right-2.5 transform -translate-y-1/2 z-10 flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              title="Add sticker"
            >
              <Sticker size={16} />
            </button>
            <EmojiPicker
              onEmojiSelect={handleEmojiInsert}
            />
          </div>
        </div>
        <button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm flex items-center justify-center disabled:opacity-60 h-[40px]"
          disabled={isSubmitting || (!(typeof value === 'string' && value.trim()) && !selectedSticker)}
          title="Submit comment"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
      
      {showStickerPicker && (
        <div className="relative z-50 mt-2">
          <StickerPicker
            onSelectSticker={handleStickerSelect}
            onClose={() => setShowStickerPicker(false)}
            stickerPacks={[
              {
                id: 'basic',
                name: 'Basic',
                stickers: [
                  {
                    id: 'thumbs-up',
                    name: 'Thumbs Up',
                    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44d.png'
                  },
                  {
                    id: 'heart',
                    name: 'Heart',
                    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2764.png'
                  },
                  {
                    id: 'laughing',
                    name: 'Laughing',
                    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f602.png'
                  },
                  {
                    id: 'clap',
                    name: 'Clapping',
                    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44f.png'
                  }
                ]
              },
              {
                id: 'coast',
                name: 'Coastline',
                stickers: [
                  {
                    id: 'wave',
                    name: 'Wave',
                    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f30a.png'
                  },
                  {
                    id: 'beach',
                    name: 'Beach',
                    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3d6.png'
                  },
                  {
                    id: 'sailboat',
                    name: 'Sailboat',
                    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26f5.png'
                  },
                  {
                    id: 'fish',
                    name: 'Fish',
                    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f41f.png'
                  }
                ]
              },
              {
                id: 'reactions',
                name: 'Reactions',
                stickers: [
                  {
                    id: 'love',
                    name: 'Love',
                    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f60d.png'
                  },
                  {
                    id: 'wow',
                    name: 'Wow',
                    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f62e.png'
                  },
                  {
                    id: 'angry',
                    name: 'Angry',
                    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f620.png'
                  },
                  {
                    id: 'lol',
                    name: 'LOL',
                    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f923.png'
                  }
                ]
              }
            ]}
          />
        </div>
      )}
    </div>
  );
} 