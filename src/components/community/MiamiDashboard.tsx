'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function MiamiDashboard() {
  const communityId = 'miami';
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch user profile (demo: use localStorage or static)
    const user = JSON.parse(localStorage.getItem('userProfile') || '{}');
    setProfile(user || {
      username: 'Jane Doe',
      email: 'jane@example.com',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    });
    // Fetch recent posts (demo: static)
    setRecentPosts([
      { id: 1, title: 'Welcome to CoastlineVibe!', date: '2025-05-20' },
      { id: 2, title: 'Check out the new market section', date: '2025-05-18' },
      { id: 3, title: 'Community BBQ this weekend', date: '2025-05-15' },
    ]);
  }, []);

  const handleShare = () => {
    // Demo: copy profile info to clipboard
    if (profile) {
      navigator.clipboard.writeText(`User: ${profile.username}\nEmail: ${profile.email}`);
      alert('Profile info copied to clipboard!');
    }
  };

  // Feature cards with icons (filtered)
  const features = [
    {
      title: 'Local Events',
      desc: 'Upcoming events in Miami...',
      icon: '🎉',
      href: '#',
    },
    {
      title: 'Announcements',
      desc: 'Latest announcements for the community...',
      icon: '📢',
      href: '#',
    },
    {
      title: 'Property Listings',
      desc: 'Browse homes, apartments, and more for sale or rent.',
      icon: '🏠',
      href: '/properties',
    },
    {
      title: 'Coastline Chatter',
      desc: 'Latest posts and updates from the community...',
      icon: '🌊',
      href: `/community/${communityId}/feed`,
    },
  ];

  // Navigation links
  const navLinks = [
    { label: 'Dashboard', href: `/community/${communityId}` },
    { label: 'Properties', href: '/properties' },
    { label: 'Events', href: '#' },
    { label: 'Forum', href: '#' },
    { label: 'Resources', href: '#' },
    { label: 'Chatter', href: `/community/${communityId}/feed` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-cyan-100 flex flex-col items-center justify-center py-12">
      {/* Profile Card */}
      <div className="bg-white/90 rounded-2xl shadow-xl border border-cyan-100 p-8 w-full max-w-md flex flex-col items-center mb-6">
        <img src={profile?.avatar} alt={profile?.username} className="w-24 h-24 rounded-full border-4 border-cyan-200 mb-4" />
        <div className="text-2xl font-bold text-cyan-900 mb-1">{profile?.username}</div>
        <div className="text-cyan-700 text-sm mb-2">
          {profile?.bio
            ? profile.bio
            : <span className="italic text-cyan-400">Add your bio in Edit Profile</span>}
        </div>
        <div className="text-cyan-700 text-sm mb-2">
          {profile?.phone
            ? profile.phone
            : <span className="italic text-cyan-400">Add your phone in Edit Profile</span>}
        </div>
        <div className="text-cyan-700 text-sm mb-2">{profile?.email}</div>
        <button
          onClick={handleShare}
          className="px-4 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition mt-2"
        >
          Share Profile
        </button>
      </div>
      {/* Tips & Announcements */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded shadow w-full max-w-md">
        <div className="font-bold text-yellow-800 mb-1">Tips & Announcements</div>
        <ul className="list-disc pl-5 text-yellow-900 text-sm space-y-1">
          <li>Did you know? You can set a main image for your listings by clicking the star icon!</li>
          <li>Check out the new market section for great deals.</li>
          <li>Keep your profile updated for better visibility.</li>
        </ul>
      </div>
      {/* Edit Profile Button */}
      <Link
        href="/profile/edit"
        className="px-6 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition mb-8"
      >
        Edit Profile
      </Link>
    </div>
  );
} 