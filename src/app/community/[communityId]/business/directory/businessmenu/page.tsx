"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { NotificationProvider } from '@/context/NotificationContext';
import BusinessNotifications from '@/components/shared/BusinessNotifications';

export default function BusinessMenuPage() {
  const params = useParams();
  const communityId = params?.communityId as string || '';
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    };
    
    fetchProfile();
  }, [supabase, router, communityId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Bell className="h-6 w-6 text-blue-500 mr-2" />
            <h1 className="text-2xl font-bold">Business Notifications</h1>
      </div>
      
          <div className="mb-4">
            <p className="text-gray-600">
              Stay updated with the latest notifications about your business in the Local Directory.
            </p>
          </div>
          
          <NotificationProvider>
            <BusinessNotifications />
          </NotificationProvider>
        </div>
      </main>
    </div>
  );
} 