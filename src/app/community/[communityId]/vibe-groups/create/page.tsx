'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CreateVibeGroupParams, VibeGroupVisibility } from '@/types/vibe-groups';

export default function CreateVibeGroupPage() {
  const params = useParams();
  const communityId = params?.communityId as string;
  const router = useRouter();
  const [formData, setFormData] = useState<CreateVibeGroupParams>({
    name: '',
    description: '',
    visibility: 'public',
    community_id: communityId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

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

      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('You must be logged in to create a group');
      }

      const userId = userData.user.id;

      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('vibe_groups')
        .insert({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          visibility: formData.visibility,
          captain_id: userId,
          community_id: communityId,
          icon_url: null, // Icon upload would be handled separately
          upgrade_level: 0,
          is_active: true
        })
        .select()
        .single();

      if (groupError) {
        throw groupError;
      }

      if (!groupData) {
        throw new Error('Failed to create group');
      }

      // Add the creator as a captain member
      const { error: memberError } = await supabase
        .from('vibe_groups_members')
        .insert({
          group_id: groupData.id,
          user_id: userId,
          role: 'captain',
          status: 'active'
        });

      if (memberError) {
        throw memberError;
      }

      // Redirect to the new group
      router.push(`/community/${communityId}/vibe-groups/${groupData.id}`);
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
          href={`/community/${communityId}/vibe-groups`}
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
                href={`/community/${communityId}/vibe-groups`}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
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