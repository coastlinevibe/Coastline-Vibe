"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function ProfilePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [profile, setProfile] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Not logged in');
          setLoading(false);
          return;
        }
        const userId = session.user.id;
        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (profileError) throw profileError;
        setProfile(profile);
        // Fetch properties (including soft-deleted)
        const { data: properties, error: propError } = await supabase
          .from('properties')
          .select('*')
          .eq('user_id', userId);
        if (propError) throw propError;
        setProperties(properties || []);
        // Fetch market items (including soft-deleted)
        const { data: marketItems, error: marketError } = await supabase
          .from('market_items')
          .select('*')
          .eq('user_id', userId);
        if (marketError) throw marketError;
        setMarketItems(marketItems || []);
        // Fetch posts/comments (including soft-deleted)
        const { data: userPosts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (postsError) throw postsError;
        // Build activity array
        let activityArr: any[] = [];
        // Posts/comments
        (userPosts || []).forEach((p: any) => {
          if (p.created_at) activityArr.push({ type: p.depth === 0 ? 'Post Created' : 'Comment Created', content: p.content || p.title || '', date: p.created_at });
          if (p.updated_at && p.updated_at !== p.created_at) activityArr.push({ type: p.depth === 0 ? 'Post Edited' : 'Comment Edited', content: p.content || p.title || '', date: p.updated_at });
          if (p.deleted_at) activityArr.push({ type: p.depth === 0 ? 'Post Deleted' : 'Comment Deleted', content: p.content || p.title || '', date: p.deleted_at });
        });
        // Properties
        (properties || []).forEach((prop: any) => {
          if (prop.created_at) activityArr.push({ type: 'Property Created', content: prop.title || '', date: prop.created_at });
          if (prop.updated_at && prop.updated_at !== prop.created_at) activityArr.push({ type: 'Property Edited', content: prop.title || '', date: prop.updated_at });
          if (prop.deleted_at) activityArr.push({ type: 'Property Deleted', content: prop.title || '', date: prop.deleted_at });
        });
        // Market Items
        (marketItems || []).forEach((item: any) => {
          if (item.created_at) activityArr.push({ type: 'Market Item Created', content: item.title || '', date: item.created_at });
          if (item.updated_at && item.updated_at !== item.created_at) activityArr.push({ type: 'Market Item Edited', content: item.title || '', date: item.updated_at });
          if (item.deleted_at) activityArr.push({ type: 'Market Item Deleted', content: item.title || '', date: item.deleted_at });
        });
        // Sort by most recent
        activityArr.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setActivity(activityArr.slice(0, 20));
        // Demo notifications
        setNotifications([
          { id: 1, from: 'Jane Smith', item: 'Oceanfront Condo', message: 'Is this still available?', date: '2025-05-21', read: false },
          { id: 2, from: 'Mike Lee', item: 'iPhone 13 Pro', message: 'Can you lower the price?', date: '2025-05-20', read: true },
        ]);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-cyan-700">Loading profile...</div>;
  }
  if (error || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error || 'Profile not found'}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-cyan-100 flex flex-col items-center py-10">
      <div className="w-full max-w-3xl bg-white/90 rounded-2xl shadow-xl border border-cyan-100 p-8 flex flex-col gap-8">
        {/* User Info Card */}
        <div className="flex flex-col md:flex-row items-center gap-6 border-b pb-6">
          <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}`} alt={profile.username} className="w-24 h-24 rounded-full border-4 border-cyan-200 object-cover" />
          <div className="flex-1">
            <div className="text-2xl font-bold text-cyan-900">{profile.username} <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded ml-2">{profile.role || 'Member'}</span></div>
            <div className="text-cyan-700 text-sm">{profile.email}</div>
            <div className="text-cyan-700 text-sm">{profile.phone}</div>
            <div className="text-cyan-700 text-xs mt-1">Joined: {profile.joinDate || (profile.created_at ? profile.created_at.slice(0, 10) : '')}</div>
          </div>
          <Link href="/profile/edit" className="px-4 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition">Edit Profile</Link>
        </div>
        {/* Earnings & Stats */}
        <div className="flex flex-wrap gap-6 justify-center border-b pb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-900">${profile.earnings || 0}</div>
            <div className="text-cyan-700 text-sm">Total Earnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-900">{properties.length}</div>
            <div className="text-cyan-700 text-sm">Properties</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-900">{marketItems.length}</div>
            <div className="text-cyan-700 text-sm">Market Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-900">{activity.length}</div>
            <div className="text-cyan-700 text-sm">Posts/Comments</div>
          </div>
        </div>
        {/* My Properties */}
        <div>
          <div className="font-semibold text-cyan-900 mb-2 text-lg">My Properties</div>
          {properties.length === 0 ? (
            <div className="text-cyan-700 text-sm">No properties created yet.</div>
          ) : properties.length > 5 ? (
            <div className="relative">
              <PropertyCarousel properties={properties} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map((p) => (
                <div key={p.id} className="bg-cyan-50 rounded-lg p-4 border border-cyan-100 flex gap-4 items-center relative">
                  {p.approval_status === 'pending' && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">Pending Approval</span>
                    </div>
                  )}
                  <img src={p.imageFiles?.[0] || '/placeholder-property.jpg'} alt={p.title} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <div className="font-medium text-cyan-800">{p.title}</div>
                    <div className="text-xs text-cyan-600">${p.price} &bull; {p.approval_status === 'approved' ? 'Active' : p.approval_status}</div>
                  </div>
                  <Link href={`/properties/${p.id}/edit`} className="text-xs px-3 py-1 rounded bg-cyan-100 text-cyan-700 font-semibold hover:bg-cyan-200 transition">Edit</Link>
                  <button className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* My Market Items */}
        <div>
          <div className="font-semibold text-cyan-900 mb-2 text-lg">My Market Items</div>
          {marketItems.length === 0 ? (
            <div className="text-cyan-700 text-sm">No market items created yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketItems.map((m) => (
                <div key={m.id} className="bg-cyan-50 rounded-lg p-4 border border-cyan-100 flex gap-4 items-center relative">
                  {m.approval_status === 'pending' && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">Pending Approval</span>
                    </div>
                  )}
                  <img src={m.imagefiles?.[0] || '/placeholder-market.jpg'} alt={m.title} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <div className="font-medium text-cyan-800">{m.title}</div>
                    <div className="text-xs text-cyan-600">${m.price} &bull; {m.approval_status === 'approved' ? 'Active' : m.approval_status}</div>
                  </div>
                  <Link href={`/market/${m.id}/edit`} className="text-xs px-3 py-1 rounded bg-cyan-100 text-cyan-700 font-semibold hover:bg-cyan-200 transition">Edit</Link>
                  <button className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Pending Friends */}
        <div>
          <div className="font-semibold text-cyan-900 mb-2 text-lg">Pending Friends</div>
          {/* TODO: Fetch and display pending friend requests */}
          <div className="text-cyan-700 text-sm">No pending friend requests.</div> {/* Placeholder */}
        </div>
        {/* Notifications / Inquiries */}
        <div>
          <div className="font-semibold text-cyan-900 mb-2 text-lg">Notifications / Inquiries</div>
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className={`rounded px-4 py-2 border flex flex-col ${n.read ? 'bg-gray-50 border-gray-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-cyan-800">From: {n.from}</span>
                  <span className="text-xs text-cyan-600">{n.date}</span>
                </div>
                <div className="text-cyan-700 text-sm">Regarding: {n.item}</div>
                <div className="text-cyan-900 text-sm">"{n.message}"</div>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs px-3 py-1 rounded bg-teal-100 text-teal-700 font-semibold hover:bg-teal-200 transition">Mark as Read</button>
                  <button className="text-xs px-3 py-1 rounded bg-cyan-100 text-cyan-700 font-semibold hover:bg-cyan-200 transition">Respond</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {/* Recent Activity */}
        <div>
          <div className="font-semibold text-cyan-900 mb-2 text-lg">Recent Activity</div>
          <ul className="space-y-2">
            {activity.length === 0 && <li className="text-cyan-700 text-sm">No recent activity yet.</li>}
            {activity.map((a, i) => (
              <li key={i} className="bg-cyan-50 rounded px-4 py-2 border border-cyan-100 flex flex-col">
                <span className="font-medium text-cyan-800">{a.type}: {a.content.slice(0, 60)}{a.content.length > 60 ? '...' : ''}</span>
                <span className="text-xs text-cyan-600">{a.date ? a.date.slice(0, 10) : ''}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Security & Settings */}
        <div className="flex flex-col md:flex-row gap-4 mt-4 border-t pt-6">
          <button className="flex-1 px-4 py-2 rounded bg-cyan-100 text-cyan-700 font-semibold hover:bg-cyan-200 transition">Change Password</button>
          <button className="flex-1 px-4 py-2 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition">Delete Account</button>
        </div>
      </div>
    </div>
  );
}

function PropertyCarousel({ properties }: { properties: any[] }) {
  const [start, setStart] = React.useState(0);
  const visible = properties.slice(start, start + 5);
  return (
    <div className="flex items-center gap-2">
      {start > 0 && (
        <button
          onClick={() => setStart(start - 1)}
          className="w-8 h-24 flex items-center justify-center bg-cyan-100 rounded hover:bg-cyan-200 transition"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
      )}
      <div className="flex gap-4 overflow-x-auto">
        {visible.map((p) => (
          <div key={p.id} className="bg-cyan-50 rounded-lg p-4 border border-cyan-100 flex flex-col items-center min-w-[220px] max-w-[220px]">
            <img src={p.imageFiles?.[0] || '/placeholder-property.jpg'} alt={p.title} className="w-20 h-20 object-cover rounded mb-2" />
            <div className="font-medium text-cyan-800 text-center">{p.title}</div>
            <div className="text-xs text-cyan-600 mb-2">${p.price} &bull; {p.status || 'Active'}</div>
            <div className="flex gap-2 w-full">
              <Link href={`/properties/${p.id}/edit`} className="flex-1 text-xs px-3 py-1 rounded bg-cyan-100 text-cyan-700 font-semibold hover:bg-cyan-200 transition text-center">Edit</Link>
              <button className="flex-1 text-xs px-3 py-1 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition">Delete</button>
            </div>
          </div>
        ))}
      </div>
      {start + 5 < properties.length && (
        <button
          onClick={() => setStart(start + 1)}
          className="w-8 h-24 flex items-center justify-center bg-cyan-100 rounded hover:bg-cyan-200 transition"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      )}
    </div>
  );
} 