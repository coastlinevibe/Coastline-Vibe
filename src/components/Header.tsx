"use client";
import React from 'react';
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
  if (pathname === '/login' || pathname === '/create-profile' || pathname.startsWith('/superadmin')) return null;
  const navLinks = [
    { label: 'Dashboard', href: `/community/${communityId}` },
    { label: 'Properties', href: '/properties' },
    { label: 'Coastline Market', href: '/market' },
    { label: 'Chatter', href: `/community/${communityId}/feed` },
    { label: 'Business Dashboard', href: '/business/dashboard' },
  ];
  const isHome = pathname === '/';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur border-b border-cyan-100 shadow-sm">
      <div className="w-full flex items-center h-16 gap-6 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-extrabold text-2xl text-cyan-900 tracking-tight hover:text-teal-600 transition-colors">
          <span className="text-3xl">🌴</span>
          <span>CoastlineVibe</span>
        </Link>
        {/* Only show nav on non-home pages */}
        {!isHome && <>
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
          {/* Dashboard Button */}
          <Link href={`/community/${communityId}`} passHref legacyBehavior>
            <a className={`px-4 py-2 rounded font-bold text-white bg-teal-500 hover:bg-teal-600 transition shadow ${pathname === `/community/${communityId}` ? 'ring-2 ring-teal-300' : ''}`}>Dashboard</a>
          </Link>
          {/* Logout Button */}
          <button onClick={handleLogout} className="ml-4 px-4 py-2 rounded font-bold bg-red-100 text-red-700 hover:bg-red-200 transition">Logout</button>
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