"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import BusinessInquiryForm from '../../components/shared/BusinessInquiryForm';
import BusinessInquiryInbox from '../../components/shared/BusinessInquiryInbox';
// We're using custom tabs instead of shadcn UI tabs

export default function BusinessInquiryCompleteTest() {
  const [businessId, setBusinessId] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [activeTab, setActiveTab] = useState('send');
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const handleSuccess = () => {
    // Switch to inbox tab when inquiry is successfully sent
    setActiveTab('inbox');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-cyan-900">Business Inquiry System Test</h1>
        
        <div className="mb-6 p-4 bg-white rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Test Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Tabs */}
          <div className="border-b px-6 py-2">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('send')}
                className={`py-2 px-1 font-medium text-sm border-b-2 ${
                  activeTab === 'send' 
                    ? 'border-cyan-500 text-cyan-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Send Inquiry
              </button>
              <button
                onClick={() => setActiveTab('inbox')}
                className={`py-2 px-1 font-medium text-sm border-b-2 ${
                  activeTab === 'inbox' 
                    ? 'border-cyan-500 text-cyan-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                View Inbox
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'send' && (
              <div>
                <h2 className="text-xl font-semibold text-cyan-900 mb-4">Test: Send Business Inquiry</h2>
                <BusinessInquiryForm 
                  businessId={businessId || '12345-test-id'}
                  businessName="Test Business"
                  communityId={communityId || '12345-test-community-id'}
                  onSuccess={handleSuccess}
                />
              </div>
            )}
            
            {activeTab === 'inbox' && (
              <div>
                <h2 className="text-xl font-semibold text-cyan-900 mb-4">Test: Business Inquiry Inbox</h2>
                <BusinessInquiryInbox 
                  businessId={businessId || '12345-test-id'}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
          <h3 className="font-medium text-gray-700 mb-2">How to use this test page:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Enter a business ID (or use the default)</li>
            <li>First, use the "Send Inquiry" tab to submit test inquiries</li>
            <li>Then, switch to the "View Inbox" tab to see and manage the inquiries</li>
            <li>Inquiries are stored in the real database and will persist between sessions</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 