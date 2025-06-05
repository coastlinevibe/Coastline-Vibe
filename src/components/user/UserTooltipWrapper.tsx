'use client';

import React, { useState, useRef, useCallback } from 'react';
import UserTooltipDisplay, { type UserTooltipProfileData } from './UserTooltipDisplay';

interface UserTooltipWrapperProps {
  children: React.ReactNode;
  profileData: UserTooltipProfileData | null; // Allow null if data might be missing
  delay?: number; // Optional delay before showing tooltip
}

const UserTooltipWrapper: React.FC<UserTooltipWrapperProps> = ({ children, profileData, delay = 200 }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const leaveTimeoutRef = useRef<number | null>(null);

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
    >
      {children}
      {isTooltipVisible && (
        <div 
          onMouseEnter={handleTooltipMouseEnter} 
          onMouseLeave={handleTooltipMouseLeave}
        >
          <UserTooltipDisplay profile={profileData} />
        </div>
      )}
    </div>
  );
};

export default UserTooltipWrapper; 