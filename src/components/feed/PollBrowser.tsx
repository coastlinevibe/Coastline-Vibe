'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart2, Loader2, Tag, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PollBrowserProps {
  communityId: string;
}

interface PollSummary {
  poll_id: string;
  question: string;
  created_at: string;
  is_closed: boolean;
  expires_at: string | null;
  tags: string[] | null;
  vote_count: number;
  post_id?: string;
}

interface TagData {
  tags: string[] | null;
}

const PollBrowser: React.FC<PollBrowserProps> = ({ communityId }) => {
  const supabase = createClient();
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_all_poll_tags', { community_id_param: communityId });
        
        if (error) throw error;
        
        if (data) {
          // Flatten the array of tag arrays and remove duplicates
          const allTags = Array.from(
            new Set(
              data.flatMap((item: TagData) => item.tags || [])
            )
          ).filter((tag): tag is string => typeof tag === 'string');
          
          setAvailableTags(allTags);
        }
      } catch (err: any) {
        console.error('Error fetching tags:', err);
      }
    };

    fetchTags();
  }, [communityId, supabase]);

  // Fetch polls based on selected tag or search query
  useEffect(() => {
    const fetchPolls = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('polls')
          .select(`
            id:poll_id,
            question,
            created_at,
            is_closed,
            expires_at,
            tags,
            post_id,
            poll_options(poll_votes(count))
          `)
          .eq('community_id', communityId)
          .order('created_at', { ascending: false })
          .limit(20);

        // Apply tag filter if selected
        if (selectedTag) {
          query = query.contains('tags', [selectedTag]);
        }

        // Apply search filter if provided
        if (searchQuery) {
          query = query.ilike('question', `%${searchQuery}%`);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (data) {
          // Process data to count votes
          const processedPolls = data.map(poll => {
            const voteCount = poll.poll_options.reduce((sum: number, option: any) => {
              return sum + (option.poll_votes?.length || 0);
            }, 0);

            return {
              poll_id: poll.id,
              question: poll.question,
              created_at: poll.created_at,
              is_closed: poll.is_closed,
              expires_at: poll.expires_at,
              tags: poll.tags,
              vote_count: voteCount,
              post_id: poll.post_id
            };
          });

          setPolls(processedPolls);
        }
      } catch (err: any) {
        console.error('Error fetching polls:', err);
        setError(err.message || 'Failed to load polls');
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, [communityId, selectedTag, searchQuery, supabase]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <BarChart2 size={20} className="mr-2 text-blue-500" />
        Poll Browser
      </h3>

      {/* Search and filter */}
      <div className="mb-4">
        <div className="flex mb-3">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search polls..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Tags filter */}
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="flex items-center text-sm text-gray-600">
            <Tag size={14} className="mr-1" /> Filter by tag:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2 py-1 text-xs rounded-md ${
              selectedTag === null 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2 py-1 text-xs rounded-md ${
                selectedTag === tag 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Poll list */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin text-blue-500 mr-2" size={24} />
            <span>Loading polls...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 py-4 text-center">{error}</div>
        ) : polls.length === 0 ? (
          <div className="text-gray-500 py-4 text-center">
            {searchQuery || selectedTag 
              ? 'No polls found matching your criteria' 
              : 'No polls available'}
          </div>
        ) : (
          <div className="divide-y">
            {polls.map(poll => (
              <div key={poll.poll_id} className="py-3">
                <Link 
                  href={`/community/${communityId}/feed?postId=${poll.post_id}`}
                  className="block hover:bg-gray-50 rounded-md p-2 -mx-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{poll.question}</h4>
                      <div className="text-sm text-gray-500 mt-1">
                        {poll.vote_count} {poll.vote_count === 1 ? 'vote' : 'votes'} • {formatDate(poll.created_at)}
                      </div>
                      {poll.tags && poll.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {poll.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      {poll.is_closed && (
                        <span className="text-xs text-orange-500 mr-2">Closed</span>
                      )}
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PollBrowser; 