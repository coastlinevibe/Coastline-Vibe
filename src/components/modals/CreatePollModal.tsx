'use client';

import React, { useEffect } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { X, PlusCircle, Trash2 } from 'lucide-react';
import { type Database } from '@/types/supabase';

export interface PollFormValues {
  question: string;
  options: { text: string }[];
}

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PollFormValues) => Promise<void>;
  communityId: string; // To display which community the poll is for
  isSubmitting: boolean;
}

const CreatePollModal: React.FC<CreatePollModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  communityId,
  isSubmitting
}) => {
  const { 
    register, 
    control, 
    handleSubmit, 
    reset,
    formState: { errors, isValid },
    watch
  } = useForm<PollFormValues>({
    defaultValues: {
      question: '',
      options: [{ text: '' }, { text: '' }], // Start with 2 options
    },
    mode: 'onChange', // Validate on change for better UX
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
    rules: {
      minLength: 2,
      maxLength: 5,
    }
  });

  // Reset form when modal is closed/opened
  useEffect(() => {
    if (!isOpen) {
      reset({
        question: '',
        options: [{ text: '' }, { text: '' }],
      });
    }
  }, [isOpen, reset]);
  
  const watchedOptions = watch('options');

  const handleFormSubmit: SubmitHandler<PollFormValues> = async (data) => {
    // Filter out empty options before submitting, though validation should catch this
    const validData = {
      ...data,
      options: data.options.filter(opt => opt.text.trim() !== ''),
    };
    if (validData.options.length < 2) {
      // This should ideally be caught by form validation but as a safeguard
      alert("Please provide at least two options for the poll.");
      return;
    }
    await onSubmit(validData);
    // onSubmit should handle closing the modal on success
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close on overlay click
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-sky-700">Create a Poll</h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-1">
          Community: <span className="font-medium text-sky-600">{communityId}</span>
        </p>
        <p className="text-xs text-slate-500 mb-6">
          You can add up to 5 options. Each user may vote only once.
        </p>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div>
            <label htmlFor="poll-question" className="block text-sm font-medium text-slate-700 mb-1">
              Poll Question
            </label>
            <textarea
              id="poll-question"
              {...register('question', { required: 'Poll question is required.' })}
              rows={3}
              className={`w-full p-3 border rounded-lg shadow-sm transition-colors
                          ${errors.question ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500'}`}
              placeholder="e.g., What's the best time for the weekly sync?"
              disabled={isSubmitting}
            />
            {errors.question && <p className="text-xs text-red-600 mt-1">{errors.question.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Poll Options (min 2, max 5)
            </label>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <input
                    {...register(`options.${index}.text` as const, { 
                      required: 'Option text cannot be empty.',
                      validate: (value, formValues) => {
                        // Ensure at least two non-empty options if we are trying to submit
                        // This specific validation might be better handled at the form level onSubmit
                        // or by checking overall form validity.
                        // For individual field, just 'required' is usually enough.
                        return value.trim() !== '' || 'Option text cannot be empty.';
                      }
                    })}
                    className={`flex-grow p-3 border rounded-lg shadow-sm transition-colors
                                ${errors.options?.[index]?.text ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500'}`}
                    placeholder={`Option ${index + 1}`}
                    disabled={isSubmitting}
                  />
                  {fields.length > 2 && (
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                      aria-label="Remove option"
                      disabled={isSubmitting}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
             {errors.options && errors.options.root && ( // For minLength/maxLength errors on the array itself
                <p className="text-xs text-red-600 mt-1">{errors.options.root.message}</p>
             )}
             {fields.length < 2 && ( // Custom message if somehow below 2 (should be handled by minLength rule too)
                <p className="text-xs text-red-600 mt-1">At least 2 options are required.</p>
             )}


            {fields.length < 5 && (
              <button
                type="button"
                onClick={() => append({ text: '' })}
                className="mt-3 text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center transition-colors disabled:opacity-60"
                disabled={isSubmitting || fields.length >= 5}
              >
                <PlusCircle size={18} className="mr-1.5" />
                Add Option
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-150 ease-in-out disabled:opacity-60"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={!isValid || isSubmitting || watchedOptions.filter(opt => opt.text.trim() !== '').length < 2}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : "Create Poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePollModal; 