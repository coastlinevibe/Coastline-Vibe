'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, Loader2, Calendar } from 'lucide-react';

interface AnnouncementCreatorProps {
  communityId: string;
  onAnnouncementCreated: () => void;
}

const AnnouncementCreator: React.FC<AnnouncementCreatorProps> = ({ communityId, onAnnouncementCreated }) => {
  const supabase = createClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [hasExpiration, setHasExpiration] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!title.trim()) {
      setError('Announcement title is required');
      return;
    }

    if (!content.trim()) {
      setError('Announcement content is required');
      return;
    }

    setIsCreating(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to create an announcement');
        setIsCreating(false);
        return;
      }

      // Create the post
      const postData = {
        title: title,
        content: content,
        user_id: user.id,
        community_id: communityId,
        type: 'announce',
        is_visible: true,
        metadata: {
          is_important: isImportant,
          expires_at: hasExpiration && expiresAt ? expiresAt : null
        }
      };

      const { error: postError } = await supabase
        .from('posts')
        .insert(postData);

      if (postError) {
        throw new Error(`Error creating announcement: ${postError.message}`);
      }

      // Reset form
      setTitle('');
      setContent('');
      setIsImportant(false);
      setExpiresAt('');
      setHasExpiration(false);
      onAnnouncementCreated();
    } catch (err: any) {
      console.error('Error creating announcement:', err);
      setError(err.message || 'An error occurred while creating the announcement');
    } finally {
      setIsCreating(false);
    }
  };

  // Calculate minimum date for expiration (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <Megaphone size={20} className="mr-2 text-blue-500" />
        Create Announcement
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="announcementTitle" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            id="announcementTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title..."
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={isCreating}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="announcementContent" className="block text-sm font-medium mb-1">
            Content
          </label>
          <textarea
            id="announcementContent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Announcement details..."
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={isCreating}
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              id="isImportant"
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="mr-2"
              disabled={isCreating}
            />
            <label htmlFor="isImportant" className="text-sm font-medium">
              Mark as important
            </label>
          </div>
          
          <div className="flex items-center mb-2">
            <input
              id="hasExpiration"
              type="checkbox"
              checked={hasExpiration}
              onChange={(e) => setHasExpiration(e.target.checked)}
              className="mr-2"
              disabled={isCreating}
            />
            <label htmlFor="hasExpiration" className="text-sm font-medium">
              Set expiration date
            </label>
          </div>
          
          {hasExpiration && (
            <div className="flex items-center">
              <Calendar size={18} className="mr-2 text-gray-500" />
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={minDate}
                className="p-2 border border-gray-300 rounded-md"
                disabled={isCreating}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-4">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Post Announcement'
          )}
        </button>
      </form>
    </div>
  );
};

export default AnnouncementCreator; 