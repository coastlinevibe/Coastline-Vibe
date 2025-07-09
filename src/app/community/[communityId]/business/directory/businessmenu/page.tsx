"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from 'next/link';
import { ChevronDown, ChevronUp, Bell, Star, MessageSquare, Calendar, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Define notification types
interface Notification {
  id: string;
  type: 'business' | 'review' | 'inquiry' | 'booking' | 'friend' | 'community' | 'property' | 'marketplace' | 'feed';
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
  source_id?: string;
  source_type?: string;
  action_url?: string;
}

export default function BusinessMenuPage() {
  const params = useParams();
  const communityId = params?.communityId as string || '';
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [businessNotifications, setBusinessNotifications] = useState<Notification[]>([]);
  const [reviewNotifications, setReviewNotifications] = useState<Notification[]>([]);
  const [inquiryNotifications, setInquiryNotifications] = useState<Notification[]>([]);
  const [bookingNotifications, setBookingNotifications] = useState<Notification[]>([]);
  const [friendNotifications, setFriendNotifications] = useState<Notification[]>([]);
  const [communityNotifications, setCommunityNotifications] = useState<Notification[]>([]);
  const [propertyNotifications, setPropertyNotifications] = useState<Notification[]>([]);
  const [marketplaceNotifications, setMarketplaceNotifications] = useState<Notification[]>([]);
  const [feedNotifications, setFeedNotifications] = useState<Notification[]>([]);
  
  // Collapse states
  const [businessCollapsed, setBusinessCollapsed] = useState(false);
  const [reviewsCollapsed, setReviewsCollapsed] = useState(false);
  const [inquiriesCollapsed, setInquiriesCollapsed] = useState(false);
  const [bookingsCollapsed, setBookingsCollapsed] = useState(false);
  const [friendsCollapsed, setFriendsCollapsed] = useState(false);
  const [communityCollapsed, setCommunityCollapsed] = useState(false);
  const [propertyCollapsed, setPropertyCollapsed] = useState(false);
  const [marketplaceCollapsed, setMarketplaceCollapsed] = useState(false);
  const [feedCollapsed, setFeedCollapsed] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!profile) {
        router.push("/");
        return;
      }
      if (profile.role !== "business") {
        router.push("/");
        return;
      }
      setProfile(profile);
      setLoading(false);
      
      // Fetch notifications after profile is loaded
      fetchNotifications(user.id);
    };
    
    fetchProfile();
  }, [supabase, router, communityId]);
  
  // Fetch notifications
  const fetchNotifications = async (userId: string) => {
    setNotificationsLoading(true);
    
    try {
      // In a real app, this would fetch from a notifications table
      // For now, we'll use mock data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'business',
          title: 'Business Profile Verified',
          content: 'Your business profile has been verified by the community admin.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          is_read: false,
          action_url: `/community/${communityId}/business/directory/my-businesses`
        },
        {
          id: '2',
          type: 'review',
          title: 'New 5-Star Review',
          content: 'John D. left a 5-star review for your business.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
          is_read: false,
          source_id: 'review-123',
          action_url: `/community/${communityId}/business/reviews`
        },
        {
          id: '3',
          type: 'inquiry',
          title: 'New Business Inquiry',
          content: 'Sarah M. has a question about your business hours.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
          is_read: true,
          source_id: 'inquiry-456',
          action_url: `/community/${communityId}/business/inquiries`
        },
        {
          id: '4',
          type: 'booking',
          title: 'Appointment Confirmed',
          content: 'Appointment #1234 has been confirmed for tomorrow at 2:00 PM.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          is_read: true,
          source_id: 'booking-789',
          action_url: `/community/${communityId}/business/bookings`
        },
        {
          id: '5',
          type: 'review',
          title: 'Review Response Needed',
          content: 'A customer left a 3-star review that needs your response.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
          is_read: false,
          source_id: 'review-321',
          action_url: `/community/${communityId}/business/reviews`
        },
        {
          id: '6',
          type: 'inquiry',
          title: 'Product Availability Question',
          content: 'A potential customer is asking about product availability.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
          is_read: false,
          source_id: 'inquiry-654',
          action_url: `/community/${communityId}/business/inquiries`
        },
        // Friend notifications
        {
          id: '7',
          type: 'friend',
          title: 'New Friend Request',
          content: 'Maria S. sent you a friend request.',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          is_read: false,
          action_url: `/community/${communityId}`
        },
        {
          id: '8',
          type: 'friend',
          title: 'Friend Request Accepted',
          content: 'Alex T. accepted your friend request.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
          is_read: false,
          action_url: `/community/${communityId}`
        },
        // Community notifications
        {
          id: '9',
          type: 'community',
          title: 'New Community Event',
          content: 'Beach Cleanup Day has been scheduled for next Saturday.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          is_read: false,
          action_url: `/community/${communityId}`
        },
        {
          id: '10',
          type: 'community',
          title: 'Community Announcement',
          content: 'Important update about community guidelines.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
          is_read: true,
          action_url: `/community/${communityId}`
        },
        // Property notifications
        {
          id: '11',
          type: 'property',
          title: 'New Property Listing',
          content: 'A new beachfront property was listed in your area.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          is_read: false,
          action_url: `/properties`
        },
        {
          id: '12',
          type: 'property',
          title: 'Property Price Drop',
          content: 'A property you saved has reduced its price by 10%.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
          is_read: true,
          action_url: `/properties`
        },
        // Marketplace notifications
        {
          id: '13',
          type: 'marketplace',
          title: 'Item Sold',
          content: 'Your beach chairs listing has been sold.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
          is_read: false,
          action_url: `/market`
        },
        {
          id: '14',
          type: 'marketplace',
          title: 'New Message on Listing',
          content: 'You have a new message about your surfboard listing.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(), // 10 hours ago
          is_read: false,
          action_url: `/market`
        },
        // Feed notifications
        {
          id: '15',
          type: 'feed',
          title: 'Comment on Your Post',
          content: 'Lisa R. commented on your post about weekend events.',
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
          is_read: false,
          action_url: `/community/${communityId}/feed`
        },
        {
          id: '16',
          type: 'feed',
          title: 'Likes on Your Post',
          content: 'Your post about local restaurants received 5 new likes.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(), // 7 hours ago
          is_read: true,
          action_url: `/community/${communityId}/feed`
        }
      ];
      
      setNotifications(mockNotifications);
      
      // Filter notifications by type
      setBusinessNotifications(mockNotifications.filter(n => n.type === 'business'));
      setReviewNotifications(mockNotifications.filter(n => n.type === 'review'));
      setInquiryNotifications(mockNotifications.filter(n => n.type === 'inquiry'));
      setBookingNotifications(mockNotifications.filter(n => n.type === 'booking'));
      setFriendNotifications(mockNotifications.filter(n => n.type === 'friend'));
      setCommunityNotifications(mockNotifications.filter(n => n.type === 'community'));
      setPropertyNotifications(mockNotifications.filter(n => n.type === 'property'));
      setMarketplaceNotifications(mockNotifications.filter(n => n.type === 'marketplace'));
      setFeedNotifications(mockNotifications.filter(n => n.type === 'feed'));
      
      setNotificationsLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotificationsLoading(false);
    }
  };
  
  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    // In a real app, this would update the database
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
    
    // Update the filtered lists
    setBusinessNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setReviewNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setInquiryNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setBookingNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setFriendNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setCommunityNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setPropertyNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setMarketplaceNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setFeedNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    // In a real app, this would update the database
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setBusinessNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setReviewNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setInquiryNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setBookingNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setFriendNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setCommunityNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setPropertyNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setMarketplaceNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setFeedNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };
  
  // Helper function to get unread count
  const getUnreadCount = (notifications: Notification[]) => {
    return notifications.filter(n => !n.is_read).length;
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'business':
        return <Bell className="h-5 w-5 text-cyan-500" />;
      case 'review':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'inquiry':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'booking':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'friend':
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-purple-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
      case 'community':
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-indigo-500"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
      case 'property':
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-orange-500"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
      case 'marketplace':
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-pink-500"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
      case 'feed':
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-red-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-cyan-700">Loading dashboard...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-cyan-900 mb-8">Business Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Opportunity Status */}
        <div className="bg-gradient-to-r from-green-200 to-green-100 rounded-xl shadow p-6 flex flex-col items-center">
          <div className="font-semibold text-cyan-900 mb-2">Opportunity Status</div>
          <div className="text-4xl font-bold text-cyan-800">2</div>
          <div className="text-xs text-cyan-700 mt-1">Open: 2</div>
        </div>
        {/* Stage Distribution */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="font-semibold text-cyan-900 mb-2">Stage Distribution</div>
          <div className="w-24 h-24 rounded-full border-4 border-cyan-200 flex items-center justify-center text-2xl font-bold text-cyan-700">2</div>
          <div className="text-xs text-cyan-700 mt-2">Main Pipeline</div>
        </div>
        {/* Funnel */}
        <div className="bg-pink-100 rounded-xl shadow p-6 flex flex-col items-center">
          <div className="font-semibold text-cyan-900 mb-2">Funnel</div>
          <div className="w-full flex flex-col gap-1">
            <div className="flex justify-between text-xs"><span>New Lead</span><span>100%</span></div>
            <div className="flex justify-between text-xs"><span>Appointment Booked</span><span>50%</span></div>
            <div className="flex justify-between text-xs"><span>Closed</span><span>0%</span></div>
          </div>
        </div>
        {/* Opportunity Value */}
        <div className="bg-yellow-100 rounded-xl shadow p-6 flex flex-col items-center">
          <div className="font-semibold text-cyan-900 mb-2">Opportunity Value</div>
          <div className="text-2xl font-bold text-cyan-800">R$0</div>
          <div className="text-xs text-cyan-700 mt-1">Total revenue</div>
        </div>
        {/* Conversion Rate */}
        <div className="bg-cyan-100 rounded-xl shadow p-6 flex flex-col items-center">
          <div className="font-semibold text-cyan-900 mb-2">Conversion Rate</div>
          <div className="text-2xl font-bold text-cyan-800">0%</div>
          <div className="text-xs text-cyan-700 mt-1">Workflows</div>
        </div>
        {/* Manual Actions */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="font-semibold text-cyan-900 mb-2">Manual Actions</div>
          <div className="flex gap-4 text-lg font-bold text-cyan-800">
            <div>Phone: 0</div>
            <div>SMS: 0</div>
          </div>
          <div className="text-xs text-cyan-700 mt-1">Total Pending</div>
        </div>
      </div>
      
      {/* Notifications & Tasks Section */}
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-cyan-900">Notifications & Tasks</h2>
          <div className="flex items-center">
            <button 
              onClick={markAllAsRead}
              className="flex items-center text-sm text-cyan-600 hover:text-cyan-800"
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all as read
            </button>
          </div>
        </div>
        
        {notificationsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            You have no notifications
          </div>
        ) : (
          <div className="space-y-4">
            {/* Business Notifications */}
            {businessNotifications.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setBusinessCollapsed(!businessCollapsed)}
                >
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-cyan-500 mr-2" />
                    <h3 className="font-medium text-gray-800">Business Notifications</h3>
                    {getUnreadCount(businessNotifications) > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs font-medium rounded-full">
                        {getUnreadCount(businessNotifications)} new
                      </span>
                    )}
                  </div>
                  {businessCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {!businessCollapsed && (
                  <div className="divide-y divide-gray-100">
                    {businessNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 hover:bg-gray-50 ${!notification.is_read ? 'bg-cyan-50' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={notification.action_url || '#'}
                              onClick={() => markAsRead(notification.id)}
                              className="block"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </Link>
                          </div>
                          {!notification.is_read && (
                            <div className="ml-2 h-2 w-2 bg-cyan-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Review Notifications */}
            {reviewNotifications.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setReviewsCollapsed(!reviewsCollapsed)}
                >
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    <h3 className="font-medium text-gray-800">Review Notifications</h3>
                    {getUnreadCount(reviewNotifications) > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        {getUnreadCount(reviewNotifications)} new
                      </span>
                    )}
                  </div>
                  {reviewsCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {!reviewsCollapsed && (
                  <div className="divide-y divide-gray-100">
                    {reviewNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 hover:bg-gray-50 ${!notification.is_read ? 'bg-yellow-50' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={notification.action_url || '#'}
                              onClick={() => markAsRead(notification.id)}
                              className="block"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </Link>
                          </div>
                          {!notification.is_read && (
                            <div className="ml-2 h-2 w-2 bg-yellow-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Inquiry Notifications */}
            {inquiryNotifications.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setInquiriesCollapsed(!inquiriesCollapsed)}
                >
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 text-blue-500 mr-2" />
                    <h3 className="font-medium text-gray-800">Inquiry Notifications</h3>
                    {getUnreadCount(inquiryNotifications) > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {getUnreadCount(inquiryNotifications)} new
                      </span>
                    )}
                  </div>
                  {inquiriesCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {!inquiriesCollapsed && (
                  <div className="divide-y divide-gray-100">
                    {inquiryNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={notification.action_url || '#'}
                              onClick={() => markAsRead(notification.id)}
                              className="block"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </Link>
                          </div>
                          {!notification.is_read && (
                            <div className="ml-2 h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Booking Notifications */}
            {bookingNotifications.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setBookingsCollapsed(!bookingsCollapsed)}
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-green-500 mr-2" />
                    <h3 className="font-medium text-gray-800">Booking Notifications</h3>
                    {getUnreadCount(bookingNotifications) > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        {getUnreadCount(bookingNotifications)} new
                      </span>
                    )}
                  </div>
                  {bookingsCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {!bookingsCollapsed && (
                  <div className="divide-y divide-gray-100">
                    {bookingNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 hover:bg-gray-50 ${!notification.is_read ? 'bg-green-50' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={notification.action_url || '#'}
                              onClick={() => markAsRead(notification.id)}
                              className="block"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </Link>
                          </div>
                          {!notification.is_read && (
                            <div className="ml-2 h-2 w-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Friend Notifications */}
            {friendNotifications.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setFriendsCollapsed(!friendsCollapsed)}
                >
                  <div className="flex items-center">
                    {getNotificationIcon('friend')}
                    <h3 className="font-medium text-gray-800 ml-2">Friend Notifications</h3>
                    {getUnreadCount(friendNotifications) > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                        {getUnreadCount(friendNotifications)} new
                      </span>
                    )}
                  </div>
                  {friendsCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {!friendsCollapsed && (
                  <div className="divide-y divide-gray-100">
                    {friendNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 hover:bg-gray-50 ${!notification.is_read ? 'bg-purple-50' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={notification.action_url || '#'}
                              onClick={() => markAsRead(notification.id)}
                              className="block"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </Link>
                          </div>
                          {!notification.is_read && (
                            <div className="ml-2 h-2 w-2 bg-purple-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Community Notifications */}
            {communityNotifications.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setCommunityCollapsed(!communityCollapsed)}
                >
                  <div className="flex items-center">
                    {getNotificationIcon('community')}
                    <h3 className="font-medium text-gray-800 ml-2">Community Notifications</h3>
                    {getUnreadCount(communityNotifications) > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                        {getUnreadCount(communityNotifications)} new
                      </span>
                    )}
                  </div>
                  {communityCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {!communityCollapsed && (
                  <div className="divide-y divide-gray-100">
                    {communityNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 hover:bg-gray-50 ${!notification.is_read ? 'bg-indigo-50' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={notification.action_url || '#'}
                              onClick={() => markAsRead(notification.id)}
                              className="block"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </Link>
                          </div>
                          {!notification.is_read && (
                            <div className="ml-2 h-2 w-2 bg-indigo-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Property Notifications */}
            {propertyNotifications.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setPropertyCollapsed(!propertyCollapsed)}
                >
                  <div className="flex items-center">
                    {getNotificationIcon('property')}
                    <h3 className="font-medium text-gray-800 ml-2">Property Notifications</h3>
                    {getUnreadCount(propertyNotifications) > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                        {getUnreadCount(propertyNotifications)} new
                      </span>
                    )}
                  </div>
                  {propertyCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {!propertyCollapsed && (
                  <div className="divide-y divide-gray-100">
                    {propertyNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 hover:bg-gray-50 ${!notification.is_read ? 'bg-orange-50' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={notification.action_url || '#'}
                              onClick={() => markAsRead(notification.id)}
                              className="block"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </Link>
                          </div>
                          {!notification.is_read && (
                            <div className="ml-2 h-2 w-2 bg-orange-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Marketplace Notifications */}
            {marketplaceNotifications.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setMarketplaceCollapsed(!marketplaceCollapsed)}
                >
                  <div className="flex items-center">
                    {getNotificationIcon('marketplace')}
                    <h3 className="font-medium text-gray-800 ml-2">Marketplace Notifications</h3>
                    {getUnreadCount(marketplaceNotifications) > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-pink-100 text-pink-800 text-xs font-medium rounded-full">
                        {getUnreadCount(marketplaceNotifications)} new
                      </span>
                    )}
                  </div>
                  {marketplaceCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {!marketplaceCollapsed && (
                  <div className="divide-y divide-gray-100">
                    {marketplaceNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 hover:bg-gray-50 ${!notification.is_read ? 'bg-pink-50' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={notification.action_url || '#'}
                              onClick={() => markAsRead(notification.id)}
                              className="block"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </Link>
                          </div>
                          {!notification.is_read && (
                            <div className="ml-2 h-2 w-2 bg-pink-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Feed Notifications */}
            {feedNotifications.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setFeedCollapsed(!feedCollapsed)}
                >
                  <div className="flex items-center">
                    {getNotificationIcon('feed')}
                    <h3 className="font-medium text-gray-800 ml-2">Feed Notifications</h3>
                    {getUnreadCount(feedNotifications) > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        {getUnreadCount(feedNotifications)} new
                      </span>
                    )}
                  </div>
                  {feedCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {!feedCollapsed && (
                  <div className="divide-y divide-gray-100">
                    {feedNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 hover:bg-gray-50 ${!notification.is_read ? 'bg-red-50' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={notification.action_url || '#'}
                              onClick={() => markAsRead(notification.id)}
                              className="block"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </Link>
                          </div>
                          {!notification.is_read && (
                            <div className="ml-2 h-2 w-2 bg-red-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-8">
          <button 
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                console.log("Current user ID:", user.id);
                
                // Check profile
                const { data: profileData } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", user.id)
                  .single();
                console.log("User profile:", profileData);
                
                // Check businesses
                const { data: businessesData } = await supabase
                  .from("businesses")
                  .select("*");
                console.log("All businesses:", businessesData);
                
                // Check user's businesses
                const { data: userBusinesses } = await supabase
                  .from("businesses")
                  .select("*")
                  .eq("user_id", user.id);
                console.log("User's businesses:", userBusinesses);
                
                alert(`Debug info in console.\nTotal businesses: ${businessesData?.length || 0}\nYour businesses: ${userBusinesses?.length || 0}`);
              }
            }}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs"
          >
            Debug Database
          </button>
          
          <button 
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                // Fix potential duplicates by getting all businesses for this user
                const { data: businesses } = await supabase
                  .from("businesses")
                  .select("*")
                  .eq("user_id", user.id);
                
                if (businesses && businesses.length > 1) {
                  // Keep the newest, delete the rest
                  businesses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                  const keepId = businesses[0].id;
                  
                  for (let i = 1; i < businesses.length; i++) {
                    await supabase
                      .from("businesses")
                      .delete()
                      .eq("id", businesses[i].id);
                  }
                  
                  alert(`Fixed: Kept newest business (${keepId}) and removed ${businesses.length - 1} duplicate(s).`);
                } else {
                  alert("No duplicate businesses found.");
                }
              }
            }}
            className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs"
          >
            Fix Duplicates
          </button>
        </div>
    </div>
  );
} 