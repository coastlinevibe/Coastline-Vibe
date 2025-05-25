"use client";
import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import BusinessDashboard from '@/components/shared/BusinessDashboard';

export default function BusinessDashboardPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      // Check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (!profile || profile.role !== 'business') {
        router.push('/business');
        return;
      }
      console.log('Checking business profile for user.id:', user.id);
      // Check business profile
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Business profile query result:', { data: business, error: businessError });

      if (!business) {
        router.push('/business');
        return;
      }
      setCanAccess(true);
      setLoading(false);
    };
    checkAccess();
  }, [router, supabase]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!canAccess) return null;
  return <BusinessDashboard />;
} 