"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BusinessAnalyticsDashboard from '@/components/shared/BusinessAnalyticsDashboard';
import { ChevronRight, Building2, MessageSquare, Settings, Star, Shield } from 'lucide-react';
import Link from 'next/link';

// Add a type for Business
interface Business {
  id: string;
  name: string;
  description?: string;
  address?: string;
  category?: string;
  rating?: number;
  inquiries_count?: number;
  is_verified?: boolean;
}

export default function BusinessDashboardPage() {
  const params = useParams();
  const communityId = params?.communityId as string;
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserBusinesses() {
      setLoading(true);
      const supabase = createClient();
      
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error fetching user:', userError);
          setLoading(false);
          return;
        }
        
        if (!user) {
          console.log('No user logged in');
          setLoading(false);
          return;
        }
        
        // Get businesses owned by this user in this community
        const { data: userBusinesses, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('community_id', communityId)
          .eq('user_id', user.id);
          
        if (businessError) {
          console.error('Error fetching businesses:', businessError);
        } else {
          console.log('User businesses:', userBusinesses);
          setBusinesses(userBusinesses || []);
          
          // Select the first business by default
          if (userBusinesses && userBusinesses.length > 0) {
            setSelectedBusiness(userBusinesses[0].id);
          }
        }
      } catch (error) {
        console.error('Error in fetchUserBusinesses:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserBusinesses();
  }, [communityId]);

  // For demo purposes, if no businesses found, create a mock business
  useEffect(() => {
    if (!loading && businesses.length === 0) {
      // Create mock business for demo
      const mockBusiness = {
        id: 'mock-business-id',
        name: 'Your Business Name',
        description: 'This is a demo business dashboard. In a real account, you would see your actual business data here.',
        address: '123 Business St, Miami, FL',
        category: 'Restaurant',
        rating: 4.5,
        inquiries_count: 12,
        is_verified: true
      };
      
      setBusinesses([mockBusiness]);
      setSelectedBusiness(mockBusiness.id);
    }
  }, [loading, businesses]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link href={`/community/${communityId}/mini-dash`} className="hover:text-teal-600">
          Home
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-700">Business Dashboard</span>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Businesses</h2>
            
            {businesses.length > 0 ? (
              <div className="space-y-3">
                {businesses.map(business => (
                  <button
                    key={business.id}
                    onClick={() => setSelectedBusiness(business.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center ${
                      selectedBusiness === business.id 
                        ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="h-5 w-5 mr-3 text-teal-600" />
                    <div>
                      <p className="font-medium">{business.name}</p>
                      <p className="text-xs text-gray-500">{business.category || 'Business'}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">You don't have any businesses yet.</p>
                <Link 
                  href={`/community/${communityId}/business/create`}
                  className="mt-3 inline-block px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                >
                  Create Business
                </Link>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Links</h2>
            <nav className="space-y-2">
              <Link 
                href={`/community/${communityId}/business/directory`}
                className="flex items-center p-2 text-gray-700 rounded hover:bg-gray-100"
              >
                <Building2 className="h-5 w-5 mr-3 text-teal-600" />
                Business Directory
              </Link>
              <Link 
                href={`/community/${communityId}/business/dashboard/review-moderation`}
                className="flex items-center p-2 text-gray-700 rounded hover:bg-gray-100"
              >
                <Shield className="h-5 w-5 mr-3 text-teal-600" />
                Review Moderation
              </Link>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:w-3/4">
          {selectedBusiness ? (
            <Tabs defaultValue="analytics" className="w-full">
              <TabsList className="grid grid-cols-4 mb-8">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="analytics" className="mt-0">
                <BusinessAnalyticsDashboard businessId={selectedBusiness} />
              </TabsContent>
              
              <TabsContent value="inquiries" className="mt-0">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Business Inquiries</h2>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                      {businesses.find(b => b.id === selectedBusiness)?.inquiries_count || 0} Total
                    </span>
                  </div>
                  
                  <div className="text-center py-16 text-gray-500">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Inquiries feature is coming soon.</p>
                    <p className="text-sm mt-2">You'll be able to manage all customer inquiries here.</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-0">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Customer Reviews</h2>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 mr-1" />
                      <span className="font-medium">{businesses.find(b => b.id === selectedBusiness)?.rating || 0}</span>
                    </div>
                  </div>
                  
                  <div className="text-center py-16 text-gray-500">
                    <Star className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Reviews feature is coming soon.</p>
                    <p className="text-sm mt-2">You'll be able to manage and respond to customer reviews here.</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="mt-0">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Business Settings</h2>
                    <div>
                      <Link 
                        href={`/community/${communityId}/business/edit/${selectedBusiness}`}
                        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                      >
                        Edit Business
                      </Link>
                    </div>
                  </div>
                  
                  <div className="text-center py-16 text-gray-500">
                    <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Advanced settings feature is coming soon.</p>
                    <p className="text-sm mt-2">You'll be able to manage all aspects of your business here.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Business Selected</h3>
              <p className="text-gray-500 mb-6">Select a business from the sidebar or create a new one.</p>
              <Link 
                href={`/community/${communityId}/business/create`}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                Create Business
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 