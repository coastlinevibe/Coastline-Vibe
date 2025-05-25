import React from 'react';
import { useForm } from 'react-hook-form';
import EmojiPicker from '@/components/shared/EmojiPicker';

export interface AnnouncePostFormValues {
  title: string;
  content: string;
}

export default function AnnouncePostForm({ onSubmit }: { onSubmit: (values: AnnouncePostFormValues) => Promise<void>; }) {
  const { register, handleSubmit, reset, formState: { isSubmitting }, setValue, watch } = useForm<AnnouncePostFormValues>({
    defaultValues: { title: '', content: '' }
  });

  const title = watch('title');
  const content = watch('content');

  const submitHandler = async (values: AnnouncePostFormValues) => {
    await onSubmit(values);
    reset();
  };

  const insertEmoji = (field: 'title' | 'content', emoji: string) => {
    const currentValue = field === 'title' ? title : content;
    setValue(field, currentValue + emoji);
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit(submitHandler)}>
      <label className="block text-slate-700 font-semibold mb-1">Announcement</label>
      <div className="relative mb-2">
        <input 
          {...register('title', { required: true })} 
          type="text" 
          className="w-full border border-slate-300 rounded px-3 py-2" 
          placeholder="Heading" 
          disabled={isSubmitting} 
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <EmojiPicker onEmojiSelect={(emoji) => insertEmoji('title', emoji)} />
        </div>
      </div>
      <div className="relative mb-2">
        <textarea 
          {...register('content', { required: true })} 
          className="w-full border border-slate-300 rounded px-3 py-2" 
          placeholder="Announcement content..." 
          rows={3} 
          disabled={isSubmitting} 
        />
        <div className="absolute right-2 bottom-2">
          <EmojiPicker onEmojiSelect={(emoji) => insertEmoji('content', emoji)} />
        </div>
      </div>
      <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded" disabled={isSubmitting}>Post</button>
    </form>
  );
} 