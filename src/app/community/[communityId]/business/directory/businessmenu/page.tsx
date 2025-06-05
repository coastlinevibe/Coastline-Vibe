"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from 'next/link';

export default function BusinessMenuPage() {
  const params = useParams();
  const communityId = params.communityId as string;
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('dashboard');

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
      {/* Tasks */}
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="font-semibold text-cyan-900 mb-2">Tasks</div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span>Test</span>
            <span className="text-cyan-700">Unassigned</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Test</span>
            <span className="text-cyan-700">Unassigned</span>
          </div>
        </div>
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