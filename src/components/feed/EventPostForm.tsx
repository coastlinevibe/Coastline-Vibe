import React from 'react';
import { useForm } from 'react-hook-form';
import EmojiPicker from '@/components/shared/EmojiPicker';

export interface EventPostFormValues {
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
}

export default function EventPostForm({ onSubmit }: { onSubmit: (values: EventPostFormValues) => Promise<void>; }) {
  const { register, handleSubmit, reset, formState: { isSubmitting }, setValue, watch } = useForm<EventPostFormValues>({
    defaultValues: { name: '', description: '', date: '', time: '', location: '' }
  });

  const name = watch('name');
  const description = watch('description');
  const location = watch('location');

  const submitHandler = async (values: EventPostFormValues) => {
    await onSubmit(values);
    reset();
  };

  const insertEmoji = (field: 'name' | 'description' | 'location', emoji: string) => {
    const currentValue = field === 'name' ? name : field === 'description' ? description : location;
    setValue(field, currentValue + emoji);
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit(submitHandler)}>
      <label className="block text-slate-700 font-semibold mb-1">Event</label>
      <div className="relative mb-2">
        <input 
          {...register('name', { required: true })} 
          type="text" 
          className="w-full border border-slate-300 rounded px-3 py-2" 
          placeholder="Event Name" 
          disabled={isSubmitting} 
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <EmojiPicker onEmojiSelect={(emoji) => insertEmoji('name', emoji)} />
        </div>
      </div>
      <div className="relative mb-2">
        <textarea 
          {...register('description', { required: true })} 
          className="w-full border border-slate-300 rounded px-3 py-2" 
          placeholder="Event Description" 
          rows={2} 
          disabled={isSubmitting} 
        />
        <div className="absolute right-2 bottom-2">
          <EmojiPicker onEmojiSelect={(emoji) => insertEmoji('description', emoji)} />
        </div>
      </div>
      <input {...register('date', { required: true })} type="date" className="w-full border border-slate-300 rounded px-3 py-2 mb-2" disabled={isSubmitting} />
      <input {...register('time', { required: true })} type="time" className="w-full border border-slate-300 rounded px-3 py-2 mb-2" disabled={isSubmitting} />
      <div className="relative mb-2">
        <input 
          {...register('location', { required: true })} 
          type="text" 
          className="w-full border border-slate-300 rounded px-3 py-2" 
          placeholder="Location" 
          disabled={isSubmitting} 
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <EmojiPicker onEmojiSelect={(emoji) => insertEmoji('location', emoji)} />
        </div>
      </div>
      <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded" disabled={isSubmitting}>Post</button>
    </form>
  );
} 