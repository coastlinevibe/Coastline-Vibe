import React from 'react';
import { useForm } from 'react-hook-form';

export interface PollPostFormValues {
  question: string;
  option1: string;
  option2: string;
}

export default function PollPostForm({ onSubmit }: { onSubmit: (values: PollPostFormValues) => Promise<void>; }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<PollPostFormValues>({
    defaultValues: { question: '', option1: '', option2: '' }
  });

  const submitHandler = async (values: PollPostFormValues) => {
    await onSubmit(values);
    reset();
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit(submitHandler)}>
      <label className="block text-slate-700 font-semibold mb-1">Poll</label>
      <input {...register('question', { required: true })} type="text" className="w-full border border-slate-300 rounded px-3 py-2 mb-2" placeholder="Poll question..." disabled={isSubmitting} />
      <input {...register('option1', { required: true })} type="text" className="w-full border border-slate-300 rounded px-3 py-2 mb-2" placeholder="Option 1" disabled={isSubmitting} />
      <input {...register('option2', { required: true })} type="text" className="w-full border border-slate-300 rounded px-3 py-2 mb-2" placeholder="Option 2" disabled={isSubmitting} />
      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={isSubmitting}>Post</button>
    </form>
  );
} 