'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function TestRoutingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUser(session.user);
          
          // Fetch communities
          const { data: communitiesData } = await supabase
            .from('communities')
            .select('id, name, slug');
          
          if (communitiesData) {
            setCommunities(communitiesData);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Routing Test Page</h1>
      
      {user ? (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Logged in as: {user.email}</h2>
            <p className="mb-4">Use the links below to test various routes in the application:</p>
            
            <div className="space-y-4">
              <h3 className="font-medium">Community Links:</h3>
              <ul className="space-y-2 pl-4">
                {communities.map(community => (
                  <li key={community.id} className="list-disc">
                    <div className="font-medium">{community.name}</div>
                    <div className="ml-4 space-y-1 mt-1">
                      <div>
                        <Link href={`/community/${community.slug}`} className="text-blue-600 hover:underline">
                          Regular Dashboard (should redirect to mini-dash)
                        </Link>
                      </div>
                      <div>
                        <Link href={`/community/${community.slug}/mini-dash`} className="text-blue-600 hover:underline">
                          Mini Dashboard (direct)
                        </Link>
                      </div>
                      <div>
                        <Link href={`/community/${community.slug}/business/directory`} className="text-blue-600 hover:underline">
                          Business Directory
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Back to Home
            </Link>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="mb-4">You need to be logged in to test routing.</p>
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Login
          </Link>
        </div>
      )}
    </div>
  );
} 