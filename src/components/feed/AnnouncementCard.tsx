'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, AlertTriangle, Clock, Flag, XSquare } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface AnnouncementCardProps {
  postId: string;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ postId }) => {
  const supabase = createClient();
  const [announcement, setAnnouncement] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    };

    fetchCurrentUser();
  }, [supabase]);

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

  const handleReport = async () => {
    if (!currentUserId) {
      setReportError("You must be logged in to report announcements");
      return;
    }
    
    try {
      const { error } = await supabase.from('post_reports').insert({
        reported_content_id: postId,
        content_type: 'announce',
        reason: reportReason,
        reporter_user_id: currentUserId,
        community_id: announcement?.community_id,
      });
      if (error) throw error;
      setShowReportModal(false);
      setReportReason('');
      alert('Announcement reported successfully. Our team will review it.');
    } catch (error) {
      console.error("Error reporting announcement:", error);
      setReportError("Failed to submit report. Please try again.");
    }
  };

  return (
    <>
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
              <div className="flex items-center">
                {isImportant && (
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full mr-2">
                    Important
                  </span>
                )}
                {currentUserId && announcement.user_id !== currentUserId && (
                  <button 
                    onClick={() => setShowReportModal(true)} 
                    className="text-gray-500 hover:text-red-500"
                    title="Report announcement"
                  >
                    <Flag size={16} />
                  </button>
                )}
              </div>
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report Announcement</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <XSquare size={20}/>
              </button>
            </div>
            <textarea
              className="w-full p-2 border rounded mb-4 bg-white text-black border-gray-300 placeholder-gray-400"
              rows={3}
              placeholder="Please provide a reason for reporting this announcement..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              autoFocus
            />
            {reportError && <p className="text-xs text-red-500 mb-3">{reportError}</p>}
            <div className="flex justify-end space-x-3">
              <button onClick={() => { setShowReportModal(false); setReportReason(''); setReportError(null); }} className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800">Cancel</button>
              <button onClick={handleReport} className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center" disabled={!reportReason.trim()}>
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementCard; 