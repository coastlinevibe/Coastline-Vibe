"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import MiamiDashboard from '@/components/community/MiamiDashboard';

// Define a more specific Profile type for this page's needs
interface Profile {
  id: string;
  username: string;
  community_id: string | null;
  is_admin: boolean | null;
}

type PageStatus = 'loading' | 'unauthenticated' | 'unauthorized' | 'authorized' | 'error';

export default function CommunityLandingPage() {
  const params = useParams();
  const communityId = params.communityId as string;
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [community, setCommunity] = useState<{ name: string; banner_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    const fetchCommunity = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('communities')
        .select('name, banner_url')
        .eq('name', communityId)
        .single();
      if (!error && data) {
        setCommunity({ name: data.name, banner_url: data.banner_url });
      }
      setLoading(false);
    };
    if (communityId) fetchCommunity();
  }, [communityId, supabase]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('authUser:', authUser);
      if (authUser) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', authUser.id)
          .single();
        console.log('profile fetch result:', { data, error });
        if (!error && data) {
          setUser({ username: data.username, avatar_url: data.avatar_url });
        }
      }
    };
    fetchUser();
  }, [supabase]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading community...</p></div>;
  }

    return (
      <div className="min-h-screen bg-sky-50 p-4 sm:p-6 md:p-8">
      {/* 1. Welcome/Header Section */}
      <section className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-sky-700">Welcome to CoastlineVibe, {community?.name || communityId}!</h1>
          <p className="text-slate-600 mt-2">Your local hub for events, deals, properties, and more.</p>
        </div>
        {/* City/community branding image/banner */}
        <div className="mt-4 md:mt-0 md:ml-8">
          {community?.banner_url ? (
            <img src={community.banner_url} alt="Community Banner" className="w-40 h-20 object-cover rounded-lg" />
          ) : (
            <div className="w-40 h-20 bg-sky-200 rounded-lg flex items-center justify-center text-sky-600 font-bold">[Banner]</div>
            )}
          </div>
      </section>

      {/* 7. Quick Links / Navigation */}
      <nav className="mb-6 flex flex-wrap gap-3">
        <a href={`/community/${communityId}/feed`} className="px-4 py-2 bg-cyan-100 rounded hover:bg-cyan-200 font-medium">Feed</a>
        <a href={`/community/${communityId}/market`} className="px-4 py-2 bg-cyan-100 rounded hover:bg-cyan-200 font-medium">Marketplace</a>
        <a href={`/community/${communityId}/directory`} className="px-4 py-2 bg-cyan-100 rounded hover:bg-cyan-200 font-medium">Directory</a>
        <a href={`/community/${communityId}/properties`} className="px-4 py-2 bg-cyan-100 rounded hover:bg-cyan-200 font-medium">Properties</a>
        <a href={`/community/${communityId}/events`} className="px-4 py-2 bg-cyan-100 rounded hover:bg-cyan-200 font-medium">Events</a>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar (Profile, Alerts, Shortcuts, Optional Widgets) */}
        <aside className="lg:col-span-1 space-y-6">
          {/* 10. User Profile & Shortcuts */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="User Avatar" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-sky-200 flex items-center justify-center text-2xl font-bold text-sky-700">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <p className="font-semibold text-sky-800">{user?.username || '[Username]'}</p>
                <a href="/profile" className="text-xs text-cyan-600 hover:underline">View Profile</a>
              </div>
            </div>
            <button className="mt-4 w-full bg-cyan-500 text-white py-2 rounded-lg font-semibold hover:bg-cyan-600">Post an Event/Listing</button>
          </div>
          {/* 8. Notifications & Alerts */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-sky-700 mb-2">Notifications</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>No new notifications.</li>
            </ul>
          </div>
          {/* Optional: Weather, News, Leaderboard, Language Selector */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-sky-700 mb-2">Weather</h3>
            <div className="text-slate-600">[Weather widget]</div>
          </div>
        </aside>

        {/* Main Content (Feed, Composer, Poll, Spotlight) */}
        <main className="lg:col-span-2 space-y-6">
          {/* 2. Community Feed & Composer */}
          <section id="feed" className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold text-sky-700 mb-3">Community Feed</h2>
            <div className="mb-4">
              <textarea className="w-full p-2 border rounded-lg" placeholder="What's happening in [CommunityName]?" rows={2}></textarea>
              <button className="mt-2 bg-cyan-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-600">Post</button>
            </div>
            <div className="space-y-4">
              {/* Example post */}
              <div className="p-3 bg-sky-50 rounded-lg">[Feed Post]</div>
              <div className="p-3 bg-sky-50 rounded-lg">[Feed Post]</div>
            </div>
          </section>
          {/* 9. Community Poll or Question of the Day */}
          <section className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-sky-700 mb-2">Poll of the Day</h3>
            <div className="text-slate-600">[Poll widget]</div>
          </section>
          {/* 6. Property Spotlight */}
          <section id="properties" className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-sky-700 mb-2">Property Spotlight</h3>
            <div className="text-slate-600">[Featured property listing]</div>
            <input className="mt-2 w-full p-2 border rounded-lg" placeholder="Quick search properties..." />
          </section>
        </main>

        {/* Right Sidebar (Events, Businesses, Marketplace) */}
        <aside className="lg:col-span-1 space-y-6">
          {/* 3. Upcoming Events Preview */}
          <section id="events" className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-sky-700 mb-2">Upcoming Events</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>[Event 1]</li>
              <li>[Event 2]</li>
              <li>[Event 3]</li>
            </ul>
            <button className="mt-3 w-full bg-cyan-500 text-white py-2 rounded-lg font-semibold hover:bg-cyan-600">View All Events</button>
          </section>
          {/* 4. Featured Local Businesses/Promotions */}
          <section id="directory" className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-sky-700 mb-2">Featured Businesses</h3>
            <div className="text-slate-600">[Business carousel/grid]</div>
            <div className="mt-2 text-xs text-cyan-600">Latest coupons/promos</div>
          </section>
          {/* 5. Marketplace Highlights */}
          <section id="marketplace" className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-sky-700 mb-2">Marketplace Highlights</h3>
            <div className="text-slate-600">[Trending now items]</div>
            <div className="mt-2 text-xs text-cyan-600">Top new listings in last 24 hours</div>
          </section>
        </aside>
      </div>
      </div>
    );
} 