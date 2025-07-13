"use client";

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import BusinessSidebar from "../../../../../components/shared/BusinessSidebar";

export default function BusinessDirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setUserRole(profile?.role || null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserRole();
  }, []);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-cyan-700">Loading...</div>
      </div>
    );
  }
  
  // For business accounts, show the full business sidebar
  if (userRole === 'business') {
    return (
      <div className="flex min-h-screen bg-offWhite">
        <BusinessSidebar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    );
  }
  
  // For regular users and admins, just show the directory content
  return (
    <div className="min-h-screen bg-offWhite">
      <div className="w-full overflow-auto">
        {children}
      </div>
    </div>
  );
} 