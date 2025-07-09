"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer 
} from "recharts";

export default function BusinessAnalyticsPage() {
  const params = useParams() || {};
  const communityId = params && typeof params === 'object' && 'communityId' in params 
    ? params.communityId as string 
    : '';
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>({
    weeklyViews: [],
    inquiryTypes: [],
    totalViews: 0,
    totalInquiries: 0,
    totalFavorites: 0,
    averageRating: 0
  });

  // Mock data for demonstration
  const mockWeeklyViews = [
    { name: 'Mon', views: 12 },
    { name: 'Tue', views: 19 },
    { name: 'Wed', views: 15 },
    { name: 'Thu', views: 8 },
    { name: 'Fri', views: 22 },
    { name: 'Sat', views: 30 },
    { name: 'Sun', views: 24 },
  ];

  const mockInquiryTypes = [
    { name: 'General', value: 35 },
    { name: 'Pricing', value: 25 },
    { name: 'Availability', value: 20 },
    { name: 'Services', value: 15 },
    { name: 'Other', value: 5 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    const fetchBusinessData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return;
        }

        // Fetch user's businesses
        const { data: userBusinesses } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", user.id);
        
        if (userBusinesses && userBusinesses.length > 0) {
          setBusinesses(userBusinesses);
          
          // In a real implementation, you would fetch actual analytics data here
          // For now, we'll use mock data
          setAnalyticsData({
            weeklyViews: mockWeeklyViews,
            inquiryTypes: mockInquiryTypes,
            totalViews: 130,
            totalInquiries: 45,
            totalFavorites: 18,
            averageRating: 4.2
          });
        }
      } catch (error) {
        console.error("Error fetching business data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [supabase, communityId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-cyan-700">Loading analytics...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-cyan-900 mb-8">Business Analytics</h1>
      
      {businesses.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-center text-gray-500">You don't have any businesses yet. Create one to see analytics.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-sm text-gray-500 mb-1">Total Views</div>
              <div className="text-3xl font-bold text-cyan-700">{analyticsData.totalViews}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-sm text-gray-500 mb-1">Total Inquiries</div>
              <div className="text-3xl font-bold text-cyan-700">{analyticsData.totalInquiries}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-sm text-gray-500 mb-1">Favorites</div>
              <div className="text-3xl font-bold text-cyan-700">{analyticsData.totalFavorites}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-sm text-gray-500 mb-1">Average Rating</div>
              <div className="text-3xl font-bold text-cyan-700">{analyticsData.averageRating}</div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Views Chart */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-cyan-900 mb-4">Weekly Views</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.weeklyViews}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#0891b2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Inquiry Types Chart */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-cyan-900 mb-4">Inquiry Categories</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.inquiryTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.inquiryTypes.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Additional Analytics Info */}
          <div className="bg-white rounded-xl shadow p-6 mt-6">
            <h2 className="text-xl font-semibold text-cyan-900 mb-4">Performance Insights</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Your business listings received <span className="font-semibold">{analyticsData.totalViews}</span> views in the last 30 days.
              </p>
              <p className="text-gray-700">
                You've received <span className="font-semibold">{analyticsData.totalInquiries}</span> inquiries, with most people asking about general information.
              </p>
              <p className="text-gray-700">
                Your listings have been favorited <span className="font-semibold">{analyticsData.totalFavorites}</span> times.
              </p>
              <div className="bg-cyan-50 p-4 rounded-lg">
                <h3 className="font-semibold text-cyan-800">Tip</h3>
                <p className="text-cyan-700 text-sm">
                  Adding more photos and detailed descriptions can increase engagement by up to 30%.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 