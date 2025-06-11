"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ChevronDown, ChevronUp, List, HelpCircle, Megaphone, Calendar, BarChart3 } from "lucide-react";
import PostLeaseIcon from '@/components/icons/PostLeaseIcon';
import { UsersIcon, BuildingStorefrontIcon, HomeModernIcon, ShoppingCartIcon, ShieldExclamationIcon, UserPlusIcon, EyeIcon, CheckCircleIcon, XCircleIcon, TrashIcon, ArrowPathIcon,ChevronDownIcon, ChevronUpIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { LocationVerificationRequest, VerificationRequestWithProfile } from "@/types/admin";
import LocationVerificationDetailsModal from "@/components/admin/LocationVerificationDetailsModal";

// Corrected ApprovalsTab type to include all used literals plus the new one
type ApprovalsTab = 
  'members' | 
  'businesses' | 
  'newBusinessPageLaunch' | 
  'propertyListings' | 
  'marketListings' | 
  'reports' | 
  'settings' | 
  'feed' | 
  'locationVerification'; 

type ActiveSubTab = 'pending' | 'approved' | 'rejected' | 'all' | null;

interface Report {
  id: string;
  created_at: string;
  reason: string;
  reporter_id: string;
  reporter_username?: string;
  post_id: string;
  post_content_preview?: string; // first 100 chars of post text_content or title
  post_author_id?: string;
  post_author_username?: string;
  post_type?: string;
  communityUuid: string;
}

interface ReportsData {
  reports: Report[];
  totalCount: number;
  totalPages: number;
}

interface CommunityMember {
  id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  communityUuid: string;
}

export default function CommunityAdminDashboard() {
  const params = useParams();
  const communityId = params?.communityId as string;
  const router = useRouter();
  const supabase = createClient();
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
    created_at?: string;
  }>>([]);
  const [posts, setPosts] = useState<Array<{
    id: string;
    title?: string;
    content?: string;
    is_pinned?: boolean;
    created_at?: string;
    author_id?: string;
    post_type?: string;
  }>>([]);
  const [communityUuid, setCommunityUuid] = useState<string | null>(null);
  const [postSearch, setPostSearch] = useState('');
  const [approvalsTab, setApprovalsTab] = useState<ApprovalsTab>('members');
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
  const [reports, setReports] = useState<Array<{ 
    id: string; 
    post_id: string; 
    reason: string; 
    created_at: string; 
    reporter_id: string; 
    post_title?: string; 
    post_content?: string; 
    reporter_username?: string; 
    post_author_username?: string; 
    original_post?: any; 
  }>>([]);
  const [pendingDirectoryBusinesses, setPendingDirectoryBusinesses] = useState<any[]>([]);
  const [feedManagementExpanded, setFeedManagementExpanded] = useState(false);
  const [approvedDirectoryBusinesses, setApprovedDirectoryBusinesses] = useState<any[]>([]);
  const [showMembersTable, setShowMembersTable] = useState(false);
  const [incidentReportCount, setIncidentReportCount] = useState<number>(0);
  const [membersJoinedToday, setMembersJoinedToday] = useState(0);
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [reportsData, setReportsData] = useState<ReportsData>({ reports: [], totalCount: 0, totalPages: 1 });
  const [pendingLocationVerifications, setPendingLocationVerifications] = useState<VerificationRequestWithProfile[]>([]);
  const [viewingRequestDetails, setViewingRequestDetails] = useState<LocationVerificationRequest | null>(null);
  const [isViewRequestModalVisible, setIsViewRequestModalVisible] = useState(false);

  // State for the displayable community name
  const [communityDisplayName, setCommunityDisplayName] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const joinedTodayCount = useMemo(() => users.filter(u => u.approval_status === 'approved' && u.created_at && u.created_at.slice(0, 10) === today).length, [users, today]);
  const leaseCount = posts.filter(p => p.post_type === 'lease').length;

  if (!communityId) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Community ID is missing from URL.</div>;
  }

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
        console.error('Profile fetch error:', error);
        setStatus("unauthorized");
        return;
      }
      
      console.log('User profile:', profile);
      console.log('Checking against communityId:', communityId);
      
      // Check if communityId is UUID or name
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // Only allow if role is 'community admin' and community_id matches
      if (profile.role === "community admin") {
        if (uuidPattern.test(communityId) && profile.community_id === communityId) {
          // Direct UUID match
          console.log('[AdminPage] Authorized: UUID match');
          setProfile(profile);
          setStatus("authorized");
          setCommunityUuid(communityId);
        } else { // Covers non-UUIDs or UUIDs that don't match the admin's community
          console.log('[AdminPage] Unauthorized: communityId in URL is not a valid and matching UUID for this admin.');
          setStatus("unauthorized");
        }
      } else {
        console.log('Unauthorized: not an admin');
        setStatus("unauthorized");
      }
    };
    checkAdmin();
    // eslint-disable-next-line
  }, [communityId]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (status === "authorized" && communityUuid) {
        console.log(`[Admin] Fetching users for communityUuid: ${communityUuid}`);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("community_id", communityUuid);
        
        if (error) {
          console.error("[Admin] Error fetching users:", error);
          setUsers([]);
        } else if (data) {
          console.log('[Admin] Fetched profiles data:', data);
          setUsers(data);
        } else {
          setUsers([]);
        }
      } else {
        console.log("[Admin] Skipping fetchUsers: not authorized or no communityUuid.");
        setUsers([]);
      }
    };
    fetchUsers();
  }, [status, communityUuid, supabase]);

  // useEffect to fetch the community display name once communityUuid is known and user is authorized
  useEffect(() => {
    if (status === "authorized" && communityUuid && supabase) {
      const fetchCommunityName = async () => {
        try {
          const { data: communityData, error } = await supabase
            .from('communities')
            .select('name, slug') // Fetch both name and slug, can decide which to use later
            .eq('id', communityUuid)
            .single();

          if (error) {
            console.error("[Admin] Error fetching community details for display name:", error);
            setCommunityDisplayName(communityUuid); // Fallback to UUID if name fetch fails
            return;
          }

          if (communityData) {
            // Prefer name, fallback to slug if name is null/empty, then to UUID
            setCommunityDisplayName(communityData.name || communityData.slug || communityUuid);
          } else {
            setCommunityDisplayName(communityUuid); // Fallback to UUID if no data
          }
        } catch (e) {
          console.error("[Admin] Exception fetching community display name:", e);
          setCommunityDisplayName(communityUuid); // Fallback to UUID on exception
        }
      };
      fetchCommunityName();
    }
  }, [status, communityUuid, supabase]);

  // Fetch pending business profiles
  useEffect(() => {
    const fetchPendingBusinesses = async () => {
      if (status === "authorized" && communityUuid) {
        console.log(`[Admin] Fetching pending businesses for communityUuid: ${communityUuid}`);
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, email, avatar_url, bio, created_at")
          .eq("community_id", communityUuid)
          .eq("role", "business")
          .eq("approval_status", "pending")
          .order("created_at", { ascending: true });

        if (error) {
          console.error("[Admin] Error fetching pending businesses:", error);
          setPendingBusinesses([]);
        } else if (data) {
          setPendingBusinesses(data);
        } else {
          setPendingBusinesses([]);
        }
      } else {
        console.log("[Admin] Skipping fetchPendingBusinesses: not authorized or no communityUuid.");
        setPendingBusinesses([]);
      }
    };
    fetchPendingBusinesses();
  }, [status, communityUuid, supabase]);

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
      if (!communityUuid) {
        console.log('Community UUID not available yet');
        return;
      }
      
      console.log('Fetching pending listings for community:', communityUuid);
      
      try {
        const [propertiesRes, marketRes] = await Promise.all([
          supabase.from('properties').select('id, title, approval_status, community_id').eq('approval_status', 'pending').eq('community_id', communityUuid),
          supabase.from('market_items').select('id, title, approval_status, community_id').eq('approval_status', 'pending').eq('community_id', communityUuid),
        ]);
        
        console.log('Pending properties response:', propertiesRes);
        
        if (propertiesRes.error) {
          console.error('Error fetching properties:', propertiesRes.error);
        }
        
        const properties = (propertiesRes.data || []).map((item: any) => ({ id: item.id, title: item.title, type: 'Property' }));
        const marketItems = (marketRes.data || []).map((item: any) => ({ id: item.id, title: item.title, type: 'Market Item' }));
        
        console.log('Mapped properties:', properties);
        console.log('Mapped market items:', marketItems);
        
        setPendingListings([...properties, ...marketItems]);
      } catch (error) {
        console.error('Error in fetchPendingListings:', error);
      }
    };
    
    fetchPendingListings();
    
    // Set up a timer to refetch data periodically
    const interval = setInterval(fetchPendingListings, 10000);
    
    return () => clearInterval(interval);
  }, [communityUuid, supabase]);

  // Fetch approved businesses, properties, and market items
  useEffect(() => {
    const fetchApproved = async () => {
      if (!communityUuid) return;
      const [bizRes, propRes, marketRes] = await Promise.all([
        supabase
          .from('businesses')
          .select('id, name, description, phone, email, address, city, category, website, logo_url, banner_url, created_at, user_id')
          .eq('approval_status', 'approved')
          .eq('community_id', communityUuid),
        supabase
          .from('properties')
          .select('id, title, approval_status, community_id')
          .eq('approval_status', 'approved')
          .eq('community_id', communityUuid),
        supabase
          .from('market_items')
          .select('id, title, approval_status, community_id')
          .eq('approval_status', 'approved')
          .eq('community_id', communityUuid),
      ]);
      setApprovedBusinesses(bizRes.data || []);
      setApprovedProperties(propRes.data || []);
      setApprovedMarketItems(marketRes.data || []);
    };
    fetchApproved();
  }, [communityUuid]);

  // Fetch approved local directory businesses from profiles
  useEffect(() => {
    const fetchApprovedDirectoryBusinesses = async () => {
      if (!communityUuid) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_approved', true)
        .eq('role', 'business')
        .eq('community_id', communityUuid);
      if (!error && data) setApprovedDirectoryBusinesses(data);
    };
    fetchApprovedDirectoryBusinesses();
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
    setApprovedMarketItems(prev => prev.filter(item => item.id !== id));
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!communityUuid) return;
      // DAU: count of distinct users per day for last 7 days
      const { data: dauData } = await supabase.rpc('fetch_daily_active_users', { community_id_param: communityUuid });
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
    const fetchReportsData = async () => {
      if (status === "authorized" && communityUuid && approvalsTab === 'reports') {
        console.log("Fetching reports for community:", communityUuid);
        const { data: reportsData, error: reportsError } = await supabase
        .from('post_reports')
          .select(
            'id, post_id, reason, created_at, reporter_id, profile_reporter:profiles!post_reports_reporter_id_fkey(username), post:posts(id, title, content, user_id, profile_author:profiles!posts_user_id_fkey(username))'
          )
          .eq('post.community_id', communityUuid)
        .order('created_at', { ascending: false });

        if (reportsError) {
          console.error('Error fetching reports:', reportsError);
          setReports([]);
          return;
        }

        if (reportsData) {
          console.log("Fetched reports data:", reportsData);
          const formattedReports = reportsData.map((report: any) => ({
            id: report.id,
            post_id: report.post_id,
            reason: report.reason,
            created_at: report.created_at,
            reporter_id: report.reporter_id,
            reporter_username: report.profile_reporter?.username || 'Unknown Reporter',
            post_content: report.post?.content || 'Content not available',
            post_author_username: report.post?.profile_author?.username || 'Unknown Author',
            post_title: report.post?.title || '(No Title)',
            original_post: report.post
          }));
          setReports(formattedReports);
        } else {
          setReports([]);
        }
      }
    };
    if (approvalsTab !== 'reports') {
        setReports([]);
    }
    fetchReportsData();
  }, [status, communityUuid, supabase, approvalsTab]);

  // Dismiss report
  const handleDismissReport = async (reportId: string) => {
    await supabase.from('post_reports').delete().eq('id', reportId);
    setReports(reports => reports.filter(r => r.id !== reportId));
  };

  // Fetch pending local directory businesses from 'profiles' table with is_approved = false
  useEffect(() => {
    const fetchPendingDirectoryBusinesses = async () => {
      if (status === "authorized" && communityUuid) {
        console.log(`[Admin] Fetching pending directory businesses for communityUuid: ${communityUuid}`);
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, email, avatar_url, bio, is_approved, created_at")
          .eq("is_approved", false)
          .eq("role", "business")
          .eq("community_id", communityUuid);
        
        if (error) {
          console.error("[Admin] Error fetching pending directory businesses:", error);
          setPendingDirectoryBusinesses([]);
        } else if (data) {
          console.log('[Admin] Fetched pending directory businesses:', data);
          setPendingDirectoryBusinesses(data);
        } else {
          setPendingDirectoryBusinesses([]);
        }
      } else {
        console.log("[Admin] Skipping fetchPendingDirectoryBusinesses: not authorized or no communityUuid.");
        setPendingDirectoryBusinesses([]);
      }
    };
    fetchPendingDirectoryBusinesses();
  }, [status, communityUuid, supabase]);

  const fetchInitialReportCount = useCallback(async (uuid: string) => {
    if (!supabase || !uuid) return;
    try {
      const { count, error: countError } = await supabase
        .from('post_reports')
        .select('id, posts!inner(community_id)', { count: 'exact', head: true })
        .eq('posts.community_id', uuid);

      if (countError) {
        console.error('Error fetching initial report count:', countError);
        setIncidentReportCount(0);
      } else {
        setIncidentReportCount(count ?? 0);
      }
    } catch (e) {
      console.error('Error in fetchInitialReportCount:', e);
      setIncidentReportCount(0);
    }
  }, [supabase]);

  useEffect(() => {
    if (communityUuid) {
      fetchInitialReportCount(communityUuid);
    }
  }, [communityUuid, fetchInitialReportCount]);

  // Fetch pending location verification requests
  const fetchPendingLocationVerifications = useCallback(async () => {
    if (status !== "authorized" || !communityUuid) {
      // console.log("[Admin] Skipping fetchPendingLocationVerifications: not authorized or no communityUuid."); // Keep this minimal log or remove if too verbose
      return;
    }

    const { data, error } = await supabase
      .from('verification_requests')
      .select(`
        id,
        user_id,
        address_line1,
        city,
        postal_code,
        country,
        status,
        created_at,
        profile:profiles!left (
          username,
          email,
          avatar_url,
          community_id 
        )
      `)
      .eq('status', 'pending')
      .eq('profile.community_id', communityUuid) // Ensure this filter is active
      .order('created_at', { ascending: true })
      .returns<VerificationRequestWithProfile[]>();

    if (error) {
      console.error("[Admin] fetchPendingLocationVerifications - Error encountered:", error);
      setPendingLocationVerifications([]);
    } else if (data) { 
      setPendingLocationVerifications(data); 
    } else {
      setPendingLocationVerifications([]);
    }
  }, [supabase, status, communityUuid]);

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

  // Fetch pending location verifications when tab is active or dependencies change
  useEffect(() => {
    if (approvalsTab === 'locationVerification' && status === "authorized" && communityUuid) {
      fetchPendingLocationVerifications();
    }
  }, [approvalsTab, status, communityUuid, fetchPendingLocationVerifications]);

  // Handler to approve a location verification request
  const handleApproveLocationVerification = async (requestId: string, userId: string) => {
    console.log(`[Admin] Attempting to APPROVE location verification. Request ID: ${requestId}, User ID: ${userId}`);
    // 1. Update verification_requests table: status to 'approved'
    const { error: requestError } = await supabase
      .from('verification_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (requestError) {
      console.error("[Admin] Error approving location verification request (updating verification_requests table):", requestError);
      return;
    }
    console.log("[Admin] Successfully updated verification_requests status to 'approved' for request ID:", requestId);

    // 2. Update profiles table: is_location_verified to true
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_location_verified: true })
      .eq('id', userId);

    if (profileError) {
      console.error("[Admin] Error updating profile for location verification (updating profiles table):", profileError);
    }
    console.log("[Admin] Successfully updated profiles table is_location_verified to true for user ID:", userId);

    // Optimistically update the UI
    setPendingLocationVerifications(prevRequests => prevRequests.filter(req => req.id !== requestId));
    console.log("[Admin] Optimistically removed item from list. Explicit refetch skipped.");
  };

  // Handler to reject a location verification request
  const handleRejectLocationVerification = async (requestId: string) => {
    console.log(`[Admin] Attempting to REJECT location verification. Request ID: ${requestId}`);
    const { error } = await supabase
      .from('verification_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      console.error("[Admin] Error rejecting location verification request:", error);
      return;
    }
    console.log("[Admin] Successfully updated verification_requests status to 'rejected' for request ID:", requestId);

    // Optimistically update the UI
    setPendingLocationVerifications(prevRequests => prevRequests.filter(req => req.id !== requestId));
    console.log("[Admin] Optimistically removed item from list. Explicit refetch skipped.");
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
  const allCount = posts.length;
  const askCount = posts.filter(p => p.post_type === 'ask').length;
  const announceCount = posts.filter(p => p.post_type === 'announce').length;
  const eventCount = posts.filter(p => p.post_type === 'event').length;
  const pollCount = posts.filter(p => p.post_type === 'poll').length;

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center py-10">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-cyan-100 p-8 flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-cyan-900 mb-2">{communityDisplayName} Community Admin Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-cyan-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-cyan-800">Community Members</div>
            <div className="text-2xl font-bold text-cyan-900">{users.filter(u => u.approval_status === 'approved').length}</div>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-cyan-800">Business Listings</div>
            <div className="text-2xl font-bold text-cyan-900">{approvedDirectoryBusinesses.length}</div>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-cyan-800">Property Listings</div>
            <div className="text-2xl font-bold text-cyan-900">{approvedProperties.length}</div>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-cyan-800">Market Listings</div>
            <div className="text-2xl font-bold text-cyan-900">{approvedMarketItems.length}</div>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-cyan-800">Incident Reports</div>
            <div className="text-2xl font-bold text-cyan-900">{reports.length}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="bg-cyan-50 rounded-lg p-6">
            <div className="font-bold text-cyan-900 mb-4 flex items-center cursor-pointer select-none" onClick={() => setShowMembersTable((v) => !v)}>
              <span>All Community Members</span>
              <span className="ml-2 text-xs font-semibold text-cyan-600">(Joined Today: {joinedTodayCount})</span>
              <span className="ml-2">{showMembersTable ? <ChevronUp className="inline w-5 h-5" /> : <ChevronDown className="inline w-5 h-5" />}</span>
            </div>
            {showMembersTable && (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {users
                  .filter(u => u.approval_status === 'approved')
                  .map((user) => (
                    <Link key={user.id} href={`/profile/${user.id}`} passHref legacyBehavior>
                      <a className="flex items-center justify-between p-2.5 bg-white hover:bg-cyan-100 rounded-lg shadow cursor-pointer">
                        <div className="flex items-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} className="h-8 w-8 rounded-full mr-3 object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-cyan-200 flex items-center justify-center mr-3">
                              <span className="text-cyan-800 font-medium">{(user.username || '').charAt(0)}</span>
                            </div>
                          )}
                          <div className="text-sm font-medium text-cyan-900">{user.username}</div>
                        </div>
                        <span className="text-sm text-cyan-800">{user.email}</span>
                      </a>
                    </Link>
                  ))}
            </div>
            )}
          </div>
        </div>
        <>
          <div className="mb-4 flex items-center justify-between">
            <div 
              className="font-bold text-cyan-900 text-lg flex items-center cursor-pointer"
              onClick={() => setFeedManagementExpanded(!feedManagementExpanded)}
            >
              {feedManagementExpanded ? (
                <ChevronUp className="h-5 w-5 mr-1 text-cyan-900" />
              ) : (
                <ChevronDown className="h-5 w-5 mr-1 text-cyan-900" />
              )}
              Feed Management
              <div className="flex items-center gap-2 ml-4">
                <span className="flex items-center gap-1"><List className="w-6 h-6 text-cyan-700" /><span className="text-xs text-cyan-700 font-semibold">{allCount}</span></span>
                <span className="flex items-center gap-1"><PostLeaseIcon className="w-8 h-8 text-cyan-700" /><span className="text-xs text-cyan-700 font-semibold">{leaseCount}</span></span>
                <span className="flex items-center gap-1"><HelpCircle className="w-6 h-6 text-blue-500" /><span className="text-xs text-blue-600 font-semibold">{askCount}</span></span>
                <span className="flex items-center gap-1"><Megaphone className="w-6 h-6 text-yellow-500" /><span className="text-xs text-yellow-600 font-semibold">{announceCount}</span></span>
                <span className="flex items-center gap-1"><Calendar className="w-6 h-6 text-purple-500" /><span className="text-xs text-purple-600 font-semibold">{eventCount}</span></span>
                <span className="flex items-center gap-1"><BarChart3 className="w-6 h-6 text-green-500" /><span className="text-xs text-green-600 font-semibold">{pollCount}</span></span>
              </div>
            </div>
            {feedManagementExpanded && (
              <input
                type="text"
                value={postSearch}
                onChange={e => setPostSearch(e.target.value)}
                placeholder="Search posts by title or content..."
                className="border border-cyan-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                style={{ minWidth: 220 }}
              />
            )}
          </div>
          {feedManagementExpanded && (
            <div className="grid grid-cols-1 gap-6 mb-6">
              <div className="bg-cyan-50 rounded-lg p-6">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-cyan-200">
                    <thead className="bg-cyan-100 sticky top-0">
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
                            {profile?.role === 'community admin' || profile?.role === 'superadmin' ? (
                            <button onClick={() => handleTogglePin(post.id, !!post.is_pinned)} className="bg-yellow-400 text-white px-3 py-1 rounded-md hover:bg-yellow-500">{post.is_pinned ? 'Unpin' : 'Pin'}</button>
                            ) : null}
                            <button onClick={() => handleDeletePost(post.id)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          <div className="bg-cyan-50 rounded-lg p-6 mb-8">
            <div className="font-bold text-cyan-900 mb-4 text-lg">Approvals Queue</div>
            <div className="text-xs text-gray-500 mb-2">
              Debug Info: Active Tab: {approvalsTab} | 
              Pending Properties: {pendingListings.filter(l => l.type === 'Property').length} | 
              All Listings: {pendingListings.length} | 
              Community ID: {communityId} | 
              Community UUID: {communityUuid}
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setApprovalsTab('members')} className={`px-4 py-2 rounded font-semibold ${approvalsTab === 'members' ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-800'}`}>
                Pending Users
                {users.filter(user => user.approval_status === 'pending' && user.role !== 'business').length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {users.filter(user => user.approval_status === 'pending' && user.role !== 'business').length}
                  </span>
                )}
              </button>
              <button onClick={() => setApprovalsTab('businesses')} className={`px-4 py-2 rounded font-semibold ${approvalsTab === 'businesses' ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-800'}`}>
                Pending New Business Registration
                {users.filter(user => user.approval_status === 'pending' && user.role === 'business').length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {users.filter(user => user.approval_status === 'pending' && user.role === 'business').length}
                  </span>
                )}
              </button>
              <button onClick={() => setApprovalsTab('newBusinessPageLaunch')} className={`px-4 py-2 rounded font-semibold ${approvalsTab === 'newBusinessPageLaunch' ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-800'}`}>
                New business listing approval
                {pendingDirectoryBusinesses.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {pendingDirectoryBusinesses.length}
                  </span>
                )}
              </button>
              <button onClick={() => setApprovalsTab('propertyListings')} className={`px-4 py-2 rounded font-semibold ${approvalsTab === 'propertyListings' ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-800'}`}>
                New Property Listing Approval
                {pendingListings.filter(listing => listing.type === 'Property').length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {pendingListings.filter(listing => listing.type === 'Property').length}
                  </span>
                )}
              </button>
              <button onClick={() => setApprovalsTab('marketListings')} className={`px-4 py-2 rounded font-semibold ${approvalsTab === 'marketListings' ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-800'}`}>
                New Market Listing Approval
                {pendingListings.filter(listing => listing.type === 'Market Item').length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {pendingListings.filter(listing => listing.type === 'Market Item').length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setApprovalsTab('locationVerification')} 
                className={`px-4 py-2 rounded font-semibold ${approvalsTab === 'locationVerification' ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-800'}`}>
                Location Verification Approval
                {pendingLocationVerifications.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {pendingLocationVerifications.length}
                  </span>
                )}
              </button>
              <button onClick={() => setApprovalsTab('reports')} className={`px-4 py-2 rounded font-semibold ${approvalsTab === 'reports' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>
                Review Reports
                {reports.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-orange-500 rounded-full">
                    {reports.length}
                  </span>
                )}
              </button>
            </div>
            {/* Tab Content */}
            {approvalsTab === 'members' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-cyan-900">Pending Users Approval</h3>
                {users.filter(user => user.approval_status === 'pending' && user.role !== 'business').length === 0 ? (
                  <p className="text-gray-600">No users pending approval.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {users.filter(user => user.approval_status === 'pending' && user.role !== 'business').map((user) => (
                      <li key={user.id} className="py-4 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-cyan-900">{user.username}</div>
                          <div className="text-xs text-gray-600">{user.email}</div>
                          <div className="text-xs text-gray-500 mt-1">Created: {user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</div>
                              </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(user.id)} className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">Approve</button>
                          <button onClick={() => handleDecline(user.id)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Reject</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                          </div>
            )}
            {/* Location Verification Approval Tab Content */}
            {approvalsTab === 'locationVerification' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-cyan-900">Pending Location Verifications</h3>
                {pendingLocationVerifications.length === 0 ? (
                  <p className="text-gray-600">No location verifications pending approval.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {pendingLocationVerifications.map((req) => (
                      <li key={req.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div className="flex items-center mb-2 sm:mb-0">
                          {req.profile?.avatar_url ? (
                            <img src={req.profile.avatar_url} alt={req.profile.username || 'User avatar'} className="w-10 h-10 rounded-full mr-3" />
                          ) : (
                            <UserCircleIcon className="w-10 h-10 text-gray-400 mr-3" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-cyan-900">{req.profile?.username || 'N/A'}</div>
                            <div className="text-xs text-gray-600">Email: {req.profile?.email || 'N/A'}</div>
                            <div className="text-xs text-gray-500 mt-1">User ID: {req.user_id}</div>
                          </div>
                        </div>
                        <div className="mb-2 sm:mb-0 sm:ml-4 flex-grow">
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold">Address:</span> {req.address_line1}, {req.city}, {req.postal_code}, {req.country}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Submitted: {new Date(req.created_at).toLocaleString()}</div> 
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button 
                            onClick={() => handleApproveLocationVerification(req.id, req.user_id)}
                            className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 text-sm">Approve</button>
                          <button onClick={() => handleRejectLocationVerification(req.id)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm">Reject</button>
                          <button 
                            onClick={() => {
                              setViewingRequestDetails(req);
                              setIsViewRequestModalVisible(true);
                            }}
                            className="bg-cyan-200 text-cyan-900 px-3 py-1 rounded-md hover:bg-cyan-300 text-sm">View</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {approvalsTab === 'businesses' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cyan-200">
                  <thead className="bg-cyan-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Business</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-cyan-200">
                    {approvedBusinesses.map((biz) => (
                      <tr key={biz.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-900">{biz.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-800">{biz.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {approvalsTab === 'newBusinessPageLaunch' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-cyan-900">Pending Local Directory Businesses Approval</h3>
                {pendingDirectoryBusinesses.length === 0 ? (
                  <p className="text-gray-600">No local directory businesses pending launch.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {pendingDirectoryBusinesses.map((biz) => (
                      <li key={biz.id} className="py-4 flex items-center justify-between">
                          <div>
                          <div className="text-sm font-medium text-cyan-900">{biz.username}</div>
                          <div className="text-xs text-gray-600">Business account</div>
                          <div className="text-xs text-gray-500 mt-1">Created: {new Date(biz.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            await supabase.from('profiles').update({ is_approved: true }).eq('id', biz.id);
                            setPendingDirectoryBusinesses(list => list.filter(b => b.id !== biz.id));
                          }} className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">Approve</button>
                          <button onClick={async () => {
                            await supabase.from('profiles').delete().eq('id', biz.id);
                            setPendingDirectoryBusinesses(list => list.filter(b => b.id !== biz.id));
                          }} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Reject</button>
                          <a href={`/business/dashboard?profile=${biz.id}`} className="bg-cyan-200 text-cyan-900 px-3 py-1 rounded-md hover:bg-cyan-300 text-sm">View</a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {/* Reports Tab Content */}
            {approvalsTab === 'reports' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-red-900">Post Reports</h3>
                {reports.length === 0 ? (
                  <p className="text-gray-600">No reported posts to review.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {reports.map((report) => (
                      <li key={report.id} className="py-4 px-4 bg-white rounded-lg shadow-sm mb-4 border-l-4 border-red-500">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-red-800">Report #{report.id.substring(0, 8)}</h4>
                            <p className="text-xs text-gray-500">
                              Reported {new Date(report.created_at).toLocaleString()} by {report.reporter_username}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleDismissReport(report.id)} 
                              className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300 text-sm"
                            >
                              Dismiss
                            </button>
                            <button 
                              onClick={() => {
                                // Handle delete post
                                handleDeletePost(report.post_id);
                                handleDismissReport(report.id);
                              }} 
                              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm"
                            >
                              Delete Post
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-red-50 p-3 rounded-md mb-3">
                          <div className="flex items-center mb-1">
                            <span className="font-medium text-red-800 mr-2">Reason:</span>
                            <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-xs">
                              {report.reason}
                            </span>
                          </div>
                          {report.details && (
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">Details:</span> {report.details}
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">Post by:</span> 
                            <span className="ml-1">{report.post_author_username}</span>
                          </div>
                          
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">Post title:</span>
                            <div className="ml-1 text-gray-800">{report.post_title}</div>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Post content:</span>
                            <div className="ml-1 text-gray-800 whitespace-pre-wrap mt-1 border-l-2 border-gray-200 pl-3">
                              {report.post_content?.substring(0, 200)}
                              {report.post_content && report.post_content.length > 200 ? '...' : ''}
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <a 
                              href={`/community/${communityUuid}/feed?post=${report.post_id}`}
                              target="_blank"
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:underline text-sm flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              View Full Post
                            </a>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
                </div>
        </>
      </div>
    </div>
  );
} 