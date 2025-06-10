'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CreateVibeGroupParams, VibeGroupVisibility } from '@/types/vibe-groups';

export default function CreateVibeGroupPage() {
  const params = useParams();
  const communitySlug = params?.communityId as string;
  const router = useRouter();
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateVibeGroupParams>({
    name: '',
    description: '',
    visibility: 'public',
    community_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Fetch community ID from slug
  useEffect(() => {
    async function fetchCommunityId() {
      if (!communitySlug) return;
      
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('id')
          .eq('slug', communitySlug)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setCommunityId(data.id);
          setFormData(prev => ({ ...prev, community_id: data.id }));
        } else {
          setError('Community not found');
        }
      } catch (err) {
        console.error('Error fetching community:', err);
        setError('Failed to load community');
      }
    }
    
    fetchCommunityId();
  }, [communitySlug, supabase]);

  // Check authentication status on load
  useEffect(() => {
    async function checkAuth() {
      try {
        // Get auth session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (!sessionData?.session) {
          setError('You must be logged in to create a group');
          return;
        }
        
        setIsAuthenticated(true);
        const authUserId = sessionData.session.user.id;
        setUserId(authUserId);
        
        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('id', authUserId)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          
          // Try to find profile by email
          const userEmail = sessionData.session.user.email;
          if (userEmail) {
            const { data: emailProfileData } = await supabase
              .from('profiles')
              .select('id, username')
              .eq('email', userEmail)
              .single();
              
            if (emailProfileData) {
              console.log('Found profile by email:', emailProfileData);
              setProfileId(emailProfileData.id);
            } else {
              setError('Could not find your profile. Please contact support.');
            }
          }
        } else if (profileData) {
          console.log('Found profile:', profileData);
          setProfileId(profileData.id);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Authentication error. Please try logging in again.');
      }
    }
    
    checkAuth();
  }, [supabase]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Group name is required');
      }

      // Check if we have a profile ID
      if (!profileId) {
        throw new Error('Could not find your profile. Please contact support.');
      }

      // Check if we have a community ID
      if (!communityId) {
        throw new Error('Community not found');
      }

      console.log('Creating group with profile ID:', profileId);

      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('vibe_groups')
        .insert({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          visibility: formData.visibility,
          captain_id: profileId,
          community_id: communityId,
          icon_url: null, // Icon upload would be handled separately
          upgrade_level: 0,
          is_active: true
        })
        .select()
        .single();

      if (groupError) {
        console.error('Error creating group:', groupError);
        throw new Error(groupError.message || 'Failed to create group');
      }

      if (!groupData) {
        throw new Error('Failed to create group');
      }

      console.log('Group created:', groupData);

      // Add the creator as a captain member
      const { error: memberError } = await supabase
        .from('vibe_groups_members')
        .insert({
          group_id: groupData.id,
          user_id: profileId,
          role: 'captain',
          status: 'active'
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
        throw new Error(memberError.message || 'Failed to add you as a member');
      }

      // Redirect to the new group
      router.push(`/community/${communitySlug}/vibe-groups/${groupData.id}`);
    } catch (err) {
      console.error('Error creating vibe group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Link 
          href={`/community/${communitySlug}/vibe-groups`}
          className="text-blue-500 hover:underline mb-4 inline-block"
        >
          ← Back to Vibe Groups
        </Link>
        <h1 className="text-2xl font-bold">Create New Vibe Group</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 font-bold mb-2">
                Group Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter group name"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 font-bold mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your group (optional)"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="visibility" className="block text-gray-700 font-bold mb-2">
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">🌎 Public - Anyone can find and join</option>
                <option value="private">🔒 Private - Requires approval to join</option>
                <option value="secret">🕵️ Secret - Hidden, join by invitation only</option>
              </select>
              <p className="text-gray-500 text-sm mt-1">
                {formData.visibility === 'public' 
                  ? 'Anyone can find and join this group.'
                  : formData.visibility === 'private'
                  ? 'Users can find this group but need approval to join.'
                  : 'This group is hidden and users can only join by invitation.'}
              </p>
            </div>

            <div className="flex justify-end">
              <Link
                href={`/community/${communitySlug}/vibe-groups`}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !isAuthenticated || !profileId || !communityId}
                className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded ${
                  (loading || !isAuthenticated || !profileId || !communityId) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 