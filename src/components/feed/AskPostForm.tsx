import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import EmojiPicker from '@/components/shared/EmojiPicker';
import PoliteRewriter from './PoliteRewriter';
import ContentSuggestions from './ContentSuggestions';
import KindnessReminder from './KindnessReminder';

export interface AskPostFormValues {
  title: string;
  content: string;
}

export default function AskPostForm({ onSubmit }: { onSubmit: (values: AskPostFormValues) => Promise<void>; }) {
  const { register, handleSubmit, reset, formState: { isSubmitting }, setValue, watch } = useForm<AskPostFormValues>({
    defaultValues: { title: '', content: '' }
  });

  const title = watch('title');
  const content = watch('content');
  
  // Add state to track if AI features are actively processing
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const submitHandler = async (values: AskPostFormValues) => {
    await onSubmit(values);
    reset();
  };

  const insertEmoji = (field: 'title' | 'content', emoji: string) => {
    const currentValue = field === 'title' ? title : content;
    setValue(field, currentValue + emoji);
  };
  
  // Handle polite rewriting
  const handleRewriteTitle = (rewrittenText: string) => {
    setValue('title', rewrittenText);
  };
  
  const handleRewriteContent = (rewrittenText: string) => {
    setValue('content', rewrittenText);
  };
  
  // Handle content suggestions
  const handleSelectSuggestion = (suggestion: string) => {
    setValue('content', suggestion);
  };
  
  // Handle kindness reminders
  const handleContentChange = (newContent: string) => {
    setValue('content', newContent);
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit(submitHandler)}>
      <label className="block text-slate-700 font-semibold mb-1">Ask a Question</label>
      
      {/* Kindness reminder will appear if needed */}
      <KindnessReminder 
        content={content} 
        onContentChange={handleContentChange} 
        disabled={isSubmitting || isAiProcessing}
      />
      
      <div className="relative mb-2">
        <input 
          {...register('title', { required: true })} 
          type="text" 
          className="w-full border border-slate-300 rounded px-3 py-2" 
          placeholder="What's on your mind…?" 
          disabled={isSubmitting || isAiProcessing} 
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          <PoliteRewriter
            originalText={title}
            onRewritten={handleRewriteTitle}
            disabled={isSubmitting || isAiProcessing}
          />
          <div className="mx-2">|</div>
          <EmojiPicker onEmojiSelect={(emoji) => insertEmoji('title', emoji)} />
        </div>
      </div>
      
      <div className="relative mb-2">
        <textarea 
          {...register('content', { required: true })} 
          className="w-full border border-slate-300 rounded px-3 py-2" 
          placeholder="Your question..." 
          rows={3} 
          disabled={isSubmitting || isAiProcessing} 
        />
        <div className="absolute right-2 bottom-2 flex items-center">
          <PoliteRewriter
            originalText={content}
            onRewritten={handleRewriteContent}
            disabled={isSubmitting || isAiProcessing}
          />
          <div className="mx-2">|</div>
          <EmojiPicker onEmojiSelect={(emoji) => insertEmoji('content', emoji)} />
        </div>
      </div>
      
      {/* Content suggestions */}
      <div className="mb-2">
        <ContentSuggestions
          inputText={content}
          onSelectSuggestion={handleSelectSuggestion}
          disabled={isSubmitting || isAiProcessing}
        />
      </div>
      
      <button 
        type="submit" 
        className="bg-cyan-600 text-white px-4 py-2 rounded" 
        disabled={isSubmitting || isAiProcessing}
      >
        Post
      </button>
    </form>
  );
} 