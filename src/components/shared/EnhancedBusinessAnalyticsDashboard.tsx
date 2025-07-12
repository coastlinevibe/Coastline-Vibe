"use client";

import { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area 
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Users, Eye, MessageSquare, 
  Star, Calendar, Filter, Download, ChevronDown 
} from 'lucide-react';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface EnhancedBusinessAnalyticsProps {
  businessId: string;
}

// Chart data interfaces
interface DailyView {
  date: string;
  views: number;
  inquiries: number;
  favorites: number;
}
interface DeviceType {
  device: string;
  count: number;
}
interface TrafficSource {
  referrer: string;
  count: number;
}
interface PopularPage {
  page: string;
  views: number;
}
interface InquiryCategory {
  name: string;
  value: number;
}
interface VisitorDemographic {
  country: string;
  count: number;
}
interface EngagementMetric {
  name: string;
  value: number;
}

export default function EnhancedBusinessAnalyticsDashboard({ businessId }: EnhancedBusinessAnalyticsProps) {
  // State for active tab
  const [activeTab, setActiveTab] = useState('visitors');
  
  // State for date range
  const [dateRange, setDateRange] = useState('last30');
  const [customRange, setCustomRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // State for analytics data
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalViews: 0,
    viewsChange: 0,
    uniqueVisitors: 0,
    visitorsChange: 0,
    inquiries: 0,
    inquiriesChange: 0,
    favoriteCount: 0,
    favoriteChange: 0,
    averageRating: 0,
    reviewCount: 0
  });
  
  // Charts data
  const [chartsData, setChartsData] = useState({
    dailyViews: [] as DailyView[],
    trafficSources: [] as TrafficSource[],
    deviceTypes: [] as DeviceType[],
    popularPages: [] as PopularPage[],
    inquiryCategories: [] as InquiryCategory[],
    visitorDemographics: [] as VisitorDemographic[],
    engagementMetrics: [] as EngagementMetric[]
  });
  
  // Colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Fetch analytics data based on date range
  useEffect(() => {
    fetchAnalyticsData();
  }, [businessId, dateRange, customRange]);
  
  async function fetchAnalyticsData() {
    setLoading(true);
    
    try {
      // Determine date range for query
      let startDate, endDate;
      
      switch(dateRange) {
        case 'last7':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          endDate = new Date().toISOString().split('T')[0];
          break;
        case 'last30':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          endDate = new Date().toISOString().split('T')[0];
          break;
        case 'last90':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          endDate = new Date().toISOString().split('T')[0];
          break;
        case 'custom':
          startDate = customRange.start;
          endDate = customRange.end;
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          endDate = new Date().toISOString().split('T')[0];
      }
      
      // In a real implementation, you would use the fetched data
      // For now, we'll generate some mock data for demonstration
      
      // Generate mock summary data
      setSummaryData({
        totalViews: Math.floor(Math.random() * 1000) + 500,
        viewsChange: Math.floor(Math.random() * 30) - 10,
        uniqueVisitors: Math.floor(Math.random() * 500) + 200,
        visitorsChange: Math.floor(Math.random() * 25) - 5,
        inquiries: Math.floor(Math.random() * 50) + 10,
        inquiriesChange: Math.floor(Math.random() * 40) - 15,
        favoriteCount: Math.floor(Math.random() * 100) + 20,
        favoriteChange: Math.floor(Math.random() * 20) - 5,
        averageRating: Number((Math.random() * 2 + 3).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 30) + 5
      });
      
      // Generate mock chart data
      const dailyViews = generateMockDailyData(startDate, endDate);
      
      setChartsData({
        dailyViews,
        deviceTypes: [
          { device: 'Desktop', count: Math.floor(Math.random() * 500) + 200 },
          { device: 'Mobile', count: Math.floor(Math.random() * 400) + 100 },
          { device: 'Tablet', count: Math.floor(Math.random() * 100) + 50 }
        ],
        trafficSources: [
          { referrer: 'Google', count: Math.floor(Math.random() * 200) + 100 },
          { referrer: 'Direct', count: Math.floor(Math.random() * 150) + 80 },
          { referrer: 'Facebook', count: Math.floor(Math.random() * 100) + 50 },
          { referrer: 'Instagram', count: Math.floor(Math.random() * 80) + 30 },
          { referrer: 'Twitter', count: Math.floor(Math.random() * 50) + 20 }
        ],
        popularPages: [
          { page: 'Home', views: Math.floor(Math.random() * 300) + 100 },
          { page: 'Services', views: Math.floor(Math.random() * 200) + 80 },
          { page: 'Gallery', views: Math.floor(Math.random() * 150) + 50 },
          { page: 'Contact', views: Math.floor(Math.random() * 100) + 40 },
          { page: 'About', views: Math.floor(Math.random() * 80) + 30 }
        ],
        inquiryCategories: [
          { name: 'General', value: Math.floor(Math.random() * 30) + 10 },
          { name: 'Pricing', value: Math.floor(Math.random() * 25) + 8 },
          { name: 'Availability', value: Math.floor(Math.random() * 20) + 5 },
          { name: 'Services', value: Math.floor(Math.random() * 15) + 5 },
          { name: 'Other', value: Math.floor(Math.random() * 10) + 2 }
        ],
        visitorDemographics: [
          { country: 'Vietnam', count: Math.floor(Math.random() * 400) + 200 },
          { country: 'USA', count: Math.floor(Math.random() * 100) + 50 },
          { country: 'Australia', count: Math.floor(Math.random() * 80) + 30 },
          { country: 'UK', count: Math.floor(Math.random() * 60) + 20 },
          { country: 'Other', count: Math.floor(Math.random() * 100) + 40 }
        ],
        engagementMetrics: [
          { name: 'Avg. Time on Page', value: Math.floor(Math.random() * 120) + 60 },
          { name: 'Bounce Rate', value: Math.floor(Math.random() * 40) + 20 },
          { name: 'Pages per Session', value: Math.floor(Math.random() * 3) + 1 }
        ]
      });
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }
  
  // Helper function to generate mock daily data
  function generateMockDailyData(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 50) + 10,
        inquiries: Math.floor(Math.random() * 5),
        favorites: Math.floor(Math.random() * 3)
      };
    });
  }
  
  // Custom tooltip formatter for better accessibility
  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded" role="status" aria-live="polite">
          <p className="font-semibold text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Handle export button click
  const handleExport = () => {
    // In a real implementation, you would generate and download a CSV file
    alert('Analytics data export would be downloaded here');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-base font-semibold text-gray-800">Business Analytics Dashboard</h2>
        
        {/* Date Range Selector */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex rounded-md overflow-hidden border border-gray-300">
            <button 
              onClick={() => setDateRange('last7')}
              className={`px-3 py-1.5 text-sm ${dateRange === 'last7' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-700'}`}
            >
              7 Days
            </button>
            <button 
              onClick={() => setDateRange('last30')}
              className={`px-3 py-1.5 text-sm ${dateRange === 'last30' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-700'}`}
            >
              30 Days
            </button>
            <button 
              onClick={() => setDateRange('last90')}
              className={`px-3 py-1.5 text-sm ${dateRange === 'last90' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-700'}`}
            >
              90 Days
            </button>
            <button 
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1.5 text-sm ${dateRange === 'custom' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Custom
            </button>
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex gap-2">
              <input 
                type="date" 
                value={customRange.start}
                onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <span className="self-center">to</span>
              <input 
                type="date"
                value={customRange.end}
                onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
          )}
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-gray-700 text-sm"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Views Card */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Views</p>
              <p className="text-2xl font-bold text-gray-800">{summaryData.totalViews.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-cyan-100 rounded-full">
              <Eye className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            {summaryData.viewsChange >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${summaryData.viewsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(summaryData.viewsChange)}% from previous period
            </span>
          </div>
        </div>
        
        {/* Unique Visitors Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Unique Visitors</p>
              <p className="text-2xl font-bold text-gray-800">{summaryData.uniqueVisitors.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-full">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            {summaryData.visitorsChange >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${summaryData.visitorsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(summaryData.visitorsChange)}% from previous period
            </span>
          </div>
        </div>
        
        {/* Inquiries Card */}
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-4 rounded-lg border border-blue-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Inquiries</p>
              <p className="text-2xl font-bold text-gray-800">{summaryData.inquiries.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            {summaryData.inquiriesChange >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${summaryData.inquiriesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(summaryData.inquiriesChange)}% from previous period
            </span>
          </div>
        </div>
        
        {/* Favorites Card */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Favorites</p>
              <p className="text-2xl font-bold text-gray-800">{summaryData.favoriteCount.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-amber-100 rounded-full">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            {summaryData.favoriteChange >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${summaryData.favoriteChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(summaryData.favoriteChange)}% from previous period
            </span>
          </div>
        </div>
      </div>
      
      {/* Dashboard Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('visitors')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'visitors'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Visitor Insights
          </button>
          <button
            onClick={() => setActiveTab('interactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'interactions'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Interaction Metrics
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inquiries'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Inquiry Analysis
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'visitors' && (
        <div className="space-y-6">
          {/* Traffic Over Time Chart */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Traffic Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartsData.dailyViews}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  accessibilityLayer
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="views" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Device & Traffic Source Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Device Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart accessibilityLayer>
                    <Pie
                      data={chartsData.deviceTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="device"
                      label={({ device, percent }) => `${device}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartsData.deviceTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Traffic Sources</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartsData.trafficSources}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    accessibilityLayer
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="referrer" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'interactions' && (
        <div className="space-y-6">
          {/* Popular Pages */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Most Viewed Pages</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartsData.popularPages}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  accessibilityLayer
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="page" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="views" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Daily Engagement Chart */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Daily Engagement</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartsData.dailyViews}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  accessibilityLayer
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#0ea5e9" />
                  <Line type="monotone" dataKey="inquiries" stroke="#8884d8" />
                  <Line type="monotone" dataKey="favorites" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          {/* Inquiry Categories Chart */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Inquiry Categories</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer>
                  <Pie
                    data={chartsData.inquiryCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartsData.inquiryCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 