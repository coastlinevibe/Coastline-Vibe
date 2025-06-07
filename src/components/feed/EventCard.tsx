'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, MapPin, Users, ExternalLink, Calendar as CalendarIcon, Flag, XSquare } from 'lucide-react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';

interface EventCardProps {
  postId: string;
}

const EventCard: React.FC<EventCardProps> = ({ postId }) => {
  const supabase = createClient();
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attending, setAttending] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        
        // Fetch the post data
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*, profiles:user_id(username, avatar_url)')
          .eq('id', postId)
          .eq('type', 'event')
          .single();
        
        if (postError) {
          throw new Error(postError.message);
        }
        
        if (!postData) {
          throw new Error('Event not found');
        }
        
        setEvent(postData);
        
        // Check if user is attending
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: attendeeData } = await supabase
            .from('event_attendees')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle();
          
          setAttending(!!attendeeData);
        }
        
        // Get attendee count
        const { data: attendeeCountData } = await supabase
          .from('event_attendees')
          .select('id', { count: 'exact' })
          .eq('post_id', postId);
        
        setAttendeeCount(attendeeCountData?.length || 0);
        
      } catch (err: any) {
        console.error('Error fetching event:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [postId, supabase]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    };

    fetchCurrentUser();
  }, [supabase]);

  const handleToggleAttending = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be logged in to RSVP to events');
        return;
      }
      
      if (attending) {
        // Remove attendance
        await supabase
          .from('event_attendees')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        setAttending(false);
        setAttendeeCount(prev => Math.max(0, prev - 1));
      } else {
        // Add attendance
        await supabase
          .from('event_attendees')
          .insert({
            post_id: postId,
            user_id: user.id
          });
        
        setAttending(true);
        setAttendeeCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error updating attendance:', err);
    }
  };

  const handleReport = async () => {
    if (!currentUserId) {
      setReportError("You must be logged in to report events");
      return;
    }
    
    try {
      const { error } = await supabase.from('post_reports').insert({
        reported_content_id: postId,
        content_type: 'event',
        reason: reportReason,
        reporter_user_id: currentUserId,
        community_id: event?.community_id,
      });
      if (error) throw error;
      setShowReportModal(false);
      setReportReason('');
      alert('Event reported successfully. Our team will review it.');
    } catch (error) {
      console.error("Error reporting event:", error);
      setReportError("Failed to submit report. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-4 text-red-500">
        Error: {error || 'Event data not available'}
      </div>
    );
  }

  const metadata = event.metadata || {};
  const startTime = metadata.start_time ? parseISO(metadata.start_time) : null;
  const endTime = metadata.end_time ? parseISO(metadata.end_time) : null;
  const isVirtual = metadata.is_virtual || false;
  const location = metadata.location;
  const virtualLink = metadata.virtual_link;

  // Format date and time for display
  const formattedStartDate = startTime ? format(startTime, 'EEEE, MMMM d, yyyy') : 'Date not specified';
  const formattedStartTime = startTime ? format(startTime, 'h:mm a') : 'Time not specified';
  const formattedEndTime = endTime ? format(endTime, 'h:mm a') : null;
  
  // Calculate time until event
  const timeUntil = startTime ? formatDistanceToNow(startTime, { addSuffix: true }) : '';
  const isUpcoming = startTime ? startTime > new Date() : false;

  // Check if dates are different (only if both dates exist)
  const formattedEndDate = endTime && startTime && 
    format(startTime, 'yyyy-MM-dd') !== format(endTime, 'yyyy-MM-dd')
    ? format(endTime, 'EEEE, MMMM d, yyyy')
    : null;

  return (
    <>
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="mb-3 flex justify-between items-start">
          <h3 className="text-xl font-semibold mb-1">{event.title}</h3>
          {currentUserId && event.user_id !== currentUserId && (
            <button 
              onClick={() => setShowReportModal(true)} 
              className="text-gray-500 hover:text-red-500"
              title="Report event"
            >
              <Flag size={16} />
            </button>
          )}
        </div>

        <div className="text-sm text-gray-500 flex items-center">
          <span>Posted by {event.profiles?.username || 'Anonymous'}</span>
          {isUpcoming && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
              {timeUntil}
            </span>
          )}
        </div>

        {event.content && (
          <div className="mb-4 text-gray-700">
            {event.content}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center mb-2">
            <Calendar className="text-blue-500 mr-2" size={18} />
            <div>
              <div>{formattedStartDate}</div>
              {formattedEndDate && (
                <div className="text-sm text-gray-500">to {formattedEndDate}</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center mb-2">
            <Clock className="text-blue-500 mr-2" size={18} />
            <div>
              {formattedStartTime}
              {formattedEndTime && ` - ${formattedEndTime}`}
            </div>
          </div>
          
          {isVirtual ? (
            <div className="flex items-center">
              <ExternalLink className="text-blue-500 mr-2" size={18} />
              <a 
                href={virtualLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {virtualLink}
              </a>
            </div>
          ) : location ? (
            <div className="flex items-center">
              <MapPin className="text-blue-500 mr-2" size={18} />
              <span>{location}</span>
            </div>
          ) : null}
        </div>

        {event.hashtags && event.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {event.hashtags.map((tag: string) => (
              <span 
                key={tag} 
                className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center">
            <Users className="text-blue-500 mr-1" size={18} />
            <span className="text-sm">
              {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} attending
            </span>
          </div>
          
          <button
            onClick={handleToggleAttending}
            className={`px-3 py-1 rounded-md text-sm flex items-center ${
              attending 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CalendarIcon size={16} className="mr-1" />
            {attending ? 'Attending' : 'Attend'}
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report Event</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <XSquare size={20}/>
              </button>
            </div>
            <textarea
              className="w-full p-2 border rounded mb-4 bg-white text-black border-gray-300 placeholder-gray-400"
              rows={3}
              placeholder="Please provide a reason for reporting this event..."
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

export default EventCard; 