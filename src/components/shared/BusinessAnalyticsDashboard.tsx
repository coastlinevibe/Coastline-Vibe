"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Users, Eye, MessageSquare, Star } from 'lucide-react';

interface BusinessAnalyticsProps {
  businessId: string;
}

interface Review {
  id: string;
  rating: number;
}

export default function BusinessAnalyticsDashboard({ businessId }: BusinessAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    views: 0,
    viewsChange: 0,
    inquiries: 0,
    inquiriesChange: 0,
    favoriteCount: 0,
    favoriteCountChange: 0,
    averageRating: 0,
    reviewCount: 0,
    viewsByDay: [] as {name: string, views: number}[],
    inquiriesByCategory: [] as {name: string, value: number}[]
  });

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      const supabase = createClient();
      
      try {
        // Get business views (simulated for now)
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        
        // Format dates for query
        const todayStr = today.toISOString().split('T')[0];
        const lastWeekStr = lastWeek.toISOString().split('T')[0];
        
        // Get business inquiries
        const { data: inquiries, error: inquiriesError } = await supabase
          .from('business_inquiries')
          .select('id, created_at, subject')
          .eq('business_id', businessId);
          
        if (inquiriesError) {
          console.error('Error fetching inquiries:', inquiriesError);
        }
        
        // Get business favorites (if you have this feature)
        const { data: favorites, error: favoritesError } = await supabase
          .from('business_favorites')
          .select('id')
          .eq('business_id', businessId);
          
        if (favoritesError && favoritesError.code !== 'PGRST116') { // Ignore if table doesn't exist
          console.error('Error fetching favorites:', favoritesError);
        }
        
        // Get business reviews
        const { data: reviews, error: reviewsError } = await supabase
          .from('business_reviews')
          .select('id, rating')
          .eq('business_id', businessId);
          
        if (reviewsError && reviewsError.code !== 'PGRST116') { // Ignore if table doesn't exist
          console.error('Error fetching reviews:', reviewsError);
        }
        
        // Generate mock data for views by day
        const viewsByDay = [
          { name: 'Mon', views: Math.floor(Math.random() * 50) + 10 },
          { name: 'Tue', views: Math.floor(Math.random() * 50) + 10 },
          { name: 'Wed', views: Math.floor(Math.random() * 50) + 10 },
          { name: 'Thu', views: Math.floor(Math.random() * 50) + 10 },
          { name: 'Fri', views: Math.floor(Math.random() * 50) + 10 },
          { name: 'Sat', views: Math.floor(Math.random() * 50) + 10 },
          { name: 'Sun', views: Math.floor(Math.random() * 50) + 10 },
        ];
        
        // Generate mock data for inquiries by category
        const inquiriesByCategory = [
          { name: 'General', value: Math.floor(Math.random() * 20) + 5 },
          { name: 'Pricing', value: Math.floor(Math.random() * 15) + 5 },
          { name: 'Availability', value: Math.floor(Math.random() * 10) + 5 },
          { name: 'Services', value: Math.floor(Math.random() * 8) + 2 },
          { name: 'Other', value: Math.floor(Math.random() * 5) + 1 },
        ];
        
        // Calculate total views (mock data for now)
        const totalViews = viewsByDay.reduce((sum: number, day) => sum + day.views, 0);
        
        // Calculate average rating
        const totalRating = reviews?.reduce((sum: number, review: Review) => sum + (review.rating || 0), 0) || 0;
        const averageRating = reviews?.length ? totalRating / reviews.length : 0;
        
        setAnalytics({
          views: totalViews,
          viewsChange: 12, // Mock percentage change
          inquiries: inquiries?.length || 0,
          inquiriesChange: 5, // Mock percentage change
          favoriteCount: favorites?.length || 0,
          favoriteCountChange: 8, // Mock percentage change
          averageRating,
          reviewCount: reviews?.length || 0,
          viewsByDay,
          inquiriesByCategory
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (businessId) {
      fetchAnalytics();
    }
  }, [businessId]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Business Analytics</h2>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Views</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.views}</p>
            </div>
            <div className="p-2 bg-teal-100 rounded-full">
              <Eye className="h-5 w-5 text-teal-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            {analytics.viewsChange >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${analytics.viewsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(analytics.viewsChange)}% from last week
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Inquiries</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.inquiries}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            {analytics.inquiriesChange >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${analytics.inquiriesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(analytics.inquiriesChange)}% from last week
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Favorites</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.favoriteCount}</p>
            </div>
            <div className="p-2 bg-amber-100 rounded-full">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            {analytics.favoriteCountChange >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${analytics.favoriteCountChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(analytics.favoriteCountChange)}% from last week
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.averageRating.toFixed(1)}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Star className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-gray-500">
              Based on {analytics.reviewCount} reviews
            </span>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Weekly Views</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.viewsByDay}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Inquiries by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.inquiriesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.inquiriesByCategory.map((entry, index) => (
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
    </div>
  );
} 