'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, MapPin, Loader2, Tag, X } from 'lucide-react';
import PoliteRewriter from './PoliteRewriter';

interface EventCreatorProps {
  communityId: string;
  onEventCreated: () => void;
}

const EventCreator: React.FC<EventCreatorProps> = ({ communityId, onEventCreated }) => {
  const supabase = createClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [virtualLink, setVirtualLink] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleRewriteTitle = (rewrittenText: string) => {
    setTitle(rewrittenText);
  };

  const handleRewriteDescription = (rewrittenText: string) => {
    setDescription(rewrittenText);
  };

  const handleRewriteLocation = (rewrittenText: string) => {
    setLocation(rewrittenText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!title.trim()) {
      setError('Event title is required');
      return;
    }

    if (!startDate || !startTime) {
      setError('Event start date and time are required');
      return;
    }

    if (isVirtual && !virtualLink.trim()) {
      setError('Virtual event link is required');
      return;
    }

    if (!isVirtual && !location.trim()) {
      setError('Event location is required');
      return;
    }

    setIsCreating(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to create an event');
        setIsCreating(false);
        return;
      }

      // Format the event metadata
      const startDateTime = `${startDate}T${startTime}:00`;
      const endDateTime = endDate && endTime ? `${endDate}T${endTime}:00` : null;

      // Create the post
      const postData = {
        title: title,
        content: description,
        user_id: user.id,
        community_id: communityId,
        type: 'event',
        is_visible: true,
        hashtags: tags.length > 0 ? tags : null,
        metadata: {
          start_time: startDateTime,
          end_time: endDateTime,
          location: !isVirtual ? location : null,
          is_virtual: isVirtual,
          virtual_link: isVirtual ? virtualLink : null
        }
      };

      const { error: postError } = await supabase
        .from('posts')
        .insert(postData);

      if (postError) {
        throw new Error(`Error creating event: ${postError.message}`);
      }

      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      setIsVirtual(false);
      setVirtualLink('');
      setTags([]);
      setTagInput('');
      onEventCreated();
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'An error occurred while creating the event');
    } finally {
      setIsCreating(false);
    }
  };

  // Calculate minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <Calendar size={20} className="mr-2 text-blue-500" />
        Create Event
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="eventTitle" className="block text-sm font-medium mb-1">
            Event Title
          </label>
          <input
            id="eventTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter event title"
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={isCreating}
          />
          
          {/* Add PoliteRewriter for title */}
          <div className="mt-1">
            <PoliteRewriter
              originalText={title}
              onRewritten={handleRewriteTitle}
              disabled={isCreating || !title.trim()}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="eventDescription" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="eventDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your event..."
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={isCreating}
          />
          
          {/* Add PoliteRewriter for description */}
          <div className="mt-1">
            <PoliteRewriter
              originalText={description}
              onRewritten={handleRewriteDescription}
              disabled={isCreating || !description.trim()}
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              id="isVirtual"
              type="checkbox"
              checked={isVirtual}
              onChange={(e) => setIsVirtual(e.target.checked)}
              className="mr-2"
              disabled={isCreating}
            />
            <label htmlFor="isVirtual" className="text-sm font-medium">
              This is a virtual event
            </label>
          </div>
        </div>

        {isVirtual ? (
          <div className="mb-4">
            <label htmlFor="virtualLink" className="block text-sm font-medium mb-1">
              Virtual Event Link
            </label>
            <input
              id="virtualLink"
              type="text"
              value={virtualLink}
              onChange={(e) => setVirtualLink(e.target.value)}
              placeholder="Zoom, Teams, Google Meet link, etc."
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isCreating}
            />
          </div>
        ) : (
          <div className="mb-4">
            <label htmlFor="eventLocation" className="block text-sm font-medium mb-1 flex items-center">
              <MapPin size={16} className="mr-1" />
              Location
            </label>
            <input
              id="eventLocation"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter event location"
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isCreating}
            />
            
            {/* Add PoliteRewriter for location */}
            <div className="mt-1">
              <PoliteRewriter
                originalText={location}
                onRewritten={handleRewriteLocation}
                disabled={isCreating || !location.trim()}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-1 flex items-center">
              <Calendar size={16} className="mr-1" />
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={minDate}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isCreating}
            />
          </div>
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium mb-1 flex items-center">
              <Clock size={16} className="mr-1" />
              Start Time
            </label>
            <input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isCreating}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-1 flex items-center">
              <Calendar size={16} className="mr-1" />
              End Date (Optional)
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || minDate}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isCreating || !startDate}
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium mb-1 flex items-center">
              <Clock size={16} className="mr-1" />
              End Time (Optional)
            </label>
            <input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isCreating || !startTime}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 flex items-center">
            <Tag size={16} className="mr-1" />
            Tags (Optional)
          </label>
          <div className="flex">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add event tags"
              className="flex-1 p-2 border border-gray-300 rounded-l-md"
              disabled={isCreating}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300"
              disabled={isCreating || !tagInput.trim()}
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    disabled={isCreating}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
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
            'Create Event'
          )}
        </button>
      </form>
    </div>
  );
};

export default EventCreator; 