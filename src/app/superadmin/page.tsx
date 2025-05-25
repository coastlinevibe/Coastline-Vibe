"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'communities', label: 'Community Management' },
  { key: 'users', label: 'User & Role Management' },
  { key: 'moderation', label: 'Content Moderation' },
  { key: 'features', label: 'Feature Toggles & Settings' },
  { key: 'messaging', label: 'Messaging & Notifications' },
  { key: 'system', label: 'System Health' },
];

export default function SuperAdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: null,
    totalBusinesses: null,
    activeCommunities: null,
    reportsPending: null,
    newSignups24h: null,
    newSignups7d: null,
    pendingUserApprovals: null,
    pendingBusinessApprovals: null,
    pendingListingApprovals: null,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [userGrowth, setUserGrowth] = useState<Array<{ date: string; count: number }>>([]);
  const [activeByCommunity, setActiveByCommunity] = useState<Array<{ community: string; count: number }>>([]);
  const [popularSections, setPopularSections] = useState<Array<{ section: string; count: number }>>([]);
  const [conversionFunnel, setConversionFunnel] = useState<{ signups: number; active: number; businesses: number }>({ signups: 0, active: 0, businesses: 0 });

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    async function fetchStats() {
      setLoading(true);
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [users, businesses, communities, reports, signups24h, signups7d, pendingUsers, pendingBusinesses, pendingProperties, pendingMarket] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['user', 'business']),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'business'),
        supabase.from('communities').select('id', { count: 'exact', head: true }),
        supabase.from('post_reports').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending').neq('role', 'business'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending').eq('role', 'business'),
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('market_items').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
      ]);
      setStats({
        totalUsers: users.count ?? 0,
        totalBusinesses: businesses.count ?? 0,
        activeCommunities: communities.count ?? 0,
        reportsPending: reports.count ?? 0,
        newSignups24h: signups24h.count ?? 0,
        newSignups7d: signups7d.count ?? 0,
        pendingUserApprovals: pendingUsers.count ?? 0,
        pendingBusinessApprovals: pendingBusinesses.count ?? 0,
        pendingListingApprovals: (pendingProperties.count ?? 0) + (pendingMarket.count ?? 0),
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeSection !== 'analytics') return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    async function fetchAnalytics() {
      setAnalyticsLoading(true);
      // 1. User Growth (last 30 days)
      const today = new Date();
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
        return d.toISOString().slice(0, 10);
      });
      const { data: usersData } = await supabase.from('profiles').select('created_at');
      const growth = days.map(date => ({
        date,
        count: (usersData || []).filter(u => u.created_at && u.created_at.slice(0, 10) <= date).length,
      }));
      setUserGrowth(growth);
      // 2. Active Users by Community (last 7 days, by posts)
      const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
      const { data: postsData } = await supabase.from('posts').select('user_id, community_id, created_at').gte('created_at', weekAgo);
      const commMap: Record<string, Set<string>> = {};
      (postsData || []).forEach(p => {
        if (!p.community_id || !p.user_id) return;
        if (!commMap[p.community_id]) commMap[p.community_id] = new Set();
        commMap[p.community_id].add(p.user_id);
      });
      setActiveByCommunity(Object.entries(commMap).map(([community, users]) => ({ community, count: users.size })));
      // 3. Popular Sections/Features (posts, properties, market_items)
      const [{ count: feedCount }, { count: propCount }, { count: marketCount }] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('properties').select('id', { count: 'exact', head: true }),
        supabase.from('market_items').select('id', { count: 'exact', head: true }),
      ]);
      setPopularSections([
        { section: 'Feed', count: feedCount ?? 0 },
        { section: 'Properties', count: propCount ?? 0 },
        { section: 'Market', count: marketCount ?? 0 },
      ]);
      // 4. Conversion Funnel
      const { count: signupCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      const { count: businessCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'business');
      const { data: activeUsersData } = await supabase.from('posts').select('user_id').gte('created_at', weekAgo);
      const uniqueActive = new Set((activeUsersData || []).map(u => u.user_id)).size;
      setConversionFunnel({ signups: signupCount ?? 0, active: uniqueActive, businesses: businessCount ?? 0 });
      setAnalyticsLoading(false);
    }
    fetchAnalytics();
  }, [activeSection]);

  return (
    <div className="min-h-screen flex bg-sky-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-cyan-100 flex flex-col py-8 px-4">
        <h1 className="text-2xl font-bold text-cyan-900 mb-8">SuperAdmin</h1>
        <nav className="flex flex-col gap-2">
          {SECTIONS.map(section => (
            <button
              key={section.key}
              className={`text-left px-4 py-2 rounded font-semibold transition-colors ${activeSection === section.key ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-900 hover:bg-cyan-200'}`}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-10">
        {activeSection === 'overview' && (
          <section>
            <h2 className="text-xl font-bold mb-6 text-cyan-800">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-cyan-50 rounded-lg p-6 text-center">Total Users<br /><span className="text-2xl font-bold">{loading ? '--' : stats.totalUsers}</span></div>
              <div className="bg-cyan-50 rounded-lg p-6 text-center">Total Businesses<br /><span className="text-2xl font-bold">{loading ? '--' : stats.totalBusinesses}</span></div>
              <div className="bg-cyan-50 rounded-lg p-6 text-center">Active Communities<br /><span className="text-2xl font-bold">{loading ? '--' : stats.activeCommunities}</span></div>
              <div className="bg-cyan-50 rounded-lg p-6 text-center">Reports Pending<br /><span className="text-2xl font-bold">{loading ? '--' : stats.reportsPending}</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow p-6">New Signups (24h/7d)<br /><div className="h-24 bg-cyan-100 rounded mt-4 flex items-center justify-center text-2xl font-bold text-cyan-800">{loading ? '-- / --' : `${stats.newSignups24h} / ${stats.newSignups7d}`}</div></div>
              <div className="bg-white rounded-xl shadow p-6">Pending Approvals<br /><div className="h-24 bg-cyan-100 rounded mt-4 flex flex-col items-center justify-center text-cyan-800 text-lg font-semibold">
                {loading ? '--' : (
                  <>
                    Users: {stats.pendingUserApprovals}<br />
                    Businesses: {stats.pendingBusinessApprovals}<br />
                    Listings: {stats.pendingListingApprovals}
                  </>
                )}
              </div></div>
            </div>
          </section>
        )}
        {activeSection === 'analytics' && (
          <section>
            <h2 className="text-xl font-bold mb-6 text-cyan-800">Global Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* User Growth Chart */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 mr-2"></span>
                  User Growth (30d)
                </div>
                <div className="h-40 bg-cyan-50 rounded-lg mt-2 flex items-end px-2 pb-2 relative overflow-hidden">
                  {analyticsLoading ? (
                    <div className="w-full text-center text-cyan-700">Loading...</div>
                  ) : (
                    <svg width="100%" height="100%" viewBox="0 0 320 120" preserveAspectRatio="none" className="w-full h-full">
                      {userGrowth.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="3"
                          className="transition-all duration-700 ease-in-out"
                          points={userGrowth.map((d, i) => `${(i / (userGrowth.length - 1)) * 320},${120 - (d.count / Math.max(...userGrowth.map(x => x.count), 1)) * 100}`).join(' ')}
                        />
                      )}
                      {/* Dots */}
                      {userGrowth.map((d, i) => (
                        <circle
                          key={i}
                          cx={(i / (userGrowth.length - 1)) * 320}
                          cy={120 - (d.count / Math.max(...userGrowth.map(x => x.count), 1)) * 100}
                          r={2.5}
                          fill="#06b6d4"
                          className="transition-all duration-700 ease-in-out"
                        />
                      ))}
                    </svg>
                  )}
                  {/* X-axis labels */}
                  {!analyticsLoading && userGrowth.length > 0 && (
                    <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[10px] text-cyan-700 opacity-70 pointer-events-none">
                      <span>{userGrowth[0].date.slice(5)}</span>
                      <span>{userGrowth[Math.floor(userGrowth.length / 2)].date.slice(5)}</span>
                      <span>{userGrowth[userGrowth.length - 1].date.slice(5)}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Active Users by Community */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-sky-400 mr-2"></span>
                  Active Users by Community (7d)
                </div>
                <div className="h-40 bg-cyan-50 rounded-lg mt-2 flex items-end px-2 pb-2 relative overflow-hidden">
                  {analyticsLoading ? (
                    <div className="w-full text-center text-cyan-700">Loading...</div>
                  ) : (
                    <svg width="100%" height="100%" viewBox="0 0 320 120" preserveAspectRatio="none" className="w-full h-full">
                      {activeByCommunity.length > 0 && activeByCommunity.map((d, i) => {
                        const barWidth = 320 / activeByCommunity.length - 10;
                        const barHeight = (d.count / Math.max(...activeByCommunity.map(x => x.count), 1)) * 100;
                        return (
                          <g key={d.community} className="transition-all duration-700 ease-in-out">
                            <rect x={i * (barWidth + 10) + 10} y={120 - barHeight} width={barWidth} height={barHeight} rx={barWidth/2} fill="#0ea5e9" className="transition-all duration-700 ease-in-out" />
                            <text x={i * (barWidth + 10) + 10 + barWidth / 2} y={120 - barHeight - 8} textAnchor="middle" fontSize="12" fill="#0369a1" className="font-bold">{d.count}</text>
                            <text x={i * (barWidth + 10) + 10 + barWidth / 2} y={115} textAnchor="middle" fontSize="10" fill="#0369a1" className="truncate max-w-[60px]">{d.community.slice(0, 8)}</text>
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>
              </div>
              {/* Popular Sections/Features */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-teal-400 mr-2"></span>
                  Popular Sections/Features
                </div>
                <div className="h-40 bg-cyan-50 rounded-lg mt-2 flex items-end px-2 pb-2 relative overflow-hidden">
                  {analyticsLoading ? (
                    <div className="w-full text-center text-cyan-700">Loading...</div>
                  ) : (
                    <svg width="100%" height="100%" viewBox="0 0 320 120" preserveAspectRatio="none" className="w-full h-full">
                      {popularSections.length > 0 && popularSections.map((d, i) => {
                        const barWidth = 320 / popularSections.length - 10;
                        const barHeight = (d.count / Math.max(...popularSections.map(x => x.count), 1)) * 100;
                        return (
                          <g key={d.section} className="transition-all duration-700 ease-in-out">
                            <rect x={i * (barWidth + 10) + 10} y={120 - barHeight} width={barWidth} height={barHeight} rx={barWidth/2} fill="#14b8a6" className="transition-all duration-700 ease-in-out" />
                            <text x={i * (barWidth + 10) + 10 + barWidth / 2} y={120 - barHeight - 8} textAnchor="middle" fontSize="12" fill="#0f766e" className="font-bold">{d.count}</text>
                            <text x={i * (barWidth + 10) + 10 + barWidth / 2} y={115} textAnchor="middle" fontSize="10" fill="#0f766e">{d.section}</text>
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>
              </div>
              {/* Conversion Funnel */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-600 mr-2"></span>
                  Conversion Funnel
                </div>
                <div className="h-40 bg-cyan-50 rounded-lg mt-2 flex items-end px-2 pb-2 relative overflow-hidden">
                  {analyticsLoading ? (
                    <div className="w-full text-center text-cyan-700">Loading...</div>
                  ) : (
                    <svg width="100%" height="100%" viewBox="0 0 320 120" preserveAspectRatio="none" className="w-full h-full">
                      {/* Signups */}
                      <rect x={40} y={120 - (conversionFunnel.signups / Math.max(conversionFunnel.signups, 1)) * 100} width={50} height={(conversionFunnel.signups / Math.max(conversionFunnel.signups, 1)) * 100} rx={25} fill="#06b6d4" className="transition-all duration-700 ease-in-out" />
                      <text x={65} y={120 - (conversionFunnel.signups / Math.max(conversionFunnel.signups, 1)) * 100 - 8} textAnchor="middle" fontSize="14" fill="#0369a1" className="font-bold">{conversionFunnel.signups}</text>
                      <text x={65} y={115} textAnchor="middle" fontSize="12" fill="#0369a1">Signups</text>
                      {/* Active */}
                      <rect x={135} y={120 - (conversionFunnel.active / Math.max(conversionFunnel.signups, 1)) * 100} width={50} height={(conversionFunnel.active / Math.max(conversionFunnel.signups, 1)) * 100} rx={25} fill="#0ea5e9" className="transition-all duration-700 ease-in-out" />
                      <text x={160} y={120 - (conversionFunnel.active / Math.max(conversionFunnel.signups, 1)) * 100 - 8} textAnchor="middle" fontSize="14" fill="#0369a1" className="font-bold">{conversionFunnel.active}</text>
                      <text x={160} y={115} textAnchor="middle" fontSize="12" fill="#0369a1">Active</text>
                      {/* Businesses */}
                      <rect x={230} y={120 - (conversionFunnel.businesses / Math.max(conversionFunnel.signups, 1)) * 100} width={50} height={(conversionFunnel.businesses / Math.max(conversionFunnel.signups, 1)) * 100} rx={25} fill="#14b8a6" className="transition-all duration-700 ease-in-out" />
                      <text x={255} y={120 - (conversionFunnel.businesses / Math.max(conversionFunnel.signups, 1)) * 100 - 8} textAnchor="middle" fontSize="14" fill="#0f766e" className="font-bold">{conversionFunnel.businesses}</text>
                      <text x={255} y={115} textAnchor="middle" fontSize="12" fill="#0f766e">Businesses</text>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
        {activeSection === 'communities' && (
          <section>
            <h2 className="text-xl font-bold mb-6 text-cyan-800">Community Management</h2>
            <div className="bg-white rounded-xl shadow p-6">Communities Table/List<br /><div className="h-40 bg-cyan-100 rounded mt-4" /></div>
            <div className="bg-white rounded-xl shadow p-6 mt-6">Assign/Demote Admins<br /><div className="h-20 bg-cyan-100 rounded mt-4" /></div>
          </section>
        )}
        {activeSection === 'users' && (
          <section>
            <h2 className="text-xl font-bold mb-6 text-cyan-800">User & Role Management</h2>
            <div className="bg-white rounded-xl shadow p-6">User Search/Filter<br /><div className="h-20 bg-cyan-100 rounded mt-4" /></div>
            <div className="bg-white rounded-xl shadow p-6 mt-6">Promote/Demote/Ban/Export<br /><div className="h-20 bg-cyan-100 rounded mt-4" /></div>
          </section>
        )}
        {activeSection === 'moderation' && (
          <section>
            <h2 className="text-xl font-bold mb-6 text-cyan-800">Content Moderation</h2>
            <div className="bg-white rounded-xl shadow p-6">Flagged Content Review<br /><div className="h-24 bg-cyan-100 rounded mt-4" /></div>
            <div className="bg-white rounded-xl shadow p-6 mt-6">Pending Listings/Activity Logs<br /><div className="h-24 bg-cyan-100 rounded mt-4" /></div>
          </section>
        )}
        {activeSection === 'features' && (
          <section>
            <h2 className="text-xl font-bold mb-6 text-cyan-800">Feature Toggles & Settings</h2>
            <div className="bg-white rounded-xl shadow p-6">Feature Toggles<br /><div className="h-20 bg-cyan-100 rounded mt-4" /></div>
            <div className="bg-white rounded-xl shadow p-6 mt-6">Platform Rules/Policies<br /><div className="h-20 bg-cyan-100 rounded mt-4" /></div>
          </section>
        )}
        {activeSection === 'messaging' && (
          <section>
            <h2 className="text-xl font-bold mb-6 text-cyan-800">Messaging & Notifications</h2>
            <div className="bg-white rounded-xl shadow p-6">Send Announcements<br /><div className="h-20 bg-cyan-100 rounded mt-4" /></div>
            <div className="bg-white rounded-xl shadow p-6 mt-6">Support Tickets/Help Requests<br /><div className="h-20 bg-cyan-100 rounded mt-4" /></div>
          </section>
        )}
        {activeSection === 'system' && (
          <section>
            <h2 className="text-xl font-bold mb-6 text-cyan-800">System Health</h2>
            <div className="bg-white rounded-xl shadow p-6">Uptime/Status Indicators<br /><div className="h-20 bg-cyan-100 rounded mt-4" /></div>
            <div className="bg-white rounded-xl shadow p-6 mt-6">Recent System Errors<br /><div className="h-20 bg-cyan-100 rounded mt-4" /></div>
          </section>
        )}
      </main>
    </div>
  );
} 