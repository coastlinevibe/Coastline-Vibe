'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface AnnouncementCardProps {
  postId: string;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ postId }) => {
  const supabase = createClient();
  const [announcement, setAnnouncement] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        
        // Fetch the post data
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*, profiles:user_id(username, avatar_url)')
          .eq('id', postId)
          .eq('type', 'announce')
          .single();
        
        if (postError) {
          throw new Error(postError.message);
        }
        
        if (!postData) {
          throw new Error('Announcement not found');
        }
        
        setAnnouncement(postData);
      } catch (err: any) {
        console.error('Error fetching announcement:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnnouncement();
  }, [postId, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="p-4 text-red-500">
        Error: {error || 'Announcement data not available'}
      </div>
    );
  }

  const metadata = announcement.metadata || {};
  const isImportant = metadata.is_important || false;
  const expiresAt = metadata.expires_at ? parseISO(metadata.expires_at) : null;
  
  // Calculate expiration info
  const isExpired = expiresAt && expiresAt < new Date();
  const expiresIn = expiresAt && !isExpired ? formatDistanceToNow(expiresAt, { addSuffix: true }) : '';

  return (
    <div className={`rounded-lg p-4 border ${
      isImportant 
        ? 'bg-amber-50 border-amber-200' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start">
        <div className={`p-2 rounded-full mr-3 ${
          isImportant ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {isImportant ? <AlertTriangle size={20} /> : <Megaphone size={20} />}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold">{announcement.title}</h3>
            {isImportant && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                Important
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-500 mb-3">
            Posted by {announcement.profiles?.username || 'Anonymous'} • {
              new Date(announcement.created_at).toLocaleDateString()
            }
          </div>
          
          <div className="text-gray-700 mb-3">
            {announcement.content}
          </div>
          
          {expiresAt && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock size={14} className="mr-1" />
              {isExpired ? (
                <span className="text-red-500">Expired</span>
              ) : (
                <span>Expires {expiresIn}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard; 