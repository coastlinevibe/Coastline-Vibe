"use client";

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, Loader2 } from 'lucide-react';

// Define form schema using Zod
const inquiryFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  subject: z.string().min(2, { message: 'Subject is required' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' })
});

type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

interface BusinessInquiryFormProps {
  businessId: string;
  businessName: string;
  communityId?: string;
  onSuccess?: () => void;
}

const BusinessInquiryForm: React.FC<BusinessInquiryFormProps> = ({ 
  businessId, 
  businessName, 
  communityId,
  onSuccess
}) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    }
  });

  const onSubmit = async (data: InquiryFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare inquiry data
      const inquiryData = {
        business_id: businessId,
        user_id: user?.id || null,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        community_id: communityId || null,
        status: 'unread'
      };
      
      // Insert into database
      const { error } = await supabase
        .from('business_inquiries')
        .insert([inquiryData]);
      
      if (error) throw error;
      
      // Success!
      setSubmitSuccess(true);
      reset();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
      
    } catch (err: any) {
      console.error('Error submitting inquiry:', err);
      setErrorMessage(err.message || 'An error occurred while submitting your inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-cyan-900 mb-4">Contact {businessName}</h3>
      
      {submitSuccess ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <p className="text-green-800 font-medium">Thank you for your message!</p>
          <p className="text-green-700 text-sm mt-1">Your inquiry has been sent to the business owner.</p>
        </div>
      ) : (
        <p className="text-gray-600 mb-4">
          Have a question or want to know more? Fill out the form below to contact the business owner directly.
        </p>
      )}
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            placeholder="john@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (optional)
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            placeholder="(123) 456-7890"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            {...register('subject')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            placeholder="I have a question about..."
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            {...register('message')}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            placeholder="Please provide details about your inquiry..."
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
          )}
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Sending...
              </>
            ) : (
              <>
                <Send className="-ml-1 mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Your contact information will only be used to respond to your inquiry and will not be shared with third parties.
        </p>
      </form>
    </div>
  );
};

export default BusinessInquiryForm; 