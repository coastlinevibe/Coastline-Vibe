"use client";

import { useState, useEffect } from "react";

export default function BusinessViewPage() {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the business data from our API route
    fetch('/api/business')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch business data');
        }
        return response.json();
      })
      .then(data => {
        setLoading(false);
        setBusiness(data.business);
      })
      .catch(err => {
        setLoading(false);
        setError(err.message);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading business data...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <h2 className="text-xl mb-4">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!business) {
    return <div className="p-8 text-center">No business data found.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Business Details</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-2">{business.name || business.title}</h2>
        <p className="text-gray-600 mb-6">{business.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-medium text-lg mb-2">Contact Information</h3>
            <p><span className="font-medium">Email:</span> {business.email}</p>
            <p><span className="font-medium">Phone:</span> {business.phone}</p>
            <p><span className="font-medium">Website:</span> {business.website || 'N/A'}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-2">Location</h3>
            <p><span className="font-medium">Address:</span> {business.address || 'N/A'}</p>
            <p><span className="font-medium">City:</span> {business.city || 'N/A'}</p>
            <p><span className="font-medium">Country:</span> {business.country || 'N/A'}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium text-lg mb-2">Categories</h3>
          <p><span className="font-medium">Category:</span> {business.category?.name || 'N/A'}</p>
          <p><span className="font-medium">Subcategory:</span> {business.subcategory?.name || 'N/A'}</p>
        </div>
        
        <div className="text-sm text-gray-500">
          <p><span className="font-medium">Business ID:</span> {business.id}</p>
          <p><span className="font-medium">Community ID:</span> {business.community_id}</p>
        </div>
      </div>
      
      <div className="mt-6">
        <a 
          href="/"
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
} 