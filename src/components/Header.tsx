"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import features from '@/config/features';

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
  const [communitySlug, setCommunitySlug] = useState<string>('miami');

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, avatar_url, role, community_id')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          if (profileData.community_id) {
            const { data: communityData, error: communityError } = await supabase
              .from('communities')
              .select('slug')
              .eq('id', profileData.community_id)
              .single();
            if (!communityError && communityData) {
              setCommunitySlug(communityData.slug);
            }
          }
        }
      } else {
        setProfile(null);
        setCommunitySlug('miami');
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
  const isBusinessProfileView = (pathname ?? '').includes(`/community/${communitySlug}/business/`) && 
                               !(pathname ?? '').includes('/directory');

  // Use the features configuration
  const activeFeatures = features;

  const baseNavLinks = [
    // Only show active features
    ...(activeFeatures.feed ? [{ label: 'Coastline Chatter', href: `/community/${communitySlug}/feed` }] : []),
    ...(activeFeatures.vibeGroups ? [{ label: 'Vibe Groups', href: `/community/${communitySlug}/vibe-groups` }] : []),
    ...(activeFeatures.properties ? [{ label: 'Properties', href: '/properties' }] : []),
    ...(activeFeatures.market ? [{ label: 'Coastline Market', href: '/market' }] : []),
  ];
  
  // Only add Local Directory link if it's active and we're not in business profile view
  if (activeFeatures.directory && !isBusinessProfileView) {
    baseNavLinks.push({ label: 'Local Directory', href: `/community/${communitySlug}/business/directory` });
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
        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-2xl text-primaryTeal tracking-tight min-w-max cursor-pointer">
          <span className="text-3xl">🌴</span>
          <span>CoastlineVibe</span>
        </Link>
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
              <Link href={`/community/${communitySlug}/business/directory/businessmenu`} className="flex items-center gap-2 cursor-pointer" onClick={() => {
                // Set localStorage to indicate settings tab should be active
                localStorage.setItem('activeDashboardTab', 'settings');
              }}>
                <img src={profile.avatar_url || '/placeholder-avatar.png'} alt={profile.username} className="w-8 h-8 rounded-full object-cover border border-seafoam" />
                <span className="font-medium text-darkCharcoal hidden md:inline">{profile.username}</span>
              </Link>
            )}
            {/* Mini-Dash button for non-business profiles */}
            {profile && profile.role !== 'business' && (
              <div className="flex gap-2">
                <Link href={`/community/${communitySlug}/mini-dash`} passHref legacyBehavior>
                  <a className={`px-4 py-2 rounded-md font-semibold text-offWhite bg-primaryTeal hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle ${(pathname ?? '').includes('/mini-dash') ? 'ring-2 ring-seafoam' : ''}`}>Mini-Dash</a>
                </Link>
              </div>
            )}
            <button onClick={handleLogout} className="px-4 py-2 rounded-md font-semibold bg-transparent text-primaryTeal hover:underline transition">Logout</button>
          </div>
        )}
        {/* Hamburger for mobile (always right) */}
        {!isHome && user && (
          <div className="ml-auto md:hidden flex items-center gap-2">
            <button
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-seafoam"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
            >
              <span className="block w-6 h-0.5 bg-primaryTeal mb-1.5"></span>
              <span className="block w-6 h-0.5 bg-primaryTeal mb-1.5"></span>
              <span className="block w-6 h-0.5 bg-primaryTeal"></span>
            </button>
          </div>
        )}
        {/* Mobile menu dropdown */}
        {menuOpen && !isHome && user && (
          <div className="absolute top-16 right-0 w-64 bg-white shadow-lg rounded-lg overflow-hidden z-50">
            <div className="py-4">
              {/* Mobile nav items */}
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 text-darkCharcoal hover:bg-seafoam/20 ${
                    pathname?.includes(item.href) ? 'bg-seafoam/10 font-semibold' : ''
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2 px-4 pb-4 border-t border-seafoam/30">
              {profile && (
                <Link href={`/community/${communitySlug}/business/directory/businessmenu`} className="flex items-center gap-2 cursor-pointer py-2" onClick={() => {
                  setMenuOpen(false);
                  // Set localStorage to indicate settings tab should be active
                  localStorage.setItem('activeDashboardTab', 'settings');
                }}>
                  <img src={profile.avatar_url || '/placeholder-avatar.png'} alt={profile.username} className="w-8 h-8 rounded-full object-cover border border-seafoam" />
                  <span className="font-medium text-darkCharcoal">{profile.username}</span>
                </Link>
              )}
              {/* Mini-Dash button for non-business profiles (mobile) */}
              {profile && profile.role !== 'business' && (
                <div className="flex flex-col gap-2">
                  <Link href={`/community/${communitySlug}/mini-dash`} passHref legacyBehavior>
                    <a className={`px-4 py-2 rounded-md font-semibold text-offWhite bg-primaryTeal hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle ${(pathname ?? '').includes('/mini-dash') ? 'ring-2 ring-seafoam' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >Mini-Dash</a>
                  </Link>
                </div>
              )}
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