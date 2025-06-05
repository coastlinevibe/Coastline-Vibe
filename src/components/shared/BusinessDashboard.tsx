"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import BusinessMultiStepForm from './BusinessMultiStepForm';

// Import shadcn ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, CartesianGrid, Tooltip } from 'recharts';

// Plan badge colors
const PLAN_COLORS: Record<string, string> = {
  Free: 'bg-gray-200 text-gray-800',
  Pro: 'bg-yellow-200 text-yellow-800',
  Elite: 'bg-purple-200 text-purple-800',
};

const BusinessDashboard: React.FC = () => {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [business, setBusiness] = useState<any>(null);
  const [analytics, setAnalytics] = useState({
    views: 0,
    clicks: 0,
    bookingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState('Free');

  // Access control & fetch business
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('authUser:', user);
        if (!user) {
          router.push('/login');
          return;
        }
        console.log('user.id:', user.id, typeof user.id);
        // Get user role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_approved')
          .eq('id', user.id)
          .maybeSingle();
        console.log('profile fetch result:', { data: profile, error: profileError });
        if (profile?.role !== 'business') {
          router.push('/');
          return;
        }
        setUserRole(profile.role);
        setCurrentPlan(profile && (profile as any).plan ? (profile as any).plan : 'Free');
        // Get business
        console.log("Fetching business for user_id:", user.id);
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });  // Get the most recent one first
        
        console.log("Business fetch result:", { data: businessData, error: businessError });
        
        if (businessError) {
          console.error("Error fetching business:", businessError);
          throw businessError;
        }
        
        if (!businessData || businessData.length === 0) {
          console.log("No business found for user_id:", user.id);
          setBusiness({...profile, is_approved: profile.is_approved});
          setLoading(false);
          return;
        }
        
        // Use the first business if multiple exist
        const firstBusiness = businessData[0];
        console.log("Using business data:", firstBusiness);
        
        // Make sure the business data has the is_approved field
        firstBusiness.is_approved = profile.is_approved;
        
        // Look up category and subcategory names if needed
        if (firstBusiness.category_id && !firstBusiness.category) {
          try {
            const { data: categoryData } = await supabase
              .from('categories')
              .select('name')
              .eq('id', firstBusiness.category_id)
              .single();
            
            if (categoryData) {
              firstBusiness.category = categoryData.name;
            }
          } catch (err) {
            console.error("Error fetching category name:", err);
          }
        }
        
        if (firstBusiness.subcategory_id && !firstBusiness.subcategory) {
          try {
            const { data: subcategoryData } = await supabase
              .from('subcategories')
              .select('name')
              .eq('id', firstBusiness.subcategory_id)
              .single();
            
            if (subcategoryData) {
              firstBusiness.subcategory = [subcategoryData.name];
            }
          } catch (err) {
            console.error("Error fetching subcategory name:", err);
          }
        }
        
        setBusiness(firstBusiness);
        // Analytics (mock views/clicks, real booking requests)
        const { data: appointments } = await supabase
          .from('appointments')
          .select('id')
          .eq('business_id', firstBusiness.id);
        setAnalytics({
          views: Math.floor(Math.random() * 1000),
          clicks: Math.floor(Math.random() * 100),
          bookingRequests: appointments?.length || 0,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Mock data for the chart
  const chartData = [
    { date: '2023-10-01', views: 150 },
    { date: '2023-10-02', views: 200 },
    { date: '2023-10-03', views: 180 },
    { date: '2023-10-04', views: 250 },
    { date: '2023-10-05', views: 220 },
    { date: '2023-10-06', views: 280 },
    { date: '2023-10-07', views: 240 },
  ];

  const chartConfig = {
    views: {
      label: 'Profile Views',
      color: 'hsl(var(--chart-1))',
    },
    date: {
      label: 'Date',
    },
  };

  // AI Description (mock)
  const handleGenerateDescription = async () => {
    if (!business) return;
    setAiLoading(true);
    setTimeout(() => {
      setAiDescription(
        `Welcome to ${business.name}, your trusted ${business.category} in ${business.city}. We offer ${business.subcategory?.join(', ')} and more!`
      );
      setAiLoading(false);
    }, 1200);
  };
  const handleInsertDescription = async () => {
    if (!business || !aiDescription) return;
    setLoading(true);
    const { error } = await supabase
      .from('businesses')
      .update({ description: aiDescription })
      .eq('id', business.id);
    if (!error) setBusiness({ ...business, description: aiDescription });
    setLoading(false);
    setAiDescription('');
  };

  // Access control: only business owners
  if (userRole !== 'business') return null;
  if (loading) return <div className="flex items-center justify-center min-h-screen text-cyan-600">Loading...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;

  // Show create form if no business exists
  if (!business) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-cyan-900 mb-6">Create Your Business Profile</h2>
        <button 
          onClick={async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                console.log("Current user ID:", user.id);
                
                // Fetch all businesses to check if any exist
                const { data: allBusinesses } = await supabase
                  .from("businesses")
                  .select("*");
                console.log("All businesses in database:", allBusinesses);

                // Get the user's profile
                const { data: profileData } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", user.id)
                  .single();
                console.log("User profile:", profileData);

                // Try to find the business by user_id
                const { data: userBusiness } = await supabase
                  .from("businesses")
                  .select("*")
                  .eq("user_id", user.id);
                console.log("Businesses with user_id:", userBusiness);

                if (userBusiness && userBusiness.length > 0) {
                  // We found the business but it's not showing up in the dashboard
                  // Let's display it manually
                  const business = userBusiness[0]; // Use the first one if multiple exist
                  
                  // Try to load category and subcategory names
                  if (business.category_id) {
                    try {
                      const { data: categoryData } = await supabase
                        .from('categories')
                        .select('name')
                        .eq('id', business.category_id)
                        .single();
                      
                      if (categoryData) {
                        business.category = categoryData.name;
                      }
                    } catch (err) {
                      console.error("Error fetching category name:", err);
                    }
                  }
                  
                  if (business.subcategory_id) {
                    try {
                      const { data: subcategoryData } = await supabase
                        .from('subcategories')
                        .select('name')
                        .eq('id', business.subcategory_id)
                        .single();
                      
                      if (subcategoryData) {
                        business.subcategory = [subcategoryData.name];
                      }
                    } catch (err) {
                      console.error("Error fetching subcategory name:", err);
                    }
                  }
                  
                  // Make sure the business has the required fields
                  business.is_approved = profileData.is_approved;
                  
                  // Set business data
                  setBusiness(business);
                  alert("Found your business! It should now display.");
                } else if (allBusinesses && allBusinesses.length > 0) {
                  // No business for this user, but there are others in the database
                  // Let's display the first one for debugging purposes
                  const firstBusiness = allBusinesses[0];
                  setBusiness({
                    ...firstBusiness,
                    is_approved: profileData.is_approved,
                    name: firstBusiness.name || firstBusiness.title || "Business Listing"
                  });
                  alert("No business found for your user ID. Displaying the first business in the database for debugging.");
                } else {
                  alert("No business found for your user ID and no businesses in the database.");
                }
              }
            } catch (err) {
              console.error("Error checking business:", err);
              alert("Error checking business: " + (err instanceof Error ? err.message : String(err)));
            }
          }}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Debug: Check for Business
        </button>
        <BusinessMultiStepForm />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* 1. Business Overview Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {business.banner_url && (
          <img src={business.banner_url} alt="Banner" className="w-full h-40 object-cover" />
        )}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6">
          {business.logo_url && (
            <img src={business.logo_url} alt="Logo" className="w-24 h-24 rounded-lg border-2 border-white object-cover -mt-16 md:mt-0" />
          )}
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-2xl font-bold text-cyan-900">{business.name}</h1>
              <span className={`ml-0 md:ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                business.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {business.is_approved ? 'Approved' : 'Pending'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs">
                {business.category || 'Category N/A'}
              </span>
              {business.subcategory && Array.isArray(business.subcategory) && business.subcategory.length > 0 ? (
                business.subcategory.map((sub: string) => (
                  <span key={sub} className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded text-xs">{sub}</span>
                ))
              ) : (
                <span className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded text-xs">Subcategory N/A</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-gray-700">
              <span className="text-cyan-400 mr-1">📍</span>
              <span>{business.address}, {business.city}</span>
            </div>
            <div className="mt-2 text-gray-700">
              {business.website && (
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline mr-4">{business.website}</a>
              )}
              <span>{business.phone}</span> | <span>{business.email}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                // Get the current community slug from URL
                const pathParts = window.location.pathname.split('/');
                const communitySlug = pathParts.find(part => part !== '' && part !== 'community' && !part.includes('business'));
                
                // Navigate to the business detail page which will use the accommodation template
                if (communitySlug && business?.id) {
                  // Navigate in the same tab since it's a view action
                  window.location.href = `/community/${communitySlug}/business/${business.id}`;
                }
              }}
              className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            >
              View Listing
            </button>
            <button
              onClick={() => setShowEditForm(true)}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            >
              Edit Listing
            </button>
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="text-gray-600 mt-2 whitespace-pre-line">{business.description}</div>
        </div>
      </div>

      {/* 2. AI Tools */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-medium text-cyan-900">AI Tools</h2>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <button
            onClick={handleGenerateDescription}
            disabled={aiLoading}
            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiLoading ? 'Generating...' : '✨ Generate Business Description'}
          </button>
          {aiDescription && (
            <div className="flex-1 flex flex-col gap-2">
              <div className="bg-cyan-50 p-3 rounded text-cyan-900">{aiDescription}</div>
              <div className="flex gap-2">
                <button
                  onClick={handleInsertDescription}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >Insert</button>
                <button
                  onClick={() => setAiDescription('')}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Profile Views</h3>
          <p className="text-2xl font-bold text-cyan-900">{analytics.views}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Link Clicks</h3>
          <p className="text-2xl font-bold text-cyan-900">{analytics.clicks}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Booking Requests</h3>
          <p className="text-2xl font-bold text-cyan-900">{analytics.bookingRequests}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-center items-center">
          <span className="text-xs text-gray-400">Analytics summary coming soon</span>
        </div>
      </div>

      {/* 4. Plan & Upgrade */}
      <div className="bg-white p-6 rounded-lg shadow flex flex-col md:flex-row md:items-center gap-4">
        <div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PLAN_COLORS[currentPlan] || PLAN_COLORS['Free']}`}>{currentPlan} Plan</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => router.push('/pricing')}
          className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2"
        >
          Upgrade Plan
        </button>
      </div>

      {/* 5. Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-cyan-900">Edit Business Profile</h2>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>
              <BusinessMultiStepForm />
            </div>
          </div>
        </div>
      )}

      {/* 6. Notifications / Status Center */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-medium text-cyan-900">Notifications / Status Center</h2>
        <div className="text-gray-600 text-sm">
          {/* Placeholder for notifications/status messages */}
          <p>No new notifications.</p>
          {/* Example: <p>Your listing was approved on 2023-10-27.</p> */}
        </div>
      </div>

      {/* 7. Booking Requests List */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-medium text-cyan-900">Recent Booking Requests</h2>
        <div className="space-y-3">
          {/* Fetch and display recent booking requests */}
          {analytics.bookingRequests > 0 ? (
            <p className="text-sm text-gray-700">Displaying latest {Math.min(analytics.bookingRequests, 5)} of {analytics.bookingRequests} requests.</p>
          ) : (
            <p className="text-sm text-gray-500">No booking requests yet.</p>
          )}
          {/* Placeholder for individual booking request items */}
          {/* Example item: */}
          {/*
          <div className="border-b pb-2 last:border-b-0">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-cyan-800">John Doe</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${'bg-yellow-100 text-yellow-800'}`}>Pending</span>
            </div>
            <p className="text-xs text-gray-600">john.doe@example.com | 123-456-7890 | Today 2:00 PM</p>
            <p className="text-xs text-gray-500 mt-1">Message: Looking forward to the appointment!</p>
          </div>
          */}
        </div>
        {analytics.bookingRequests > 5 && (
          <div className="text-right">
            <button className="text-sm text-cyan-600 hover:underline">View All Requests</button>
          </div>
        )}
      </div>

      {/* 8. Customer Reviews Summary */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-medium text-cyan-900">Customer Reviews</h2>
        <div className="space-y-3">
          {/* Fetch and display reviews summary and latest reviews */}
          <div className="flex items-center gap-2">
            {/* Placeholder for average rating */}
            <span className="text-2xl font-bold text-cyan-900">4.5 ★</span>
            <span className="text-sm text-gray-600">(Based on X reviews)</span>
          </div>
          {/* Placeholder for latest reviews */}
          <p className="text-sm text-gray-500">No reviews yet.</p>
          {/* Example review: */}
          {/*
          <div className="border-b pb-2 last:border-b-0 text-sm text-gray-700">
            <div className="font-medium text-cyan-800 mb-1">5 ★ - Great Service!</div>
            <p>"Had a fantastic experience, highly recommend!"</p>
          </div>
          */}
        </div>
        {/* Assume more than 2 reviews for now */}
        <div className="text-right">
          <button className="text-sm text-cyan-600 hover:underline">View All Reviews</button>
        </div>
      </div>

      {/* 9. Analytics Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-medium text-cyan-900">Profile Views Over Time</h2>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} horizontal={true} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              dataKey="views"
              type="monotone"
              stroke="var(--color-views)" // Use CSS variable for color
              strokeWidth={2}
              dot={{ fill: 'var(--color-views)' }}
              activeDot={{ r: 6, fill: 'var(--color-views)', stroke: 'white', strokeWidth: 3 }}
            />
          </LineChart>
        </ChartContainer>
      </div>

      {/* 10. Service Add-ons / Upsells */}
      {currentPlan === 'Free' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-medium text-cyan-900">Boost Your Listing (Free Plan)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Add-on 1 */}
            <div className="border p-4 rounded-md space-y-2">
              <h3 className="font-medium text-cyan-900">Add WhatsApp Booking Button</h3>
              <p className="text-sm text-gray-700">Enable direct booking requests via WhatsApp.</p>
              <button className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-md text-sm hover:bg-yellow-500">Learn More / Activate</button>
            </div>
            {/* Add-on 2 */}
            <div className="border p-4 rounded-md space-y-2">
              <h3 className="font-medium text-cyan-900">Feature in Homepage</h3>
              <p className="text-sm text-gray-700">Get prominent placement on the community homepage.</p>
              <button className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-md text-sm hover:bg-yellow-500">Learn More / Activate</button>
            </div>
            {/* Add-on 3 */}
            <div className="border p-4 rounded-md space-y-2">
              <h3 className="font-medium text-cyan-900">Run Promo Campaign</h3>
              <p className="text-sm text-gray-700">Create targeted promotional campaigns for your business.</p>
              <button className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-md text-sm hover:bg-yellow-500">Learn More / Activate</button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Account & Support Tools */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-medium text-cyan-900">Account & Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Support Button */}
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Request Help</button>
          {/* Community Rules/FAQ Link */}
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Community Rules / FAQ</button>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard; 