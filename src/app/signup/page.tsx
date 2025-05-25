"use client";

import { useState, useEffect } from 'react';
import { Waves, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import Image from 'next/image';

const AVATARS_BUCKET_NAME = 'avatars';

const communities = [
  { id: "miami", name: "Miami, USA" },
  { id: "nha-trang", name: "Nha Trang, Vietnam" },
  { id: "da-nang", name: "Da Nang, Vietnam" },
];

interface SignupFormValues {
  email: string;
  username: string;
  password: string;
  community: string;
  role: "user" | "business";
  avatarFile?: FileList | null;
  bio?: string;
  selectedOptions?: string[];
}

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    defaultValues: {
      email: "",
      username: "",
      password: "",
      community: "",
      role: "user",
      avatarFile: null,
      bio: "",
      selectedOptions: [],
    },
  });

  const avatarFileWatcher = watch("avatarFile");

  useEffect(() => {
    let objectUrl: string | null = null;
    if (avatarFileWatcher && avatarFileWatcher.length > 0) {
      objectUrl = URL.createObjectURL(avatarFileWatcher[0]);
      setAvatarPreview(objectUrl);
    } else {
      setAvatarPreview(null);
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [avatarFileWatcher]);

  const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    console.log("Attempting Supabase auth.signUp with data (excluding avatar file details):", 
      { ...data, avatarFile: data.avatarFile && data.avatarFile.length > 0 ? `${data.avatarFile[0].name} (${data.avatarFile[0].size} bytes)` : 'No file' }
    );

    let createdUserId: string | null = null;
    let uploadedAvatarUrl: string | null = null;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            display_name: data.username, 
            community_id: data.community,
            role: data.role,
            status: 'pending_approval',
            bio: data.bio,
            signup_options: data.selectedOptions,
          }
        }
      });

      if (authError) {
        console.error("Supabase auth.signUp error:", authError);
        if (authError.message.includes("User already registered")) {
          throw new Error("This email address is already registered. Please try logging in or use a different email.");
        }
        throw new Error(`Auth error: ${authError.message}`);
      }

      if (!authData.user) {
        console.error("Auth successful, but no user object returned.");
        throw new Error("User registration did not complete successfully (no user object). Please try again.");
      }

      createdUserId = authData.user.id;
      console.log("Supabase auth.signUp successful, user pending approval:", authData.user);

      // Force is_approved to false for new users
      if (createdUserId) {
        await supabase
          .from('profiles')
          .update({ is_approved: false })
          .eq('id', createdUserId);
      }

      // --- Avatar Upload Step ---
      if (data.avatarFile && data.avatarFile.length > 0 && createdUserId) {
        const avatar = data.avatarFile[0];
        const fileExt = avatar.name.split('.').pop();
        // Using a generic name like 'avatar' for simplicity, as it's user-specific folder.
        const avatarFileName = `avatar.${fileExt}`;
        // Path: public/[user_id]/avatar.[ext]. Consider if 'public' prefix is desired for bucket structure.
        // If avatars bucket is not public, or if you want direct non-public URLs, adjust accordingly.
        // For now, let's assume a path structure like: avatars_bucket/USER_ID/avatar.png
        const avatarFilePath = `${createdUserId}/${avatarFileName}`;

        console.log(`Attempting to upload avatar to: ${AVATARS_BUCKET_NAME}/${avatarFilePath}`);

        const { error: uploadError } = await supabase.storage
          .from(AVATARS_BUCKET_NAME)
          .upload(avatarFilePath, avatar, { upsert: true }); // upsert:true is useful if user retries

        if (uploadError) {
          console.error("Supabase avatar upload error:", uploadError);
          // Don't fail the whole signup, but notify user. Profile will be created without avatar.
          // Or, you could throw and rollback, but that's more complex.
          setErrorMessage(
            `Account created, but avatar upload failed: ${uploadError.message}. You can set your avatar later.`
          );
        } else {
          const { data: publicUrlData } = supabase.storage
            .from(AVATARS_BUCKET_NAME)
            .getPublicUrl(avatarFilePath);
          
          if (publicUrlData && publicUrlData.publicUrl) {
            uploadedAvatarUrl = publicUrlData.publicUrl;
            console.log("Avatar uploaded successfully, public URL:", uploadedAvatarUrl);

            // Update the user's profile with the avatar URL
            const { error: profileUpdateError } = await supabase
              .from('profiles')
              .update({ avatar_url: uploadedAvatarUrl, updated_at: new Date().toISOString() })
              .eq('id', createdUserId);

            if (profileUpdateError) {
              console.error("Error updating profile with avatar URL:", profileUpdateError);
              setErrorMessage(
                `Account created, avatar uploaded, but failed to link to profile: ${profileUpdateError.message}. You may need to set it again later.`
              );
            }
          } else {
             console.error("Avatar uploaded, but failed to get public URL.");
             setErrorMessage(
                `Account created, avatar uploaded, but failed to retrieve its URL. You may need to set it again later.`
              );
          }
        }
      }
      // --- End Avatar Upload Step ---

      setSuccessMessage(`Account created successfully! ${uploadedAvatarUrl ? 'Avatar also uploaded.' : ''} Your account is pending admin approval.`);
      reset();
      setAvatarPreview(null); // Clear preview on successful reset

    } catch (error) {
      const e = error as Error;
      console.error("Detailed signup error:", e);
      setErrorMessage(e.message || "An unexpected error occurred during signup.");
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
            Create Account
          </h1>
          <p className="text-slate-500 mt-2">Join <span className="text-cyan-600">Coastline</span><span className="text-rose-500">Vibe</span> today!</p>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 rounded-md bg-green-100 text-green-700 text-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-xl rounded-lg p-8 sm:p-10 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              disabled={isLoading}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Invalid email address"
                }
              })}
              className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              disabled={isLoading}
              {...register("username", { required: "Username is required" })}
              className={`w-full px-4 py-2 border ${errors.username ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`}
              placeholder="your_username"
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              6-Digit PIN (Password)
            </label>
            <input
              type="password"
              id="password"
              disabled={isLoading}
              maxLength={6}
              {...register("password", {
                required: "A 6-digit PIN is required",
                minLength: {
                  value: 6,
                  message: "PIN must be exactly 6 digits"
                },
                maxLength: {
                  value: 6,
                  message: "PIN must be exactly 6 digits"
                }
              })}
              className={`w-full px-4 py-2 border ${errors.password ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`}
              placeholder="••••••"
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Enter your 6-digit PIN.</p>
            )}
          </div>

          <div>
            <label htmlFor="community" className="block text-sm font-medium text-slate-700 mb-1">
              Select Your Community
            </label>
            <select
              id="community"
              disabled={isLoading}
              {...register("community", { required: "Please select a community" })}
              className={`w-full px-4 py-2 border ${errors.community ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`}
            >
              <option value="">Choose a community</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
            {errors.community && <p className="mt-1 text-xs text-red-600">{errors.community.message}</p>}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
              I am a...
            </label>
            <select
              id="role"
              disabled={isLoading}
              {...register("role", { required: "Please select a role" })}
              className={`w-full px-4 py-2 border ${errors.role ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`}
            >
              <option value="user">User (Joining the community)</option>
              <option value="business">Business (Listing my services/products)</option>
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
          </div>

          {/* New Questions Section - Now a single question with options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-700">Tell Us About Yourself</h3>

            {/* Bio Field (kept from previous iteration) */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                rows={3}
                disabled={isLoading}
                {...register("bio")}
                className={`w-full px-4 py-2 border ${errors.bio ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`}
                placeholder="A little something about you..."
              />
              {errors.bio && <p className="mt-1 text-xs text-red-600">{errors.bio.message}</p>}
            </div>

            {/* Single Question with Checkbox Options */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How would you describe your interest in CoastlineVibe?
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="option-networking"
                    value="Networking"
                    disabled={isLoading}
                    {...register("selectedOptions")}
                    className={`rounded border-slate-300 text-cyan-600 shadow-sm focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed mr-2`}
                  />
                  <label htmlFor="option-networking" className="text-sm text-slate-700">Networking</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="option-buying-selling"
                    value="Buying/Selling"
                    disabled={isLoading}
                    {...register("selectedOptions")}
                    className={`rounded border-slate-300 text-cyan-600 shadow-sm focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed mr-2`}
                  />
                  <label htmlFor="option-buying-selling" className="text-sm text-slate-700">Buying/Selling</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="option-community-events"
                    value="Community Events"
                    disabled={isLoading}
                    {...register("selectedOptions")}
                    className={`rounded border-slate-300 text-cyan-600 shadow-sm focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed mr-2`}
                  />
                  <label htmlFor="option-community-events" className="text-sm text-slate-700">Community Events</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="option-general-browsing"
                    value="General Browsing"
                    disabled={isLoading}
                    {...register("selectedOptions")}
                    className={`rounded border-slate-300 text-cyan-600 shadow-sm focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed mr-2`}
                  />
                  <label htmlFor="option-general-browsing" className="text-sm text-slate-700">General Browsing</label>
                </div>
              </div>
              {errors.selectedOptions && <p className="mt-1 text-xs text-red-600">{errors.selectedOptions.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="avatarFile" className="block text-sm font-medium text-slate-700 mb-1">
              Profile Picture (Optional)
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <span className="inline-block h-16 w-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar preview" width={64} height={64} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-12 w-12 text-slate-400" />
                )}
              </span>
              <label 
                htmlFor="avatarFile-upload"
                className="cursor-pointer rounded-md border border-slate-300 bg-white py-1.5 px-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <span>Change</span>
                <input 
                  id="avatarFile-upload" 
                  type="file" 
                  className="sr-only" 
                  accept="image/png, image/jpeg, image/gif" 
                  disabled={isLoading}
                  {...register("avatarFile")} 
                />
              </label>
            </div>
            {errors.avatarFile && <p className="mt-1 text-xs text-red-600">{errors.avatarFile.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 rounded-lg font-semibold bg-rose-200 hover:bg-rose-300 text-rose-800 transition-colors shadow-md hover:shadow-lg text-base transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-8">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-cyan-600 hover:text-cyan-700">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
} 