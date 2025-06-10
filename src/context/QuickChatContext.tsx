'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// This is a placeholder file for the removed QuickChat feature
// The original implementation has been deleted

interface QuickChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  activeCommunityId: string | null;
  setActiveCommunityId: (id: string) => void;
}

const defaultContext: QuickChatContextType = {
  isOpen: false,
  openChat: () => {},
  closeChat: () => {},
  activeCommunityId: null,
  setActiveCommunityId: () => {},
};

const QuickChatContext = createContext<QuickChatContextType>(defaultContext);

export const useQuickChat = () => useContext(QuickChatContext);

export const QuickChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCommunityId, setActiveCommunityIdState] = useState<string | null>(null);
  
  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  
  const setActiveCommunityId = (id: string) => {
    setActiveCommunityIdState(id);
  };

  return (
    <QuickChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        activeCommunityId,
        setActiveCommunityId,
      }}
    >
      {children}
    </QuickChatContext.Provider>
  );
};

export default QuickChatProvider; 