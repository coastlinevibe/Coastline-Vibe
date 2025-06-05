"use client";
import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import BusinessMultiStepForm from '@/components/shared/BusinessMultiStepForm';

export default function BusinessPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const checkBusiness = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (business) {
        router.push('/business/dashboard');
      } else {
        setShowForm(true);
      }
      setLoading(false);
    };
    checkBusiness();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-cyan-600">Loading...</div>;
  if (!showForm) return null;
  return <BusinessMultiStepForm />;
} 