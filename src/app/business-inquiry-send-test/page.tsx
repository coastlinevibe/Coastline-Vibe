"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import BusinessInquiryForm from '../../components/shared/BusinessInquiryForm';

export default function BusinessInquirySendTest() {
  const [businessId, setBusinessId] = useState('');
  const [communityId, setCommunityId] = useState('');
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-cyan-900">Send Business Inquiry Test</h1>
        
        <div className="mb-6 p-4 bg-white rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Test Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business ID:
              </label>
              <input 
                type="text" 
                value={businessId} 
                onChange={(e) => setBusinessId(e.target.value)}
                placeholder="Enter business ID" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Using ID: {businessId || '12345-test-id'} (default used if empty)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Community ID:
              </label>
              <input 
                type="text" 
                value={communityId} 
                onChange={(e) => setCommunityId(e.target.value)}
                placeholder="Enter community ID" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Using ID: {communityId || '12345-test-community-id'} (default used if empty)
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-cyan-900 mb-4">Send Inquiry Form</h2>
          <BusinessInquiryForm 
            businessId={businessId || '12345-test-id'}
            businessName="Test Business"
            communityId={communityId || '12345-test-community-id'}
          />
        </div>
      </div>
    </div>
  );
} 