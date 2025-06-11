'use client';

import { useEffect, useState } from 'react';
import { FeedPostReaction, FeedReactionsClient, ReactionType } from '@/lib/supabase/feed-reactions-client';

interface FeedPostReactionDisplayProps {
  postId: string;
  className?: string;
}

interface GroupedReaction {
  type: ReactionType;
  id: string;
  count: number;
  users: string[];
}

export default function FeedPostReactionDisplay({ postId, className = '' }: FeedPostReactionDisplayProps) {
  const [reactions, setReactions] = useState<FeedPostReaction[]>([]);
  const [groupedReactions, setGroupedReactions] = useState<GroupedReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const reactionsClient = new FeedReactionsClient();

  useEffect(() => {
    async function loadReactions() {
      setLoading(true);
      try {
        const { data, error } = await reactionsClient.getReactions(postId);
        if (error) throw error;
        
        setReactions(data || []);
      } catch (err) {
        console.error('Error loading reactions:', err);
        setError('Failed to load reactions');
      } finally {
        setLoading(false);
      }
    }
    
    loadReactions();
  }, [postId]);

  useEffect(() => {
    // Group reactions by type and id
    const grouped: Record<string, GroupedReaction> = {};
    
    reactions.forEach(reaction => {
      const key = `${reaction.reaction_type}:${reaction.reaction_id}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          type: reaction.reaction_type,
          id: reaction.reaction_id,
          count: 0,
          users: []
        };
      }
      
      grouped[key].count++;
      if (reaction.user?.username) {
        grouped[key].users.push(reaction.user.username);
      }
    });
    
    setGroupedReactions(Object.values(grouped));
  }, [reactions]);

  if (loading) return <div className="text-sm text-gray-400">Loading reactions...</div>;
  if (error) return <div className="text-sm text-red-500">{error}</div>;
  if (groupedReactions.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 mt-2 ${className}`}>
      {groupedReactions.map(reaction => (
        <div 
          key={`${reaction.type}:${reaction.id}`}
          className="bg-gray-100 rounded-full px-2 py-0.5 text-sm flex items-center"
          title={reaction.users.join(', ')}
        >
          <span className="mr-1">{reaction.id}</span>
          <span className="text-xs text-gray-500">{reaction.count}</span>
        </div>
      ))}
    </div>
  );
} 