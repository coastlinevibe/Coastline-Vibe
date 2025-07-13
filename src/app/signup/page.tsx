"use client";

import { useState, useEffect } from 'react';
import { Waves, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
}

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const router = useRouter();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [qAnswers, setQAnswers] = useState(['', '', '', '']);
  const [rules, setRules] = useState([false, false, false, false]);
  const [qError, setQError] = useState('');
  const [qLoading, setQLoading] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<SignupFormValues | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showUserExistsModal, setShowUserExistsModal] = useState(false);

  const supabase = createBrowserClient(
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
    setErrorMessage(null);
    setSuccessMessage(null);
    setPendingSignup(data);
    setShowQuestionnaire(true);
    setAvatarPreview(null); // Optionally clear preview
  };

  const handleQuestionnaireSubmit = async () => {
    setQError('');
    if (qAnswers.some(a => !a.trim())) {
      setQError('Please answer all questions.');
      return;
    }
    if (rules.some(r => !r)) {
      setQError('You must agree to all rules.');
      return;
    }
    if (!pendingSignup) {
      setQError('Missing signup info. Please refresh and try again.');
      return;
    }
    setQLoading(true);
    setIsLoading(true);
    let createdUserId: string | null = null;
    let uploadedAvatarUrl: string | null = null;
    try {
      // Map community slug to UUID
      let communityUuid = null;
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', pendingSignup.community)
        .single();
      if (communityError || !communityData) {
        setQError('Could not find the selected community.');
        setQLoading(false);
        setIsLoading(false);
        return;
      }
      communityUuid = communityData.id;
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: pendingSignup.email,
        password: pendingSignup.password,
        options: {
          data: {
            username: pendingSignup.username,
            display_name: pendingSignup.username,
            community_id: communityUuid,
            role: pendingSignup.role,
            status: 'pending_approval',
          }
        }
      });
      if (authError) {
        if (authError.message && authError.message.toLowerCase().includes('already registered')) {
          setShowUserExistsModal(true);
          setQLoading(false);
          setIsLoading(false);
          return;
        }
        setQError(authError.message);
        setQLoading(false);
        setIsLoading(false);
        return;
      }
      if (!authData.user) {
        setQError('User registration did not complete successfully.');
        setQLoading(false);
        setIsLoading(false);
        return;
      }
      createdUserId = authData.user.id;
      // Force is_approved to false for new users
      await supabase.from('profiles').update({ is_approved: false }).eq('id', createdUserId);
      // 2. Avatar upload (if any)
      if (pendingSignup.avatarFile && pendingSignup.avatarFile.length > 0 && createdUserId) {
        const avatar = pendingSignup.avatarFile[0];
        const fileExt = avatar.name.split('.').pop();
        const avatarFileName = `avatar.${fileExt}`;
        const avatarFilePath = `${createdUserId}/${avatarFileName}`;
        const { error: uploadError } = await supabase.storage
          .from(AVATARS_BUCKET_NAME)
          .upload(avatarFilePath, avatar, { upsert: true });
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from(AVATARS_BUCKET_NAME)
            .getPublicUrl(avatarFilePath);
          if (publicUrlData && publicUrlData.publicUrl) {
            uploadedAvatarUrl = publicUrlData.publicUrl;
            await supabase.from('profiles').update({ avatar_url: uploadedAvatarUrl, updated_at: new Date().toISOString() }).eq('id', createdUserId);
          }
        }
      }
      // 3. Wait for profile to exist before saving questionnaire answers
      let profile = null;
      for (let i = 0; i < 10; i++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', createdUserId)
          .single();
        if (data) {
          profile = data;
          break;
        }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!profile) {
        setQError('Profile was not created. Please try again.');
        setQLoading(false);
        setIsLoading(false);
        return;
      }
      // 4. Save questionnaire answers
      const { error: qErrorInsert } = await supabase.from('user_questionnaire').insert({
        user_id: createdUserId,
        answer1: qAnswers[0],
        answer2: qAnswers[1],
        answer3: qAnswers[2],
        answer4: qAnswers[3],
        agreed_rule1: rules[0],
        agreed_rule2: rules[1],
        agreed_rule3: rules[2],
        agreed_rule4: rules[3],
      });
      if (qErrorInsert) {
        setQError('Failed to save your answers. Please try again.');
        setQLoading(false);
        setIsLoading(false);
        return;
      }
      setSuccessMessage(`Account created successfully! ${uploadedAvatarUrl ? 'Avatar also uploaded.' : ''} Your account is pending admin approval.`);
      setShowQuestionnaire(false);
      setPendingSignup(null);
      setQAnswers(['', '', '', '']);
      setRules([false, false, false, false]);
      await supabase.auth.signOut();
      setShowPendingModal(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      setQError('An unexpected error occurred.');
    } finally {
      setQLoading(false);
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
              <option value="business">Business (Listing my Properties, Services or Products.)</option>
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
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
        {showQuestionnaire && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md flex flex-col items-center border border-slate-100">
              <h3 className="text-2xl font-bold mb-4 text-sky-700 text-center">Welcome! Please answer a few questions</h3>
              <form className="w-full space-y-4" onSubmit={async e => {
                e.preventDefault();
                await handleQuestionnaireSubmit();
              }}>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">1. Why do you want to join CoastlineVibe?</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500 transition" value={qAnswers[0]} onChange={e => setQAnswers(a => [e.target.value, a[1], a[2], a[3]])} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">2. What is your favorite coastal activity?</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500 transition" value={qAnswers[1]} onChange={e => setQAnswers(a => [a[0], e.target.value, a[2], a[3]])} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">3. How did you hear about us?</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500 transition" value={qAnswers[2]} onChange={e => setQAnswers(a => [a[0], a[1], e.target.value, a[3]])} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">4. What do you hope to get from this community?</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500 transition" value={qAnswers[3]} onChange={e => setQAnswers(a => [a[0], a[1], a[2], e.target.value])} />
                  </div>
                </div>
                <div className="mt-6 bg-sky-50 rounded-lg p-4 space-y-3 border border-sky-100">
                  <div className="flex items-center">
                    <input type="checkbox" checked={rules[0]} onChange={e => setRules(r => [e.target.checked, r[1], r[2], r[3]])} className="mr-3 accent-cyan-600 w-5 h-5 rounded" />
                    <span className="text-slate-700 text-sm">I agree to be respectful to all members.</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" checked={rules[1]} onChange={e => setRules(r => [r[0], e.target.checked, r[2], r[3]])} className="mr-3 accent-cyan-600 w-5 h-5 rounded" />
                    <span className="text-slate-700 text-sm">I will not post spam or advertisements.</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" checked={rules[2]} onChange={e => setRules(r => [r[0], r[1], e.target.checked, r[3]])} className="mr-3 accent-cyan-600 w-5 h-5 rounded" />
                    <span className="text-slate-700 text-sm">I understand my account may be reviewed by admins.</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" checked={rules[3]} onChange={e => setRules(r => [r[0], r[1], r[2], e.target.checked])} className="mr-3 accent-cyan-600 w-5 h-5 rounded" />
                    <span className="text-slate-700 text-sm">I agree to follow all community guidelines.</span>
                  </div>
                </div>
                {qError && <div className="text-red-500 text-sm mt-2 text-center">{qError}</div>}
                <button type="submit" className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold w-full shadow-md transition disabled:opacity-60" disabled={qLoading}>{qLoading ? 'Saving...' : 'Submit'}</button>
              </form>
            </div>
          </div>
        )}
        {showPendingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center border border-slate-100">
              <h2 className="text-xl font-bold text-sky-700 mb-4 text-center">Account Pending Approval</h2>
              <p className="text-slate-700 text-center mb-4">Your account has been created and is pending admin approval. You will be notified by email once approved.</p>
              <p className="text-cyan-600 text-center mb-6 text-sm">You will be redirected to the login page in a few seconds...</p>
              <button
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold shadow-md transition"
                onClick={() => {
                  setShowPendingModal(false);
                  router.push('/login');
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        )}
        {showUserExistsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center border border-slate-100">
              <h2 className="text-xl font-bold text-rose-700 mb-4 text-center">User Already Exists</h2>
              <p className="text-slate-700 text-center mb-6">An account with this email already exists. Please log in or use a different email.</p>
              <button
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-md transition"
                onClick={() => setShowUserExistsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 