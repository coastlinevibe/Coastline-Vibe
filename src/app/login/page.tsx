"use client";

import { useState } from 'react';
import { Waves } from 'lucide-react';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createBrowserClient } from '@supabase/ssr'; // Changed import
import { useRouter } from 'next/navigation';
import type { Database } from '@/lib/database.types';

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
  const router = useRouter();

  // Initialize Supabase client for client component
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
        .select('email, is_admin, community_id, role') // Added role
        .eq('username', data.username)
        .single();

      if (profileError || !profileData) {
        setErrorMessage("Username not found or invalid PIN. Please try again.");
        // It's good to log the actual Supabase error for debugging if profileError exists
        console.error("Profile lookup error:", profileError?.message);
        throw new Error(profileError?.message || "User profile not found for username lookup");
      }

      // Ensure email exists before proceeding, as it's crucial for signInWithPassword
      if (!profileData.email) {
        setErrorMessage("User profile is incomplete (missing email). Please contact support.");
        console.error("User profile for:", data.username, "is missing an email.");
        throw new Error("User profile incomplete, missing email.");
      }
      
      const userEmail = profileData.email;
      const userIsAdmin = profileData.is_admin === true;
      const userCommunityId = profileData.community_id;
      const userRole = profileData.role;

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
        throw signInError;
      }

      // Successful login, now redirect based on role and community_id
      if (userRole === "community admin" && userCommunityId) {
        console.log(`Community admin logged in, redirecting to /community/${userCommunityId}/admin`);
        router.push(`/community/${userCommunityId}/admin`);
      } else if (userIsAdmin) {
        console.log('Super admin logged in, redirecting to /superadmin');
        router.push('/superadmin');
      } else if (userCommunityId) {
        console.log(`User belongs to community ${userCommunityId}, redirecting to /community/${userCommunityId}`);
        router.push(`/community/${userCommunityId}`);
      } else {
        console.log('Regular user (no specific community) logged in, redirecting to /');
        router.push('/');
      }

    } catch (error) {
      console.error("Login error:", error);
      // Error message is likely already set by the specific error handling above
      if (!errorMessage && error instanceof Error) { 
        setErrorMessage(error.message || "An unexpected error occurred during login.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Waves className="h-12 w-12 text-cyan-600" />
          </Link>
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
            <input
              type="password"
              id="pin"
              disabled={isLoading}
              maxLength={6}
              {...register("pin", {
                required: "PIN is required",
                minLength: { value: 6, message: "PIN must be 6 digits" },
                maxLength: { value: 6, message: "PIN must be 6 digits" }
              })}
              className={`w-full px-4 py-2 border ${errors.pin ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`}
              placeholder="••••••"
            />
            {errors.pin && <p className="mt-1 text-xs text-red-600">{errors.pin.message}</p>}
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
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-cyan-600 hover:text-cyan-700">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
} 