"use client";

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function BusinessSidebar() {
  const params = useParams() || {};
  const pathname = usePathname() || '';
  const communityId = (params && typeof params === 'object' && 'communityId' in params) ? params.communityId as string : '';
  
  const menuItems = [
    { 
      name: 'Dashboard', 
      path: `/community/${communityId}/business/directory/businessmenu`,
      active: pathname.includes('/businessmenu')
    },
    { 
      name: 'My Businesses', 
      path: `/community/${communityId}/business/directory/my-businesses`,
      active: pathname.includes('/my-businesses')
    },
    { 
      name: 'Local Directory', 
      path: `/community/${communityId}/business/directory`,
      active: pathname === `/community/${communityId}/business/directory`
    },
    { 
      name: 'Leads', 
      path: `/community/${communityId}/business/directory/leads`,
      active: pathname.includes('/leads')
    },
    { 
      name: 'Opportunities', 
      path: `/community/${communityId}/business/directory/opportunities`,
      active: pathname.includes('/opportunities')
    },
    { 
      name: 'Analytics', 
      path: `/community/${communityId}/business/directory/analytics`,
      active: pathname.includes('/analytics')
    },
    { 
      name: 'Owner Verification', 
      path: `/community/${communityId}/business/directory/owner-verification`,
      active: pathname.includes('/owner-verification')
    },
    { 
      name: 'Settings', 
      path: `/community/${communityId}/business/directory/settings`,
      active: pathname.includes('/settings')
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-grayLight h-full">
      <div className="p-4 border-b border-grayLight">
        <h2 className="text-xl font-heading font-semibold text-primaryTeal">Business Menu</h2>
      </div>
      
      <nav className="py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link 
                href={item.path}
                className={`block px-4 py-2 text-sm ${
                  item.active 
                    ? 'bg-seafoam/20 text-primaryTeal font-medium border-l-4 border-primaryTeal' 
                    : 'text-darkCharcoal hover:bg-seafoam/10 hover:text-primaryTeal'
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Remove the New Business Listing button at the bottom */}
    </div>
  );
} 