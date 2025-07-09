"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import BusinessFormContainer from "../../../../../components/shared/BusinessFormContainer";
 
export default function CreateBusinessPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params?.communityId as string;
  const [hasExistingBusiness, setHasExistingBusiness] = useState(false);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // If not logged in, redirect to login page
          setMessage('Please log in to continue');
          router.push('/login');
          return;
        }
        
        // Check if user has a business role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_approved')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          setMessage('Error fetching user profile');
          return;
        }
        
        // If not a business account, redirect to directory
        if (!profileData || profileData.role !== 'business') {
          setMessage('Only business accounts can create business listings');
          setTimeout(() => {
            router.push(`/community/${communityId}/business/directory`);
          }, 2000);
          return;
        }
        
        setIsBusinessAccount(true);
        
        // Check if business account is approved
        if (profileData.role === 'business' && !profileData.is_approved) {
          setMessage('Your business account is pending approval');
        }
        
        // Check if user already has a business
        const { data, error } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Error checking for existing businesses:", error);
        } else if (data && data.length > 0) {
          // User already has a business, redirect to my-businesses page
          setHasExistingBusiness(true);
          setMessage('You already have a business listing');
          setTimeout(() => {
            router.push(`/community/${communityId}/business/directory/my-businesses`);
          }, 2000);
        }
      } catch (err) {
        console.error("Error checking user access:", err);
        setMessage('An error occurred while checking access');
      } finally {
        setLoading(false);
      }
    };
    
    checkUserAccess();
  }, [supabase, router, communityId]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-primaryTeal">Loading...</div>
    </div>;
  }
  
  if (hasExistingBusiness || !isBusinessAccount) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800 max-w-md text-center">
          <div className="text-3xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-4">{message}</h2>
          <p className="mb-6">Redirecting you to the appropriate page...</p>
          <button 
            onClick={() => router.push(`/community/${communityId}/business/directory`)}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
          >
            Go to Business Directory
          </button>
        </div>
      </div>
    );
  }

  return <BusinessFormContainer communityId={communityId} />;
} 