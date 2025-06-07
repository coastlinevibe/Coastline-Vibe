'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { VibeGroupWithDetails, VibeGroupMessage } from '@/types/vibe-groups';

export default function VibeGroupDetailPage() {
  const { communityId, groupId } = useParams() as { communityId: string; groupId: string };
  const [group, setGroup] = useState<VibeGroupWithDetails | null>(null);
  const [messages, setMessages] = useState<VibeGroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchGroupDetails() {
      if (!groupId) return;
      
      setLoading(true);
      
      try {
        // Fetch group details
        const { data: groupData, error: groupError } = await supabase
          .from('vibe_groups')
          .select(`
            *,
            captain:profiles!captain_id(*),
            members:vibe_groups_members(
              *,
              user:profiles(*)
            ),
            pins:vibe_groups_pins(
              *,
              message:vibe_groups_messages(*),
              user:profiles!pinned_by(*)
            ),
            custom_emojis:vibe_groups_emoji(
              *,
              creator:profiles!created_by(*)
            ),
            upgrades:vibe_groups_upgrades(*)
          `)
          .eq('id', groupId)
          .eq('is_active', true)
          .single();
          
        if (groupError) {
          throw groupError;
        }
        
        setGroup(groupData);
        
        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('vibe_groups_messages')
          .select(`
            *,
            sender:profiles!sender_id(*),
            media:vibe_groups_media(*),
            voice_note:vibe_groups_voice_notes(*),
            reactions:vibe_groups_reactions(
              *,
              user:profiles(*)
            )
          `)
          .eq('group_id', groupId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(50);
          
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
  }, [groupId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !groupId) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setError('You must be logged in to send messages');
        return;
      }
      
      const { data: newMessage, error } = await supabase
        .from('vibe_groups_messages')
        .insert({
          group_id: groupId,
          sender_id: userData.user.id,
          message_type: 'text',
          content: messageInput.trim()
        })
        .select(`
          *,
          sender:profiles!sender_id(*)
        `)
        .single();
        
      if (error) {
        throw error;
      }
      
      setMessages(prev => [newMessage, ...prev]);
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
          href={`/community/${communityId}/vibe-groups`}
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
          href={`/community/${communityId}/vibe-groups`}
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
        
        {/* Chat area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-96 overflow-y-auto mb-4 flex flex-col-reverse">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  No messages yet. Be the first to send a message!
                </div>
              ) : (
                messages.map(message => (
                  <div key={message.id} className="mb-4">
                    <div className="flex items-start">
                      {message.sender?.avatar_url ? (
                        <img 
                          src={message.sender.avatar_url} 
                          alt={message.sender.username || 'User'} 
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
                      )}
                      <div>
                        <div className="flex items-center">
                          <span className="font-bold mr-2">
                            {message.sender?.username || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="mt-1">
                          {message.content}
                        </div>
                        
                        {/* Media attachments would go here */}
                        {/* Voice notes would go here */}
                        
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex mt-1">
                            {message.reactions.map(reaction => (
                              <div 
                                key={reaction.id} 
                                className="mr-1 text-sm bg-gray-100 rounded px-1"
                              >
                                {reaction.reaction_id}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleSendMessage} className="flex">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow border rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 