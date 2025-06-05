'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { useState } from 'react';

const formSchema = z.object({
  address_line1: z.string().min(5, "Address line 1 must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  postal_code: z.string().min(3, "Postal code must be at least 3 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  images: z.instanceof(FileList).optional(),
  document: z.instanceof(FileList).optional(),
});

type VerificationFormValues = z.infer<typeof formSchema>;

interface LocationVerificationFormProps {
  userId: string;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

export default function LocationVerificationForm({
  userId,
  onSubmitSuccess,
  onCancel,
}: LocationVerificationFormProps) {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address_line1: '',
      city: '',
      postal_code: '',
      country: '',
    },
  });

  const handleSubmit = async (values: VerificationFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    console.log("Selected images:", values.images);
    console.log("Selected document:", values.document);

    try {
      const { error } = await supabase.from('verification_requests').insert([
        {
          user_id: userId,
          address_line1: values.address_line1,
          city: values.city,
          postal_code: values.postal_code,
          country: values.country,
          status: 'pending', // default status
        },
      ]);

      if (error) throw error;

      onSubmitSuccess(); // Notify parent component
    } catch (error: any) {
      console.error('Error submitting verification request:', error);
      setSubmitError(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-semibold text-cyan-800 mb-6">Verify Your Location</h2>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700">Address Line 1</label>
            <input 
              id="address_line1"
              {...form.register('address_line1')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            />
            {form.formState.errors.address_line1 && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.address_line1.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
            <input 
              id="city"
              {...form.register('city')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            />
            {form.formState.errors.city && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.city.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">Postal Code</label>
            <input 
              id="postal_code"
              {...form.register('postal_code')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            />
            {form.formState.errors.postal_code && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.postal_code.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
            <input 
              id="country"
              {...form.register('country')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            />
            {form.formState.errors.country && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.country.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700">Proof Images (e.g., utility bill, lease agreement)</label>
            <input 
              type="file"
              id="images"
              {...form.register('images')}
              multiple
              accept="image/png, image/jpeg, image/webp"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
            />
          </div>

          {/* Document Upload */}
          <div>
            <label htmlFor="document" className="block text-sm font-medium text-gray-700">Supporting Document (Optional)</label>
            <input 
              type="file"
              id="document"
              {...form.register('document')}
              accept=".pdf,.doc,.docx,.txt"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{submitError}</p>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button 
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 