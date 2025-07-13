"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

// Define a simple interface for our form values
interface LoginFormValues {
  username: string; // Changed from email to username
  pin: string;
}

// Add Profile interface (can be shared or redefined if not already imported)
// No need to strictly type profileData with this if we are careful with selected fields
// interface Profile { 
//   id: string;
//   is_admin?: boolean;
//   community_id?: string | null; // Added community_id
//   email?: string; // Added email
// }

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showDeclinedModal, setShowDeclinedModal] = useState(false);
  const [showBannedModal, setShowBannedModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const router = useRouter();
  const [showPin, setShowPin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          // If there's a session, redirect the user.
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('community_id, role')
              .eq('id', session.user.id)
              .single();

            // Only proceed with routing if the component is still mounted
            if (isMounted) {
              if (profile?.community_id) {
                // Get the community slug
                const { data: communityData } = await supabase
                  .from('communities')
                  .select('slug')
                  .eq('id', profile.community_id)
                  .single();
                
                if (communityData?.slug) {
                  // Direct business users to business menu, others to mini-dash
                  if (profile.role === 'business') {
                    router.push(`/community/${communityData.slug}/business/directory/businessmenu`);
                  } else {
                    // Direct users to their mini-dash
                    router.push(`/community/${communityData.slug}/mini-dash`);
                  }
                } else {
                  router.push('/');
                }
              } else {
                router.push('/');
              }
            }
          } catch (err) {
            console.error("Error fetching profile during session check:", err);
            // If we can't get the profile but have a session, send to home as fallback
            if (isMounted) {
              router.push('/');
            }
          }
        }
      } catch (err) {
        console.error("Error checking session:", err);
      }
    };

    checkSession();
    
    return () => {
      isMounted = false; // Prevent state updates after unmount
    };
  }, [router, supabase]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      username: "",
      pin: "",
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Fetch email, is_admin, and community_id from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, is_admin, community_id, role, approval_status, is_banned, ban_reason')
        .eq('username', data.username)
        .maybeSingle();

      // If profile not found, show appropriate error
      if (profileError) {
        setErrorMessage("Username not found or invalid PIN. Please try again.");
        console.error("Profile lookup error:", profileError.message);
        setIsLoading(false);
        return;
      }

      // If no profile data found, handle gracefully
      if (!profileData) {
        setErrorMessage("Username not found or invalid PIN. Please try again.");
        console.error("No profile found for username:", data.username);
        setIsLoading(false);
        return;
      }

      if (!profileData.email) {
        setErrorMessage("User profile is incomplete (missing email). Please contact support.");
        console.error("User profile for:", data.username, "is missing an email.");
        setIsLoading(false);
        return;
      }
      
      const userEmail = profileData.email;
      const userCommunityId = profileData.community_id;
      const userRole = profileData.role;
      const approvalStatus = profileData.approval_status;

      // Check if user is banned before sign in
      if (profileData.is_banned) {
        setBanReason(profileData.ban_reason || "No reason provided");
        setShowBannedModal(true);
        setIsLoading(false);
        return;
      }

      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: data.pin,
      });

      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          setErrorMessage("Username not found or invalid PIN. Please try again.");
        } else {
          setErrorMessage(signInError.message);
        }
        setIsLoading(false);
        return;
      }

      // Only after successful sign in, check approval_status
      if (approvalStatus === 'declined') {
        setShowDeclinedModal(true);
        setIsLoading(false);
        await supabase.auth.signOut();
        return;
      }
      if (approvalStatus !== 'approved') {
        setShowPendingModal(true);
        setIsLoading(false);
        await supabase.auth.signOut();
        return;
      }
      // If approved, redirect immediately (no popup)
      let communitySlug = null;
      if (userCommunityId) {
        const { data: communityData, error: communityError } = await supabase
          .from('communities')
          .select('slug')
          .eq('id', userCommunityId)
          .single();
        if (!communityError && communityData) {
          communitySlug = communityData.slug;
        }
      }
      if (userRole === "community admin" && communitySlug) {
        router.push(`/community/${communitySlug}/admin`);
      } else if (userRole === 'business' && communitySlug) {
        router.push(`/community/${communitySlug}/business/directory/businessmenu`);
      } else if (communitySlug) {
        // Direct regular users to their dashboard
        router.push(`/community/${communitySlug}/mini-dash`);
      } else {
        router.push('/');
      }
      setIsLoading(false);
      return;

    } catch (error) {
      console.error("Login error:", error);
      if (!errorMessage && error instanceof Error) { 
        setErrorMessage(error.message || "An unexpected error occurred during login.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-sky-700">
            Login to <span className="text-cyan-600">Coastline</span><span className="text-rose-500">Vibe</span>
          </h1>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-xl rounded-lg p-8 sm:p-10 space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              disabled={isLoading}
              {...register("username", {
                required: "Username is required",
              })}
              className={`w-full px-4 py-2 border ${errors.username ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`}
              placeholder="your_username"
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
          </div>

          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-slate-700 mb-1">
              6-Digit PIN
            </label>
            <div className="relative">
            <input
                type={showPin ? "text" : "password"}
              id="pin"
              disabled={isLoading}
              maxLength={6}
              {...register("pin", {
                required: "PIN is required",
                minLength: { value: 6, message: "PIN must be 6 digits" },
                maxLength: { value: 6, message: "PIN must be 6 digits" }
              })}
                className={`w-full px-4 py-2 border ${errors.pin ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed pr-10`}
              placeholder="••••••"
            />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowPin((v) => !v)}
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.pin && <p className="mt-1 text-xs text-red-600">{errors.pin.message}</p>}
            <div className="mt-2">
              <Link href="/reset-password" className="text-xs text-cyan-600 underline hover:text-cyan-800">
                Forgot PIN?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 rounded-lg font-semibold bg-cyan-300 hover:bg-cyan-400 text-cyan-900 transition-colors shadow-md hover:shadow-lg text-base transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging In...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-cyan-600 hover:text-cyan-700">
            Sign Up
          </Link>
        </p>
      </div>
      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center border border-slate-100">
            <h2 className="text-xl font-bold text-sky-700 mb-4 text-center">Account Pending Approval</h2>
            <p className="text-slate-700 text-center mb-6">Your account is still pending approval. You will be notified via email once approved.</p>
            <button
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold shadow-md transition"
              onClick={() => setShowPendingModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showDeclinedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center border border-slate-100">
            <h2 className="text-xl font-bold text-rose-700 mb-4 text-center">Account Declined</h2>
            <p className="text-slate-700 text-center mb-6">Your account has been declined. Please contact support if you believe this is a mistake.</p>
            <button
              className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-md transition"
              onClick={() => setShowDeclinedModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showBannedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center border border-slate-100">
            <h2 className="text-xl font-bold text-red-700 mb-4 text-center">Account Banned</h2>
            <p className="text-slate-700 text-center mb-3">Your account has been banned from this platform.</p>
            <p className="text-slate-700 text-center mb-6 font-semibold">Reason: {banReason}</p>
            <button
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-md transition"
              onClick={() => setShowBannedModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 