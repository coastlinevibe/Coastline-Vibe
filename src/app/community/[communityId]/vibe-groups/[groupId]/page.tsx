'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { VibeGroupWithDetails, VibeGroupMessage } from '@/types/vibe-groups';
import { VibeGroupsClient } from '@/lib/supabase/vibe-groups-client';

export default function VibeGroupDetailPage() {
  const params = useParams();
  const communitySlug = params?.communityId as string;
  const groupId = params?.groupId as string;
  const [group, setGroup] = useState<VibeGroupWithDetails | null>(null);
  const [messages, setMessages] = useState<VibeGroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const vibeGroupsClient = useRef(new VibeGroupsClient()).current;
  
  // Fetch group details and messages
  useEffect(() => {
    async function fetchGroupDetails() {
      if (!groupId) return;
      
      setLoading(true);
      
      try {
        // Fetch group details using the client
        const { data: groupData, error: groupError } = await vibeGroupsClient.getGroupDetails(groupId);
          
        if (groupError) {
          throw groupError;
        }
        
        setGroup(groupData);
        
        // Fetch messages using the client
        const { data: messagesData, error: messagesError } = await vibeGroupsClient.getMessages(groupId, { limit: 50 });
          
        if (messagesError) {
          throw messagesError;
        }
        
        setMessages(messagesData || []);
      } catch (err) {
        console.error('Error fetching vibe group details:', err);
        setError('Failed to load group details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchGroupDetails();
  }, [groupId, vibeGroupsClient]);
  
  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!groupId) return;
    
    // Subscribe to new messages
    const unsubscribe = vibeGroupsClient.subscribeToMessages(groupId, (newMessage) => {
      setMessages(prevMessages => {
        // Check if message already exists to prevent duplicates
        if (prevMessages.some(msg => msg.id === newMessage.id)) {
          return prevMessages;
        }
        return [newMessage, ...prevMessages];
      });
    });
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [groupId, vibeGroupsClient]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !groupId) return;
    
    try {
      // Use the client to send a message
      const { data: newMessage, error } = await vibeGroupsClient.sendMessage({
        group_id: groupId,
        content: messageInput.trim(),
        message_type: 'text'
      });
        
      if (error) {
        throw error;
      }
      
      // The real-time subscription should handle adding the message to the UI
      setMessageInput('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <div className="text-red-500 mb-4">{error || 'Group not found'}</div>
        <Link 
          href={`/community/${communitySlug}/vibe-groups`}
          className="text-blue-500 hover:underline"
        >
          Back to Vibe Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Link 
          href={`/community/${communitySlug}/vibe-groups`}
          className="text-blue-500 hover:underline mb-4 inline-block"
        >
          ← Back to Vibe Groups
        </Link>
        
        <div className="flex items-center">
          {group.icon_url ? (
            <img 
              src={group.icon_url} 
              alt={group.name} 
              className="w-16 h-16 rounded-full mr-4 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full mr-4 flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
              <span className="text-2xl font-bold text-white">
                {group.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-gray-500">{group.description}</p>
            <div className="flex items-center mt-1 text-sm">
              <span className="mr-4">
                {group.members?.length || 0} members
              </span>
              <span className="text-xs px-2 py-1 rounded bg-gray-100">
                {group.visibility === 'public' ? '🌎 Public' : 
                 group.visibility === 'private' ? '🔒 Private' : '🕵️ Secret'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-bold mb-2">Captain</h3>
            <div className="flex items-center">
              {group.captain?.avatar_url ? (
                <img 
                  src={group.captain.avatar_url} 
                  alt={group.captain.username || 'Captain'} 
                  className="w-8 h-8 rounded-full mr-2"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
              )}
              <span>{group.captain?.username || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-bold mb-2">Members ({group.members?.length || 0})</h3>
            <div className="max-h-60 overflow-y-auto">
              {group.members?.map(member => (
                <div key={member.id} className="flex items-center py-1">
                  {member.user?.avatar_url ? (
                    <img 
                      src={member.user.avatar_url} 
                      alt={member.user.username || 'Member'} 
                      className="w-6 h-6 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 mr-2"></div>
                  )}
                  <span className="text-sm">
                    {member.user?.username || 'Unknown'}
                    {member.role !== 'crew' && (
                      <span className="ml-1 text-xs text-gray-500">
                        ({member.role})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {group.pins && group.pins.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">Pinned Messages</h3>
              <div className="max-h-60 overflow-y-auto">
                {group.pins.map(pin => (
                  <div key={pin.id} className="border-b py-2 last:border-b-0">
                    <div className="text-xs text-gray-500 mb-1">
                      Pinned by {pin.user?.username || 'Unknown'}
                    </div>
                    <div className="text-sm">
                      {pin.message?.content || 'No content'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Chat Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="border-t">
              <div className="p-4 flex">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </form>
            
            {/* Messages */}
            <div className="p-4 h-[500px] overflow-y-auto flex flex-col-reverse">
              {messages.length > 0 ? (
                messages.map(message => (
                  <div key={message.id} className="mb-4">
                    <div className="flex items-start">
                      {message.sender?.avatar_url ? (
                        <img 
                          src={message.sender.avatar_url} 
                          alt={message.sender?.username || 'User'} 
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
                      )}
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">
                            {message.sender?.username || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                          {message.is_edited && (
                            <span className="text-xs text-gray-500 ml-1">(edited)</span>
                          )}
                        </div>
                        <div className="mt-1 text-gray-800">
                          {message.content}
                        </div>
                        
                        {/* Display media attachments if any */}
                        {message.media && message.media.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.media.map(media => (
                              <div key={media.id} className="relative">
                                {media.media_type === 'image' ? (
                                  <img 
                                    src={media.file_url} 
                                    alt="Attachment" 
                                    className="max-h-40 rounded-md"
                                  />
                                ) : media.media_type === 'video' ? (
                                  <video 
                                    src={media.file_url} 
                                    controls 
                                    className="max-h-40 rounded-md"
                                  />
                                ) : (
                                  <div className="p-2 bg-gray-100 rounded-md">
                                    <a 
                                      href={media.file_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline"
                                    >
                                      {media.file_name || 'Attachment'}
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Display voice note if any */}
                        {message.voice_note && (
                          <div className="mt-2">
                            <audio src={message.voice_note.audio_url} controls className="w-full" />
                            {message.voice_note.transcription && (
                              <div className="mt-1 text-xs text-gray-500 italic">
                                {message.voice_note.transcription}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Display reactions if any */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {/* Group reactions by type and id */}
                            {Object.entries(
                              message.reactions.reduce((acc: Record<string, { count: number, users: string[] }>, reaction) => {
                                const key = `${reaction.reaction_type}:${reaction.reaction_id}`;
                                if (!acc[key]) {
                                  acc[key] = { count: 0, users: [] };
                                }
                                acc[key].count++;
                                if (reaction.user?.username) {
                                  acc[key].users.push(reaction.user.username);
                                }
                                return acc;
                              }, {})
                            ).map(([key, { count, users }]) => {
                              const [type, id] = key.split(':');
                              return (
                                <div 
                                  key={key} 
                                  className="bg-gray-100 rounded-full px-2 py-0.5 text-sm flex items-center"
                                  title={users.join(', ')}
                                >
                                  <span className="mr-1">{id}</span>
                                  <span className="text-xs text-gray-500">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-10">
                  No messages yet. Be the first to say something!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 