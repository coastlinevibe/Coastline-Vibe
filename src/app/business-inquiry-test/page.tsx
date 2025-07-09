"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import BusinessInquiryInbox from '../../components/shared/BusinessInquiryInbox';

export default function BusinessInquiryTest() {
  const [businessId, setBusinessId] = useState('');
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-cyan-900">Business Inquiry Inbox Test</h1>
        
        <div className="mb-6 p-4 bg-white rounded shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Business ID to Test:
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={businessId} 
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="Enter business ID" 
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Using ID: {businessId || '12345-test-id'} (default used if empty)
          </p>
        </div>
        
        {/* Directly use the BusinessInquiryInbox component */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-cyan-900 mb-4">Business Inquiry Inbox</h2>
          <BusinessInquiryInbox businessId={businessId || '12345-test-id'} />
        </div>
      </div>
    </div>
  );
} 