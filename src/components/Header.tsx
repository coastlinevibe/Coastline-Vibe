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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, avatar_url, role')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }
    };

    fetchUserAndProfile();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUserAndProfile();
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  if ((pathname ?? '') === '/create-profile') return null;

  // Check if we're in a business profile view (but not in the directory)
  const isBusinessProfileView = (pathname ?? '').includes(`/community/${communityId}/business/`) && 
                               !(pathname ?? '').includes('/directory');

  const baseNavLinks = [
    { label: 'Coastline Chatter', href: `/community/${communityId}/feed` },
    { label: 'Properties', href: '/properties' },
    { label: 'Coastline Market', href: '/market' },
  ];
  
  // Only add Local Directory link if not in business profile view
  if (!isBusinessProfileView) {
    baseNavLinks.push({ label: 'Local Directory', href: `/community/${communityId}/business/directory` });
  }

  const navLinks = [...baseNavLinks];

  const isHome = pathname === '/';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-offWhite/90 backdrop-blur border-b border-seafoam/30 shadow-subtle">
      <div className="w-full max-w-content mx-auto flex items-center h-16 px-4 md:px-8 justify-between gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2 font-heading font-bold text-2xl text-primaryTeal tracking-tight min-w-max">
          <span className="text-3xl">🌴</span>
          <span>CoastlineVibe</span>
        </div>
        {/* Desktop nav (centered if space) */}
        {!isHome && user && (
          <nav className="hidden md:flex items-center gap-8 flex-grow justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-md font-medium text-darkCharcoal transition-all duration-200
                  hover:bg-seafoam/20 hover:text-primaryTeal
                  ${(pathname ?? '') === link.href ? 'bg-seafoam/30 text-primaryTeal font-semibold' : ''}
                `}
              >
                {link.label}
                {(pathname ?? '') === link.href && (
                  <span className="absolute left-0 right-0 -bottom-1 mx-auto w-12 h-1 bg-primaryTeal rounded-full" />
                )}
              </Link>
            ))}
          </nav>
        )}
        {/* User Info and Dashboard/Logout Buttons (desktop, always right) */}
        {!isHome && user && (
          <div className="hidden md:flex items-center gap-4 ml-4 min-w-max">
            {profile && (
              <Link href="/community/miami" className="flex items-center gap-2 cursor-pointer">
                <img src={profile.avatar_url || '/placeholder-avatar.png'} alt={profile.username} className="w-8 h-8 rounded-full object-cover border border-seafoam" />
                <span className="font-medium text-darkCharcoal hidden md:inline">{profile.username}</span>
              </Link>
            )}
            <Link href={`/community/${communityId}`} passHref legacyBehavior>
              <a className={`px-4 py-2 rounded-md font-semibold text-offWhite bg-primaryTeal hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle ${(pathname ?? '') === `/community/${communityId}` ? 'ring-2 ring-seafoam' : ''}`}>Dashboard</a>
            </Link>
            <button onClick={handleLogout} className="px-4 py-2 rounded-md font-semibold bg-transparent text-primaryTeal hover:underline transition">Logout</button>
          </div>
        )}
        {/* Hamburger for mobile (always right) */}
        {!isHome && user && (
          <button
            className="ml-auto md:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-seafoam"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            <span className="block w-6 h-0.5 bg-primaryTeal mb-1.5"></span>
            <span className="block w-6 h-0.5 bg-primaryTeal mb-1.5"></span>
            <span className="block w-6 h-0.5 bg-primaryTeal"></span>
          </button>
        )}
        {/* Mobile menu dropdown */}
        {!isHome && user && menuOpen && (
          <div className="absolute top-16 left-0 w-full bg-offWhite border-b border-seafoam/30 shadow-elevated flex flex-col md:hidden z-50">
            <nav className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-md font-medium text-darkCharcoal transition-all duration-200
                    hover:bg-seafoam/20 hover:text-primaryTeal
                    ${(pathname ?? '') === link.href ? 'bg-seafoam/30 text-primaryTeal font-semibold' : ''}
                  `}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2 px-4 pb-4 border-t border-seafoam/30">
              {profile && (
                <Link href="/community/miami" className="flex items-center gap-2 cursor-pointer py-2" onClick={() => setMenuOpen(false)}>
                  <img src={profile.avatar_url || '/placeholder-avatar.png'} alt={profile.username} className="w-8 h-8 rounded-full object-cover border border-seafoam" />
                  <span className="font-medium text-darkCharcoal">{profile.username}</span>
                </Link>
              )}
              <Link href={`/community/${communityId}`} passHref legacyBehavior>
                <a className={`px-4 py-2 rounded-md font-semibold text-offWhite bg-primaryTeal hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle ${(pathname ?? '') === `/community/${communityId}` ? 'ring-2 ring-seafoam' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >Dashboard</a>
              </Link>
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="px-4 py-2 rounded-md font-semibold bg-transparent text-primaryTeal hover:underline transition">Logout</button>
            </div>
          </div>
        )}
        {/* On home, show login button on right */}
        {isHome && (
          <div className="flex-1 flex justify-end">
            <Link href="/login">
              <button className="px-4 py-2 rounded-md font-semibold bg-offWhite hover:bg-seafoam text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle">
                Login
              </button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
} 