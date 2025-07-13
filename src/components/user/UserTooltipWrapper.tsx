'use client';

import React, { useState, useRef, useCallback } from 'react';
import UserTooltipDisplay, { type UserTooltipProfileData } from './UserTooltipDisplay';
import { useRouter } from 'next/navigation';

interface UserTooltipWrapperProps {
  children: React.ReactNode;
  profileData: UserTooltipProfileData | null; // Allow null if data might be missing
  delay?: number; // Optional delay before showing tooltip
  currentUserId?: string | null; // Add current user ID
}

const UserTooltipWrapper: React.FC<UserTooltipWrapperProps> = ({ children, profileData, delay = 200, currentUserId }) => {
  const router = useRouter();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeouts = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  const handleMouseEnter = useCallback(() => {
    clearTimeouts();
    hoverTimeoutRef.current = setTimeout(() => {
      if (profileData) { // Only show if profileData is available
        setIsTooltipVisible(true);
      }
    }, delay);
  }, [profileData, delay]);

  const handleMouseLeave = useCallback(() => {
    clearTimeouts();
    leaveTimeoutRef.current = setTimeout(() => {
      setIsTooltipVisible(false);
    }, 150); // Slight delay before hiding to allow moving mouse to tooltip
  }, []);

  const handleTooltipMouseEnter = () => {
    clearTimeouts(); // If mouse enters the tooltip itself, keep it open
  };

  const handleTooltipMouseLeave = () => {
    clearTimeouts(); // Hide if mouse leaves the tooltip
    leaveTimeoutRef.current = setTimeout(() => {
      setIsTooltipVisible(false);
    }, 150);
  };

  const handleClick = () => {
    if (profileData?.id) {
      router.push(`/profile/${profileData.id}`);
    }
  };

  if (!profileData) {
    // If no profile data, just render children without tooltip functionality
    // Or, you could render a placeholder/loader, but the strategy is to have data ready
    return <>{children}</>;
  }

  return (
    <div 
      className="relative inline-block" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {children}
      {isTooltipVisible && (
        <div 
          onMouseEnter={handleTooltipMouseEnter} 
          onMouseLeave={handleTooltipMouseLeave}
        >
          <UserTooltipDisplay profile={profileData} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
};

export default UserTooltipWrapper; 