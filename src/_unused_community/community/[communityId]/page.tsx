"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import MiamiDashboard from '@/components/community/MiamiDashboard';
import Link from 'next/link';
import Image from 'next/image';
import { UserCircle2, ChevronDown, ChevronUp, ShieldCheck, MessageSquare, Heart, AtSign, Sailboat, Store, ExternalLink } from 'lucide-react';
import FeedPostItem from '@/components/feed/FeedPostItem';
import LocationVerificationForm from '@/components/profile/LocationVerificationForm';
import { createClient } from '@/lib/supabase/client';
import { cookies } from 'next/headers';
import { formatDistanceToNow } from 'date-fns';

// Define a more specific Profile type for this page's needs
interface Profile {
  id: string;
  username: string;
  community_id: string | null;
  is_admin: boolean | null;
  avatar_url?: string;
  email?: string;
  bio?: string;
  role?: string;
  hasBusinessDashboard: boolean;
  created_at?: string;
  is_location_verified: boolean;
  is_online?: boolean;
}

// Define wishlist item type
interface WishlistItem {
  id: string;
  item_id: string;
  user_id: string;
  created_at: string;
  market_item: {
    id: string;
    title: string;
    price: number;
    imagefiles?: string[];
    approval_status?: string;
  };
}

// Define a more generic NotificationItem interface
interface GenericNotification {
  id: string;
  type: 'mention' | 'post_like' | 'new_comment' | 'PROPERTY_INQUIRY' | 'MARKET_INTERACTION' | 'BUSINESS_INTERACTION' | 'FRIEND_REQUEST' | string;
  actor: {
    id: string;
    username: string | null;
    avatar_url?: string | null;
  } | null;
  target_entity_id: string | null;
  target_entity_type: string | null;
  target_entity_title?: string | null;
  content_snippet?: string | null;
  created_at: string;
  is_read: boolean;
  community_id: string | null;
}

type PageStatus = 'loading' | 'unauthenticated' | 'unauthorized' | 'authorized' | 'error';

export default function CommunityLandingPage() {
  const params = useParams();
  const communityId = typeof params?.communityId === 'string' ? params.communityId : null;
  const router = useRouter();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Redirect based on user role
  useEffect(() => {
    if (communityId) {
      const checkUserRole = async () => {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Get user profile to check role
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
          // Redirect based on role
          if (userProfile?.role === 'business') {
            router.replace(`/community/${communityId}/business/directory/businessmenu`);
          } else {
            router.replace(`/community/${communityId}/mini-dash`);
          }
        } else {
          // No user, redirect to mini-dash (will handle auth there)
          router.replace(`/community/${communityId}/mini-dash`);
        }
      };
      
      checkUserRole();
    }
  }, [communityId, router, supabase]);
  
  // Return loading state while redirecting
  return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  
  // The code below is unreachable and causing linter errors - removing it
  /* 
  const [communityUuid, setCommunityUuid] = useState<string | null>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [community, setCommunity] = useState<{ name: string, id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [notifications, setNotifications] = useState<GenericNotification[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState('');
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  */
} 