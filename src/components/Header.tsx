"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function Header({ communityId = 'miami' }: { communityId?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, role')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      }
    };

    fetchUserAndProfile();
  }, [supabase]);

  if (pathname === '/login' || pathname === '/create-profile' || pathname.startsWith('/superadmin')) return null;

  const baseNavLinks = [
    { label: 'Dashboard', href: `/community/${communityId}` },
    { label: 'Properties', href: '/properties' },
    { label: 'Coastline Market', href: '/market' },
    { label: 'Chatter', href: `/community/${communityId}/feed` },
  ];

  const navLinks = profile?.role === 'business'
    ? [...baseNavLinks, { label: 'Business Dashboard', href: '/business/dashboard' }]
    : baseNavLinks;

  const isHome = pathname === '/';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur border-b border-cyan-100 shadow-sm">
      <div className="w-full flex items-center h-16 gap-6 px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 font-extrabold text-2xl text-cyan-900 tracking-tight">
          <span className="text-3xl">🌴</span>
          <span>CoastlineVibe</span>
        </div>
        {/* Only show nav on non-home pages */}
        {!isHome && user && <>
          <nav className="flex-1 flex items-center gap-2 ml-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 rounded-md font-medium text-cyan-800 transition-all duration-200
                  hover:bg-cyan-100 hover:text-teal-700
                  ${pathname === link.href ? 'bg-teal-100 text-teal-700 shadow-sm' : ''}
                `}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                )}
              </Link>
            ))}
          </nav>
          {/* User Info and Dashboard/Logout Buttons */}
          <div className="flex items-center gap-4">
            {profile && (
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                <img src={profile.avatar_url || '/placeholder-avatar.png'} alt={profile.username} className="w-8 h-8 rounded-full object-cover" />
                <span className="font-semibold text-cyan-900 hidden md:inline">{profile.username}</span>
              </Link>
            )}
            <Link href={`/community/${communityId}`} passHref legacyBehavior>
              <a className={`px-4 py-2 rounded font-bold text-white bg-teal-500 hover:bg-teal-600 transition shadow ${pathname === `/community/${communityId}` ? 'ring-2 ring-teal-300' : ''}`}>Dashboard</a>
            </Link>
            <button onClick={handleLogout} className="px-4 py-2 rounded font-bold bg-red-100 text-red-700 hover:bg-red-200 transition">Logout</button>
          </div>
        </>}
        {/* On home, show login button on right */}
        {isHome && (
          <div className="flex-1 flex justify-end">
            <Link href="/login">
              <button className="px-4 py-2 rounded-lg font-semibold bg-cyan-200 hover:bg-cyan-300 text-cyan-800 transition-colors shadow-sm text-sm">
                Login
              </button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
} 