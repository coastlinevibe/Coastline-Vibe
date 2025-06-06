'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, MapPin, Users, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';
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
            .single();
          
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
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="mb-3">
        <h3 className="text-xl font-semibold mb-1">{event.title}</h3>
        <div className="text-sm text-gray-500 flex items-center">
          <span>Posted by {event.profiles?.username || 'Anonymous'}</span>
          {isUpcoming && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
              {timeUntil}
            </span>
          )}
        </div>
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
  );
};

export default EventCard; 