'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sailboat, ShieldCheck, Mail, CalendarDays, UserSquare, UserCircle, Info, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface UserTooltipProfileData {
  id: string;
  username: string;
  avatar_url?: string | null;
  email?: string | null;
  bio?: string | null;
  created_at?: string | null; // Join date
  role?: string | null;
  is_location_verified?: boolean | null;
  last_seen_at?: string | null;
}

interface UserTooltipDisplayProps {
  profile: UserTooltipProfileData;
  currentUserId?: string | null;
}

const UserTooltipDisplay: React.FC<UserTooltipDisplayProps> = ({ profile, currentUserId }) => {
  if (!profile) return null;

  const calculateIsOnline = (lastSeenAt?: string | null): boolean => {
    // If this is the current user, always show as online
    if (currentUserId && profile.id === currentUserId) return true;
    
    if (!lastSeenAt) return false;
    const lastSeenDate = new Date(lastSeenAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeenDate > fiveMinutesAgo;
  };

  const isOnline = calculateIsOnline(profile.last_seen_at);

  const getAvatarUrl = (avatarPath?: string | null, username?: string) => {
    if (avatarPath) return avatarPath;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'U')}&background=random&color=fff`;
  };

  return (
    <div className="absolute left-0 top-full mt-2 w-72 md:w-80 bg-offWhite border border-grayLight rounded-xl shadow-elevated p-4 z-50">
      <div className="flex flex-col items-center mb-3">
        <Image
          src={getAvatarUrl(profile.avatar_url, profile.username)}
          alt={`${profile.username}'s avatar`}
          width={80}
          height={80}
          className="rounded-full border-2 border-blue-600 mb-2"
        />
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-darkCharcoal mr-1.5">
            {profile.username}
          </h3>
          <div className={`flex items-center text-sm ${isOnline ? 'text-green-600' : 'text-slate-500'}`}>
            <Sailboat size={14} className="mr-1.5" />
            {isOnline ? 'Online' : 'Offline'}
          </div>
          {profile.is_location_verified && (
            <span title="Verified Resident">
              <ShieldCheck size={16} className="ml-1 text-blue-600" />
            </span>
          )}
        </div>
        {profile.role && (
          <p className="text-xs text-grayLight capitalize">
            {profile.role.replace(/_/g, ' ')}
          </p>
        )}
      </div>

      {profile.email && (
        <div className="flex items-center text-sm text-darkCharcoal mb-1.5">
          <Mail size={14} className="mr-2 text-blue-600" />
          <span>{profile.email}</span>
        </div>
      )}

      {profile.bio && (
        <div className="mb-2 pt-2 border-t border-sand">
          <p className="text-xs text-grayLight font-medium mb-0.5">About Me:</p>
          <p className="text-sm text-darkCharcoal italic whitespace-pre-wrap">
            {profile.bio}
          </p>
        </div>
      )}

      {profile.created_at && (
        <div className="text-sm text-darkCharcoal flex items-center pt-2 border-t border-sand">
          <CalendarDays size={14} className="mr-2 text-blue-600" />
          <span>
            Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
          </span>
        </div>
      )}
      
      {/* View Profile button */}
      <div className="mt-3 pt-3 border-t border-sand">
        <Link href={`/profile/${profile.id}`} className="block w-full">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md text-sm transition duration-150 ease-in-out">
            View Profile
          </button>
        </Link>
      </div>
    </div>
  );
};

export default UserTooltipDisplay; 