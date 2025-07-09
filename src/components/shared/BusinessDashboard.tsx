"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import BusinessMultiStepForm from './BusinessMultiStepForm';
import CommunityBusinessDetailPage from '@/app/community/[communityId]/business/[businessId]/page';
import AccommodationTemplate from '@/components/templates/AccommodationTemplate';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ChevronDown, ChevronUp, Sailboat } from 'lucide-react';
import BusinessInquiryInbox from './BusinessInquiryInbox';

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

const SIDEBAR_SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'listings', label: 'Listings' },
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'settings', label: 'Settings' },
];

// Create a replica of the community page for business settings
function BusinessProfileSettingsPanel() {
  const [business, setBusiness] = useState<any>(null);
  const [community, setCommunity] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotificationsCollapsed, setIsNotificationsCollapsed] = useState(false);
  const [isActivityCollapsed, setIsActivityCollapsed] = useState(false);
  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState(false);
  const [isMarketItemsCollapsed, setIsMarketItemsCollapsed] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState('Chatter');
  const [userProperties, setUserProperties] = useState([]);
  const [userMarketItems, setUserMarketItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchBusinessAndUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');
        
        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, role, bio, is_location_verified, email, created_at, last_seen_at')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw new Error('Profile not found');
        setProfile(profileData);
        
        // Get business
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*, community:communities(id, name, slug)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .maybeSingle();
          
        if (businessError || !businessData) throw new Error('Business not found');
        setBusiness(businessData);
        setCommunity(businessData.community);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusinessAndUserData();
  }, [supabase]);

  // Helper function to check if user is online
  const calculateIsOnline = (lastSeenAt?: string | null): boolean => {
    if (!lastSeenAt) return false;
    const lastSeenDate = new Date(lastSeenAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeenDate > fiveMinutesAgo;
  };

  if (loading) {
    return <div className="min-h-[400px] flex items-center justify-center text-cyan-600">Loading profile settings...</div>;
  }
  
  if (error || !profile || !business || !community) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-2">Error</h2>
          <p>{error || 'Profile or business not found'}</p>
        </div>
      </div>
    );
  }

  const isOnline = calculateIsOnline(profile.last_seen_at);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Gradient welcome banner */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-lg shadow-lg mb-6 text-center">
        <h1 className="text-3xl font-bold">Welcome to CoastlineVibe {community.name}, {business.name}!</h1>
        <p className="mt-2 text-lg">Your hub for all things {community.name}. Connect, discover, and engage with your community.</p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="md:col-span-1 space-y-6">
          {/* Profile card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-4 mb-4">
              <Image 
                src={profile.avatar_url || '/placeholder-avatar.png'} 
                alt={profile.username || 'User avatar'}
                width={80} 
                height={80} 
                className="rounded-full"
              />
              <div>
                <h1 className="text-2xl font-semibold flex items-center">
                  {business.name || 'Business'}
                  <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">business</span>
                  {isOnline ? (
                    <span title="Online">
                      <Sailboat size={18} className="ml-2 text-green-500" />
                    </span>
                  ) : (
                    <span title="Offline">
                      <Sailboat size={18} className="ml-2 text-slate-400" />
                    </span>
                  )}
                  {profile.is_location_verified && (
                    <ShieldCheck className="ml-2 h-5 w-5 text-blue-500" />
                  )}
                </h1>
                <p className="text-slate-600">{profile.role || 'Business Account'}</p>
                {business.description && (
                  <div className="mt-1">
                    <span className="text-xs text-slate-400 font-semibold">About Me:</span>
                    <p className="text-sm text-slate-500 italic whitespace-pre-wrap">{business.description}</p>
                </div>
                )}
              </div>
            </div>
            
            <Link href="/profile/edit" className="block w-full mb-3">
              <button className="w-full bg-transparent hover:bg-primaryTeal text-primaryTeal hover:text-offWhite font-semibold py-3 px-4 border-2 border-primaryTeal rounded-lg transition duration-150 ease-in-out">
                Edit Profile
              </button>
            </Link>
            
            <button className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-150">
              Verify My Location
            </button>
          </div>

          {/* Wishlist */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">My Wishlist</h2>
            <p className="text-slate-500">Your wishlist is empty.</p>
          </div>

          {/* Pending Friend Requests */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Pending Friend Requests</h2>
            <p className="text-slate-500">No pending friend requests.</p>
          </div>

          {/* Friends */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Friends</h2>
            <p className="text-slate-500">No friends yet.</p>
          </div>
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-6">
          {/* Notifications */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div 
              className="flex justify-between items-center cursor-pointer mb-4" 
              onClick={() => setIsNotificationsCollapsed(!isNotificationsCollapsed)}
            >
              <h2 className="text-xl font-semibold">My Notifications</h2>
              {isNotificationsCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </div>

            {!isNotificationsCollapsed && (
              <>
                <div className="border-b border-slate-200 mb-4">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {['Chatter', 'Property', 'Market', 'Directory'].map((tabName) => (
                      <button
                        key={tabName}
                        onClick={() => setActiveNotificationTab(tabName)}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                          ${activeNotificationTab === tabName 
                            ? 'border-blue-500 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                      >
                        {tabName}
                      </button>
                    ))}
                  </nav>
                </div>
                <p className="text-slate-500">No notifications.</p>
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div 
              className="flex justify-between items-center cursor-pointer mb-4"
              onClick={() => setIsActivityCollapsed(!isActivityCollapsed)}
            >
              <h2 className="text-xl font-semibold">My Recent Activity</h2>
              {isActivityCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </div>
            {!isActivityCollapsed && (
              <p className="text-slate-500 text-center py-4">No recent activity to display.</p>
            )}
          </div>

          {/* Properties */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div
              className="flex justify-between items-center cursor-pointer mb-4"
              onClick={() => setIsPropertiesCollapsed(!isPropertiesCollapsed)}
            >
              <h2 className="text-xl font-semibold">My Created Properties</h2>
              {isPropertiesCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </div>
            {!isPropertiesCollapsed && (
              <p className="text-slate-500 text-center py-4">You haven't created any properties in this community yet.</p>
            )}
          </div>

          {/* Market Listings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div
              className="flex justify-between items-center cursor-pointer mb-4"
              onClick={() => setIsMarketItemsCollapsed(!isMarketItemsCollapsed)}
            >
              <h2 className="text-xl font-semibold">My Market Listings</h2>
              {isMarketItemsCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </div>
            {!isMarketItemsCollapsed && (
              <p className="text-slate-500 text-center py-4">You haven't listed any items in the market for this community yet.</p>
            )}
          </div>

          {/* Community Members */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Community Members</h2>
              <button className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300">
                Show
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [activeSection, setActiveSection] = useState('overview');

  // Check for active tab in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('activeDashboardTab');
      if (savedTab && SIDEBAR_SECTIONS.some(section => section.key === savedTab)) {
        setActiveSection(savedTab);
        // Clear it after using it
        localStorage.removeItem('activeDashboardTab');
      }
    }
  }, []);

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
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col p-6">
          <h2 className="text-xl font-bold text-primaryTeal mb-8">Business Dashboard</h2>
          <nav className="flex flex-col gap-4">
            {SIDEBAR_SECTIONS.map(section => (
              <button
                key={section.key}
                className={`text-left px-3 py-2 rounded-lg font-medium transition-all ${activeSection === section.key ? 'bg-primaryTeal text-white' : 'text-primaryTeal hover:bg-seafoam/40'}`}
                onClick={() => setActiveSection(section.key)}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeSection === 'listings' ? (
            <BusinessMultiStepForm mode="edit" onComplete={() => {}} />
          ) : (
            <div className="max-w-2xl mx-auto p-6">
              <h2 className="text-2xl font-bold text-cyan-900 mb-6">Create Your Business Profile</h2>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col p-6">
        <h2 className="text-xl font-bold text-primaryTeal mb-8">Business Dashboard</h2>
        <nav className="flex flex-col gap-4">
          {SIDEBAR_SECTIONS.map(section => (
            <button
              key={section.key}
              className={`text-left px-3 py-2 rounded-lg font-medium transition-all ${activeSection === section.key ? 'bg-primaryTeal text-white' : 'text-primaryTeal hover:bg-seafoam/40'}`}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">
        {activeSection === 'overview' && (
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
                    <BusinessMultiStepForm mode="edit" onComplete={() => {}} />
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
        )}
        {activeSection === 'listings' && (
          <BusinessMultiStepForm mode="edit" onComplete={() => {}} />
        )}
        {activeSection === 'inquiries' && business?.id && (
          <BusinessInquiryInbox businessId={business.id} />
        )}
        {activeSection === 'analytics' && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-medium text-cyan-900">Analytics</h2>
            <p className="text-gray-600">Analytics charts and CSV export will appear here.</p>
          </div>
        )}
        {activeSection === 'settings' && (
          <BusinessProfileSettingsPanel />
        )}
      </main>
    </div>
  );
};

export default BusinessDashboard; 