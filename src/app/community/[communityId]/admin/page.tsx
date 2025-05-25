"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function CommunityAdminDashboard() {
  const params = useParams();
  const communityId = params.communityId as string;
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [status, setStatus] = useState<"loading" | "unauthenticated" | "unauthorized" | "authorized">("loading");
  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<Array<{ 
    id: string; 
    username: string; 
    email: string; 
    avatar_url: string | null;
    status?: string | null;
    approval_status?: string;
    role?: string;
  }>>([]);
  const [posts, setPosts] = useState<Array<{
    id: string;
    title?: string;
    content?: string;
    is_pinned?: boolean;
    created_at?: string;
    author_id?: string;
  }>>([]);
  const [communityUuid, setCommunityUuid] = useState<string | null>(null);
  const [postSearch, setPostSearch] = useState('');
  const [approvalsTab, setApprovalsTab] = useState<'users' | 'businesses' | 'listings' | 'pendingBusinesses'>('users');
  const [pendingListings, setPendingListings] = useState<Array<{ id: string; title: string; type: string }>>([]);
  const [approvedBusinesses, setApprovedBusinesses] = useState<any[]>([]);
  const [approvedProperties, setApprovedProperties] = useState<any[]>([]);
  const [approvedMarketItems, setApprovedMarketItems] = useState<any[]>([]);
  const [pendingBusinesses, setPendingBusinesses] = useState<Array<{
    id: string;
    username: string;
    email: string;
    avatar_url?: string | null;
    bio?: string | null;
    signup_options?: string[] | null;
    created_at: string;
  }>>([]);
  const [analytics, setAnalytics] = useState<{
    dau: Array<{ date: string; count: number }>;
    totalPosts: number;
    totalListings: number;
  }>({
    dau: [],
    totalPosts: 0,
    totalListings: 0,
  });
  const [alerts, setAlerts] = useState<Array<{ id: string; title: string; message: string; created_at: string }>>([]);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [reports, setReports] = useState<Array<{ id: string; post_id: string; reason: string; created_at: string; reporter_id: string; post_title?: string }>>([]);

  useEffect(() => {
    const checkAdmin = async () => {
      setStatus("loading");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus("unauthenticated");
        return;
      }
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, username, role, community_id")
        .eq("id", user.id)
        .single();
      if (error || !profile) {
        setStatus("unauthorized");
        return;
      }
      // Only allow if role is 'community admin' and community_id matches
      if (profile.role === "community admin" && profile.community_id === communityId) {
        setProfile(profile);
        setStatus("authorized");
      } else {
        setStatus("unauthorized");
      }
    };
    checkAdmin();
    // eslint-disable-next-line
  }, [communityId]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (status === "authorized") {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("community_id", communityId);
        
        if (!error && data) {
          console.log('Profiles data:', data); // Debug: log the returned data
          setUsers(data);
        }
      }
    };
    fetchUsers();
  }, [status, communityId, supabase]);

  // Fetch pending business profiles
  useEffect(() => {
    const fetchPendingBusinesses = async () => {
      if (status === "authorized") {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, email, avatar_url, bio, signup_options, created_at")
          .eq("community_id", communityId)
          .eq("role", "business")
          .eq("approval_status", "pending")
          .order("created_at", { ascending: true });

        if (!error && data) {
          setPendingBusinesses(data);
        }
      }
    };
    fetchPendingBusinesses();
  }, [status, communityId, supabase]);

  // Fetch the community UUID from the slug
  useEffect(() => {
    const fetchCommunityUuid = async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('id')
        .eq('name', communityId)
        .single();
      if (data?.id) setCommunityUuid(data.id);
    };
    fetchCommunityUuid();
  }, [communityId, supabase]);

  // Fetch posts for Feed Management
  useEffect(() => {
    const fetchPosts = async () => {
      if (status === "authorized" && communityUuid) {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("community_id", communityUuid)
          .order("created_at", { ascending: false });
        if (error) {
          console.error('Supabase posts fetch error:', error);
        }
        if (!error && data) {
          setPosts(data.map(post => ({
            ...post,
            author_id: post.user_id
          })));
        }
      }
    };
    fetchPosts();
  }, [status, communityUuid, supabase]);

  // Fetch pending listings from properties and market_items
  useEffect(() => {
    const fetchPendingListings = async () => {
      if (!communityUuid) return;
      const [propertiesRes, marketRes] = await Promise.all([
        supabase.from('properties').select('id, title, approval_status, community_id').eq('approval_status', 'pending').eq('community_id', communityUuid),
        supabase.from('market_items').select('id, title, approval_status, community_id').eq('approval_status', 'pending').eq('community_id', communityUuid),
      ]);
      const properties = (propertiesRes.data || []).map((item: any) => ({ id: item.id, title: item.title, type: 'Property' }));
      const marketItems = (marketRes.data || []).map((item: any) => ({ id: item.id, title: item.title, type: 'Market Item' }));
      setPendingListings([...properties, ...marketItems]);
    };
    fetchPendingListings();
  }, [communityUuid]);

  // Fetch approved businesses, properties, and market items
  useEffect(() => {
    const fetchApproved = async () => {
      if (!communityUuid) return;
      const [bizRes, propRes, marketRes] = await Promise.all([
        supabase.from('profiles').select('id, username, email, avatar_url').eq('role', 'business').eq('approval_status', 'approved').eq('community_id', communityUuid),
        supabase.from('properties').select('id, title, approval_status, community_id').eq('approval_status', 'approved').eq('community_id', communityUuid),
        supabase.from('market_items').select('id, title, approval_status, community_id').eq('approval_status', 'approved').eq('community_id', communityUuid),
      ]);
      setApprovedBusinesses(bizRes.data || []);
      setApprovedProperties(propRes.data || []);
      setApprovedMarketItems(marketRes.data || []);
    };
    fetchApproved();
  }, [communityUuid]);

  // Approve user
  const handleApprove = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ approval_status: 'approved' })
      .eq('id', userId);
    setUsers(users => users.map(u => u.id === userId ? { ...u, approval_status: 'approved' } : u));
  };

  // Decline user
  const handleDecline = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ approval_status: 'declined' })
      .eq('id', userId);
    setUsers(users => users.map(u => u.id === userId ? { ...u, approval_status: 'declined' } : u));
  };

  // Pin/Unpin post
  const handleTogglePin = async (postId: string, currentPin: boolean) => {
    await supabase
      .from('posts')
      .update({ is_pinned: !currentPin })
      .eq('id', postId);
    setPosts(posts => posts.map(p => p.id === postId ? { ...p, is_pinned: !currentPin } : p));
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    setPosts(posts => posts.filter(p => p.id !== postId));
  };

  // Approve/Decline for listings
  const handleApproveListing = async (listing: { id: string; type: string }) => {
    const table = listing.type === 'Property' ? 'properties' : 'market_items';
    await supabase.from(table).update({ approval_status: 'approved' }).eq('id', listing.id);
    setPendingListings(listings => listings.filter(l => l.id !== listing.id));
  };
  const handleDeclineListing = async (listing: { id: string; type: string }) => {
    const table = listing.type === 'Property' ? 'properties' : 'market_items';
    await supabase.from(table).update({ approval_status: 'declined' }).eq('id', listing.id);
    setPendingListings(listings => listings.filter(l => l.id !== listing.id));
  };

  // Approve business
  const handleApproveBusiness = async (businessId: string) => {
    await supabase
      .from('profiles')
      .update({ approval_status: 'approved' })
      .eq('id', businessId);
    setPendingBusinesses(businesses => businesses.filter(b => b.id !== businessId));
  };

  // Decline business
  const handleDeclineBusiness = async (businessId: string) => {
    await supabase
      .from('profiles')
      .update({ approval_status: 'declined' })
      .eq('id', businessId);
    setPendingBusinesses(businesses => businesses.filter(b => b.id !== businessId));
  };

  // Remove business/listing
  const handleRemoveBusiness = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
    setApprovedBusinesses(biz => biz.filter((b: any) => b.id !== id));
  };
  const handleRemoveProperty = async (id: string) => {
    await supabase.from('properties').delete().eq('id', id);
    setApprovedProperties(props => props.filter((p: any) => p.id !== id));
  };
  const handleRemoveMarketItem = async (id: string) => {
    await supabase.from('market_items').delete().eq('id', id);
    setApprovedMarketItems(items => items.filter((i: any) => i.id !== id));
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!communityUuid) return;
      // DAU: count of distinct users per day for last 7 days
      const { data: dauData } = await supabase.rpc('get_dau', { community_id: communityUuid });
      // Total posts
      const { count: postCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', communityUuid);
      // Total listings (properties + market_items)
      const { count: propCount } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', communityUuid);
      const { count: marketCount } = await supabase
        .from('market_items')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', communityUuid);
      setAnalytics({
        dau: dauData || [],
        totalPosts: postCount || 0,
        totalListings: (propCount || 0) + (marketCount || 0),
      });
    };
    fetchAnalytics();
  }, [communityUuid]);

  // Fetch alerts for this community
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!communityUuid) return;
      const { data, error } = await supabase
        .from('community_alerts')
        .select('*')
        .eq('community_id', communityUuid)
        .order('created_at', { ascending: false });
      if (!error && data) setAlerts(data);
    };
    fetchAlerts();
  }, [communityUuid]);

  // Send alert
  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertLoading(true);
    setAlertError(null);
    setAlertSuccess(null);
    if (!alertTitle.trim() || !alertMessage.trim()) {
      setAlertError('Title and message are required.');
      setAlertLoading(false);
      return;
    }
    const { error } = await supabase.from('community_alerts').insert([
      {
        community_id: communityUuid,
        title: alertTitle.trim(),
        message: alertMessage.trim(),
      },
    ]);
    if (error) {
      setAlertError('Failed to send alert.');
    } else {
      setAlertSuccess('Alert sent!');
      setAlertTitle('');
      setAlertMessage('');
      // Refresh alerts
      const { data } = await supabase
        .from('community_alerts')
        .select('*')
        .eq('community_id', communityUuid)
        .order('created_at', { ascending: false });
      if (data) setAlerts(data);
    }
    setAlertLoading(false);
  };

  // Fetch reported posts for this community
  useEffect(() => {
    const fetchReports = async () => {
      if (!communityUuid) return;
      // Join post_reports with posts to get post title
      const { data, error } = await supabase
        .from('post_reports')
        .select('id, post_id, reason, created_at, reporter_id, posts(title)')
        .eq('posts.community_id', communityUuid)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setReports(data.map((r: any) => ({
          ...r,
          post_title: r.posts?.title || '(No Title)',
        })));
      }
    };
    fetchReports();
  }, [communityUuid]);

  // Dismiss report
  const handleDismissReport = async (reportId: string) => {
    await supabase.from('post_reports').delete().eq('id', reportId);
    setReports(reports => reports.filter(r => r.id !== reportId));
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-cyan-700">Loading...</div>;
  }
  if (status === "unauthenticated") {
    return <div className="min-h-screen flex items-center justify-center text-red-600">You must be logged in to access this page.</div>;
  }
  if (status === "unauthorized") {
    return <div className="min-h-screen flex items-center justify-center text-red-600">You are not authorized to access this community admin dashboard.</div>;
  }

  // Community Admin dashboard content (feature layout)
  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center py-10">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-cyan-100 p-8 flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-cyan-900 mb-2">{communityId} Community Admin Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-cyan-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-cyan-800">Users</div>
            <div className="text-2xl font-bold text-cyan-900">{users.filter(u => u.approval_status === 'approved').length}</div>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-cyan-800">Businesses</div>
            <div className="text-2xl font-bold text-cyan-900">--</div>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-cyan-800">Listings</div>
            <div className="text-2xl font-bold text-cyan-900">{approvedProperties.length + approvedMarketItems.length}</div>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-cyan-800">Reports</div>
            <div className="text-2xl font-bold text-cyan-900">{reports.length}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="bg-cyan-50 rounded-lg p-6">
            <div className="font-bold text-cyan-900 mb-4">All Community Users</div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-cyan-200">
                <thead className="bg-cyan-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-cyan-200">
                  {users.filter(user => user.approval_status === 'approved').map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.username}
                              className="h-8 w-8 rounded-full mr-3"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-cyan-200 flex items-center justify-center mr-3">
                              <span className="text-cyan-800 font-medium">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="text-sm font-medium text-cyan-900">{user.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800">{user.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="font-bold text-cyan-900 text-lg">Feed Management</div>
            <input
              type="text"
              value={postSearch}
              onChange={e => setPostSearch(e.target.value)}
              placeholder="Search posts by title or content..."
              className="border border-cyan-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              style={{ minWidth: 220 }}
            />
          </div>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-cyan-50 rounded-lg p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cyan-200">
                  <thead className="bg-cyan-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Content</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Pinned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-cyan-200">
                    {posts.filter(post => {
                      const term = postSearch.trim().toLowerCase();
                      if (!term) return true;
                      return (
                        (post.title && post.title.toLowerCase().includes(term)) ||
                        (post.content && post.content.toLowerCase().includes(term))
                      );
                    }).map((post) => (
                      <tr key={post.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-900">{post.title || '(No Title)'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800">{post.content?.slice(0, 60) || ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800">{post.is_pinned ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800 flex gap-2">
                          <button onClick={() => handleTogglePin(post.id, !!post.is_pinned)} className="bg-yellow-400 text-white px-3 py-1 rounded-md hover:bg-yellow-500">{post.is_pinned ? 'Unpin' : 'Pin'}</button>
                          <button onClick={() => handleDeletePost(post.id)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="bg-cyan-50 rounded-lg p-6 mb-8">
            <div className="font-bold text-cyan-900 mb-4 text-lg">Approvals Queue</div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setApprovalsTab('users')} className={`px-4 py-2 rounded font-semibold ${approvalsTab === 'users' ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-800'}`}>Pending Users</button>
              <button onClick={() => setApprovalsTab('businesses')} className={`px-4 py-2 rounded font-semibold ${approvalsTab === 'businesses' ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-800'}`}>Pending Businesses</button>
              <button onClick={() => setApprovalsTab('pendingBusinesses')} className={`px-4 py-2 rounded-md ${approvalsTab === 'pendingBusinesses' ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Pending Businesses ({pendingBusinesses.length})</button>
              <button onClick={() => setApprovalsTab('listings')} className={`px-4 py-2 rounded font-semibold ${approvalsTab === 'listings' ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-800'}`}>Pending Listings</button>
            </div>
            {/* Tab Content */}
            {approvalsTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cyan-200">
                  <thead className="bg-cyan-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-cyan-200">
                    {users.filter(user => user.approval_status === 'pending' && user.role !== 'business').map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="h-8 w-8 rounded-full mr-3"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-cyan-200 flex items-center justify-center mr-3">
                                <span className="text-cyan-800 font-medium">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="text-sm font-medium text-cyan-900">{user.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800">
                          <button onClick={() => handleApprove(user.id)} className="bg-green-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-green-600">Approve</button>
                          <button onClick={() => handleDecline(user.id)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Decline</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {approvalsTab === 'businesses' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cyan-200">
                  <thead className="bg-cyan-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Business</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-cyan-200">
                    {users.filter(user => user.approval_status === 'pending' && user.role === 'business').map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="h-8 w-8 rounded-full mr-3"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-cyan-200 flex items-center justify-center mr-3">
                                <span className="text-cyan-800 font-medium">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="text-sm font-medium text-cyan-900">{user.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800">
                          <button onClick={() => handleApprove(user.id)} className="bg-green-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-green-600">Approve</button>
                          <button onClick={() => handleDecline(user.id)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Decline</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {approvalsTab === 'pendingBusinesses' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-cyan-900">Pending Business Approvals</h3>
                {pendingBusinesses.length === 0 ? (
                  <p className="text-gray-600">No business accounts pending approval.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {pendingBusinesses.map((business) => (
                      <li key={business.id} className="py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img src={business.avatar_url || '/placeholder-avatar.png'} alt={business.username} className="w-12 h-12 rounded-full object-cover" />
                          <div>
                            <div className="text-sm font-medium text-cyan-900">{business.username}</div>
                            <div className="text-xs text-gray-600">{business.email}</div>
                            {business.bio && <div className="text-xs text-gray-700 mt-1">Bio: {business.bio}</div>}
                            {business.signup_options && business.signup_options.length > 0 && (
                              <div className="text-xs text-gray-700 mt-1">Interests: {business.signup_options.join(', ')}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">Joined: {new Date(business.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveBusiness(business.id)}
                            className="px-3 py-1 rounded bg-green-500 text-white text-sm hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeclineBusiness(business.id)}
                            className="px-3 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {approvalsTab === 'listings' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cyan-200">
                  <thead className="bg-cyan-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Listing</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-cyan-200">
                    {pendingListings.map((listing) => (
                      <tr key={listing.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-900">{listing.title || '(No Title)'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800">{listing.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800">
                          <button onClick={() => handleApproveListing(listing)} className="bg-green-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-green-600">Approve</button>
                          <button onClick={() => handleDeclineListing(listing)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Decline</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-cyan-50 rounded-lg p-6">
            <div className="font-bold text-cyan-900 mb-4">Analytics</div>
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-cyan-200 flex items-center justify-center mb-2 shadow-inner">
                  <span className="text-3xl font-bold text-cyan-900">{analytics.dau.length > 0 ? analytics.dau[analytics.dau.length-1].count : 0}</span>
                </div>
                <div className="text-cyan-800 font-semibold text-sm">DAU (Today)</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-teal-200 flex items-center justify-center mb-2 shadow-inner">
                  <span className="text-3xl font-bold text-teal-900">{analytics.totalPosts}</span>
                </div>
                <div className="text-teal-800 font-semibold text-sm">Total Posts</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-yellow-200 flex items-center justify-center mb-2 shadow-inner">
                  <span className="text-3xl font-bold text-yellow-900">{analytics.totalListings}</span>
                </div>
                <div className="text-yellow-800 font-semibold text-sm">Total Listings</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="font-semibold text-cyan-800 mb-1">DAU (last 7 days):</div>
              <ul className="text-cyan-800 text-xs grid grid-cols-2 md:grid-cols-4 gap-1">
                {analytics.dau.length === 0 && <li>No data</li>}
                {analytics.dau.map((d: any) => (
                  <li key={d.date} className="flex justify-between"><span>{d.date}:</span> <span className="font-bold ml-2">{d.count}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bg-cyan-50 rounded-lg p-6">
            <div className="font-bold text-cyan-900 mb-4">Alerts & Announcements</div>
            <form onSubmit={handleSendAlert} className="mb-6 space-y-3">
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Alert Title"
                value={alertTitle}
                onChange={e => setAlertTitle(e.target.value)}
                disabled={alertLoading}
                maxLength={100}
                required
              />
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Alert Message"
                value={alertMessage}
                onChange={e => setAlertMessage(e.target.value)}
                disabled={alertLoading}
                rows={3}
                maxLength={500}
                required
              />
              <button
                type="submit"
                className="w-full py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition font-semibold"
                disabled={alertLoading}
              >
                {alertLoading ? 'Sending...' : 'Send Alert'}
              </button>
              {alertError && <div className="text-xs text-red-500 mt-1">{alertError}</div>}
              {alertSuccess && <div className="text-xs text-green-600 mt-1">{alertSuccess}</div>}
            </form>
            <div className="font-semibold text-cyan-800 mb-2">Sent Alerts</div>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.length === 0 && <li className="text-cyan-700 text-sm">No alerts sent yet.</li>}
              {alerts.map(alert => (
                <li key={alert.id} className="bg-cyan-100 rounded px-4 py-2 border border-cyan-200">
                  <div className="font-bold text-cyan-900">{alert.title}</div>
                  <div className="text-cyan-800 text-sm mb-1">{alert.message}</div>
                  <div className="text-xs text-cyan-600">{new Date(alert.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Reports Section */}
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-cyan-100 p-8 mt-8">
          <div className="font-bold text-cyan-900 mb-4 text-lg">Reports</div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-cyan-200">
              <thead className="bg-cyan-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Post</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-cyan-200">
                {reports.length === 0 && (
                  <tr><td colSpan={4} className="text-cyan-700 text-sm px-6 py-4">No reports found.</td></tr>
                )}
                {reports.map(report => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-900">{report.post_title || ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800">{report.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-cyan-600">{new Date(report.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800 flex gap-2">
                      <a href={`/community/${communityId}/feed#post-${report.post_id}`} className="bg-cyan-200 text-cyan-900 px-3 py-1 rounded-md hover:bg-cyan-300">View Post</a>
                      <button onClick={() => handleDismissReport(report.id)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Dismiss</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 