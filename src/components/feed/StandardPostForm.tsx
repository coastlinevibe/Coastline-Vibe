import React from 'react';
import { useForm } from 'react-hook-form';
import EmojiPicker from '@/components/shared/EmojiPicker';
import PoliteRewriter from './PoliteRewriter';

export interface StandardPostFormValues {
  content: string;
}

export default function StandardPostForm({ onSubmit }: { onSubmit: (values: StandardPostFormValues) => Promise<void>; }) {
  const { register, handleSubmit, reset, formState: { isSubmitting }, setValue, watch } = useForm<StandardPostFormValues>({
    defaultValues: { content: '' }
  });

  const content = watch('content');

  const submitHandler = async (values: StandardPostFormValues) => {
    await onSubmit(values);
    reset();
  };

  const insertEmoji = (emoji: string) => {
    setValue('content', content + emoji);
  };

  const handleRewrite = (rewrittenText: string) => {
    // Replace the content with the rewritten version
    setValue('content', rewrittenText);
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit(submitHandler)}>
      <label className="block text-slate-700 font-semibold mb-1">Create Post</label>
      <div className="relative mb-2">
        <textarea 
          {...register('content', { required: true })} 
          className="w-full border border-slate-300 rounded px-3 py-2" 
          placeholder="What's on your mind...?" 
          rows={3} 
          disabled={isSubmitting} 
        />
        <div className="absolute right-2 bottom-2">
          <EmojiPicker onEmojiSelect={(emoji) => insertEmoji(emoji)} />
        </div>
      </div>
      
      {/* Add Polite Rewriter */}
      <div className="mb-3">
        <PoliteRewriter
          originalText={content} 
          onRewritten={handleRewrite}
          disabled={isSubmitting || !content.trim()}
        />
      </div>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={isSubmitting}>Post</button>
    </form>
  );
} 