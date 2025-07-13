'use client';

import { ReactNode } from 'react';

interface CommunityLayoutProps {
  children: ReactNode;
}

export default function CommunityLayout({ children }: CommunityLayoutProps) {
  return (
    <div className="min-h-screen">
      <main className="py-8 px-8 max-w-[1200px] mx-auto">
        {children}
      </main>
    </div>
  );
} 