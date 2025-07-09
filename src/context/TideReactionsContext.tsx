'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TideReaction, TideReactionType } from '@/types/tide-reactions';
import { v4 as uuidv4 } from 'uuid';

// Supabase storage bucket URL for reactions
const REACTIONS_BUCKET_URL = 'https://kbjudvamidagzzfvxgov.supabase.co/storage/v1/object/public/reactions/post%20reactions';

// Context type
interface TideReactionsContextType {
  reactions: Record<string, TideReaction[]>;
  addReaction: (postId: string, reactionCode: string, reactionType: string, reactionUrl: string, metadata?: Record<string, any>) => void;
  removeReaction: (reactionId: string) => void;
  hasUserReacted: (postId: string, reactionCode: string) => boolean;
  isOnline: boolean;
  getReactionUrl: (reactionCode: string) => string;
}

// Create context
const TideReactionsContext = createContext<TideReactionsContextType>({
  reactions: {},
  addReaction: () => {},
  removeReaction: () => {},
  hasUserReacted: () => false,
  isOnline: true,
  getReactionUrl: () => '',
});

// Get user ID from localStorage or generate a temporary one
const getUserId = (): string => {
  if (typeof window === 'undefined') return '';
  
  try {
    // Try to get from localStorage first
    const storedId = localStorage.getItem('tideReactionsUserId');
    if (storedId) return storedId;
    
    // If not found, try to get from user data
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      if (userData && userData.id) {
        const userId = userData.id;
        localStorage.setItem('tideReactionsUserId', userId);
        return userId;
      }
    }
    
    // Try session storage
    const sessionDataStr = sessionStorage.getItem('supabase.auth.token');
    if (sessionDataStr) {
      const sessionData = JSON.parse(sessionDataStr);
      const user = sessionData?.currentSession?.user;
      if (user?.id) {
        const userId = user.id;
        localStorage.setItem('tideReactionsUserId', userId);
        return userId;
      }
    }
    
    // Generate a temporary ID if all else fails
    const tempId = uuidv4();
    localStorage.setItem('tideReactionsUserId', tempId);
    return tempId;
  } catch (e) {
    console.error('Error getting user ID', e);
    const tempId = uuidv4();
    try {
      localStorage.setItem('tideReactionsUserId', tempId);
    } catch (e) {
      // Ignore localStorage errors
    }
    return tempId;
  }
};

// Get username from localStorage or use a default
const getUsername = (): string => {
  if (typeof window === 'undefined') return 'Anonymous';
  
  try {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      return userData.username || userData.full_name || 'Anonymous';
    }
    
    return 'Anonymous';
  } catch (e) {
    console.error('Error getting username', e);
    return 'Anonymous';
  }
};

// Provider component
export const TideReactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reactions, setReactions] = useState<Record<string, TideReaction[]>>({});
  const [isOnline, setIsOnline] = useState<boolean>(true);
  
  // Debug log
  useEffect(() => {
    console.log('TideReactionsProvider initialized');
    console.log('Initial reactions state:', reactions);
  }, []);
  
  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial status
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Clean up reactions after inactivity (20 minutes)
  useEffect(() => {
    let inactivityTimer: ReturnType<typeof setTimeout>;
    
    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      
      inactivityTimer = setTimeout(() => {
        // Clear all reactions after 20 minutes of inactivity
        console.log('Clearing reactions due to inactivity');
        setReactions({});
      }, 20 * 60 * 1000); // 20 minutes
    };
    
    // Set up event listeners for user activity
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(eventType => {
      window.addEventListener(eventType, resetInactivityTimer);
    });
    
    // Initialize the timer
    resetInactivityTimer();
    
    // Clean up
    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      activityEvents.forEach(eventType => {
        window.removeEventListener(eventType, resetInactivityTimer);
      });
    };
  }, []);
  
  // Periodically clean up expired reactions
  useEffect(() => {
    // Function to check and remove expired reactions
    const cleanupExpiredReactions = () => {
      const now = new Date().toISOString();
      let hasChanges = false;
      
      setReactions(prev => {
        const updated = { ...prev };
        
        for (const postId in updated) {
          const filteredReactions = updated[postId].filter(reaction => {
            // Keep reactions without an expiration date
            if (!reaction.expiresAt) return true;
            
            // Remove expired reactions
            return reaction.expiresAt > now;
          });
          
          if (filteredReactions.length !== updated[postId].length) {
            hasChanges = true;
            updated[postId] = filteredReactions;
            
            // If no reactions left for this post, remove the key
            if (filteredReactions.length === 0) {
              delete updated[postId];
            }
          }
        }
        
        return hasChanges ? updated : prev;
      });
    };
    
    // Check every minute
    const cleanupInterval = setInterval(cleanupExpiredReactions, 60 * 1000);
    
    // Initial cleanup
    cleanupExpiredReactions();
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);
  
  // Clear reactions when user goes offline
  useEffect(() => {
    if (!isOnline) {
      console.log('User went offline, clearing reactions');
      setReactions({});
    }
  }, [isOnline]);
  
  // Add a reaction
  const addReaction = async (postId: string, reactionCode: string, reactionType: string, reactionUrl: string, metadata?: Record<string, any>) => {
    if (!isOnline) {
      console.warn('Cannot add reaction while offline');
      return;
    }
    
    const userId = getUserId();
    const username = getUsername();
    
    // Check if user already has this reaction on this post
    const existingReaction = (reactions[postId] || []).find(
      r => r.userId === userId && r.reactionCode === reactionCode
    );
    
    if (existingReaction) {
      // If they do, remove it (toggle behavior)
      console.log('Removing existing reaction:', existingReaction);
      removeReaction(existingReaction.id);
      return;
    }

    // Set expiration time to 20 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 20);
    
    // Ensure the reaction URL is from the reactions bucket
    const normalizedReactionUrl = ensureReactionFromBucket(reactionCode, reactionUrl);
    
    // Create new reaction
    const newReaction: TideReaction = {
      id: uuidv4(),
      postId,
      userId,
      username,
      reactionCode,
      reactionType: reactionType as TideReactionType,
      reactionUrl: normalizedReactionUrl,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      metadata: metadata || {},
    };
    
    // Save to database via API (always call the API)
    try {
      await fetch('/api/feed/reactions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          reactionType,
          reactionId: reactionCode,
          expiresAt: expiresAt.toISOString()
        }),
      });
    } catch (error) {
      console.error('Error saving reaction to database:', error);
    }
    
    // Local state update (keep optimistic UI)
    setReactions(prev => {
      const updated = { ...prev };
      if (!updated[postId]) updated[postId] = [];
      updated[postId] = [...updated[postId], newReaction];
      return updated;
    });
    console.log('Adding new reaction:', newReaction);
  };
  
  // Helper to ensure reaction URLs come from the reactions bucket
  const ensureReactionFromBucket = (reactionCode: string, providedUrl: string): string => {
    // If the URL is already from our bucket, use it
    if (providedUrl.includes('/reactions/') && providedUrl.includes('kbjudvamidagzzfvxgov.supabase.co')) {
      return providedUrl;
    }
    
    // Otherwise, construct the URL from the reaction code
    return `${REACTIONS_BUCKET_URL}/${reactionCode}.png`;
  };
  
  // Get a reaction URL from the reactions bucket
  const getReactionUrl = (reactionCode: string): string => {
    return `${REACTIONS_BUCKET_URL}/${reactionCode}.png`;
  };
  
  // Remove a reaction
  const removeReaction = (reactionId: string) => {
    console.log('Removing reaction with ID:', reactionId);
    
    setReactions(prev => {
      const newReactions = { ...prev };
      
      // Find which post contains this reaction
      for (const postId in newReactions) {
        newReactions[postId] = newReactions[postId].filter(r => r.id !== reactionId);
        
        // If no reactions left for this post, remove the key
        if (newReactions[postId].length === 0) {
          delete newReactions[postId];
        }
      }
      
      console.log('Updated reactions state after removal:', newReactions);
      return newReactions;
    });
  };
  
  // Check if user has already reacted with a specific reaction
  const hasUserReacted = (postId: string, reactionCode: string): boolean => {
    const userId = getUserId();
    return (reactions[postId] || []).some(
      r => r.userId === userId && r.reactionCode === reactionCode
    );
  };
  
  return (
    <TideReactionsContext.Provider
      value={{
        reactions,
        addReaction,
        removeReaction,
        hasUserReacted,
        isOnline,
        getReactionUrl,
      }}
    >
      {children}
    </TideReactionsContext.Provider>
  );
};

// Custom hook to use the context
export const useTideReactions = () => useContext(TideReactionsContext); 