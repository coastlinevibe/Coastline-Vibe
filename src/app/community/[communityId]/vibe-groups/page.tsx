'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { VibeGroup } from '@/types/vibe-groups';

export default function VibeGroupsPage() {
  const { communityId } = useParams();
  const [groups, setGroups] = useState<VibeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchGroups() {
      if (!communityId) return;
      
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('vibe_groups')
          .select(`
            *,
            captain:profiles!captain_id(id, username, avatar_url),
            member_count:vibe_groups_members(count)
          `)
          .eq('community_id', communityId)
          .eq('is_active', true);
          
        if (error) {
          throw error;
        }
        
        setGroups(data || []);
      } catch (err) {
        console.error('Error fetching vibe groups:', err);
        setError('Failed to load vibe groups');
      } finally {
        setLoading(false);
      }
    }
    
    fetchGroups();
  }, [communityId, supabase]);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vibe Groups</h1>
        <Link 
          href={`/community/${communityId}/vibe-groups/create`}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Group
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-10">{error}</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No vibe groups found in this community.</p>
          <p className="text-gray-500">Create a new group to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Link 
              key={group.id} 
              href={`/community/${communityId}/vibe-groups/${group.id}`}
              className="block"
            >
              <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 bg-gray-200 relative">
                  {group.icon_url ? (
                    <img 
                      src={group.icon_url} 
                      alt={group.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
                      <span className="text-4xl font-bold text-white">
                        {group.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{group.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">
                    {group.description || 'No description'}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center">
                      {group.captain?.avatar_url ? (
                        <img 
                          src={group.captain.avatar_url} 
                          alt={group.captain.username || 'Captain'} 
                          className="w-5 h-5 rounded-full mr-1"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-300 mr-1"></div>
                      )}
                      Captain: {group.captain?.username || 'Unknown'}
                    </span>
                    <span>
                      {group.member_count?.[0]?.count || 1} members
                    </span>
                  </div>
                  <div className="mt-2 text-xs inline-block px-2 py-1 rounded bg-gray-100">
                    {group.visibility === 'public' ? '🌎 Public' : 
                     group.visibility === 'private' ? '🔒 Private' : '🕵️ Secret'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 