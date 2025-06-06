'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, BarChart } from 'lucide-react';

interface PollEmbedProps {
  pollId: string;
  compact?: boolean;
}

interface PollOption {
  id: string;
  option_text: string;
  vote_count: number;
}

interface PollData {
  id: string;
  question: string;
  is_closed: boolean;
  options: PollOption[];
  total_votes: number;
  user_vote?: string | null;
}

const PollEmbed: React.FC<PollEmbedProps> = ({ pollId, compact = false }) => {
  const supabase = createClient();
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    const fetchPoll = async () => {
      if (!pollId) return;
      
      setLoading(true);
      setError(null);

      try {
        // Fetch poll data
        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .select('id, question, is_closed')
          .eq('id', pollId)
          .single();

        if (pollError) {
          throw new Error(`Error fetching poll: ${pollError.message}`);
        }

        // Fetch poll options with vote counts
        const { data: optionsWithVotes, error: optionsError } = await supabase
          .rpc('get_poll_results', { poll_id_param: pollId });

        if (optionsError) {
          throw new Error(`Error fetching poll options: ${optionsError.message}`);
        }

        // Check if user has voted
        let userVote = null;
        if (currentUserId) {
          const { data: userVoteData, error: userVoteError } = await supabase
            .from('poll_votes')
            .select('poll_option_id')
            .eq('poll_id', pollId)
            .eq('user_id', currentUserId)
            .maybeSingle();

          if (!userVoteError && userVoteData) {
            userVote = userVoteData.poll_option_id;
          }
        }

        // Calculate total votes
        const totalVotes = optionsWithVotes.reduce(
          (sum: number, option: any) => sum + parseInt(option.vote_count || 0), 
          0
        );

        // Format options
        const formattedOptions = optionsWithVotes.map((option: any) => ({
          id: option.option_id,
          option_text: option.option_text,
          vote_count: parseInt(option.vote_count || 0)
        }));

        setPoll({
          id: pollData.id,
          question: pollData.question,
          is_closed: pollData.is_closed,
          options: formattedOptions,
          total_votes: totalVotes,
          user_vote: userVote
        });
      } catch (err: any) {
        console.error('Error fetching poll data:', err);
        setError(err.message || 'Failed to load poll');
      } finally {
        setLoading(false);
      }
    };

    if (pollId && currentUserId !== undefined) {
      fetchPoll();
    }
  }, [pollId, currentUserId, supabase]);

  const handleVote = async (optionId: string) => {
    if (!currentUserId) {
      setError('You must be logged in to vote');
      return;
    }

    if (poll?.is_closed) {
      setError('This poll is closed');
      return;
    }

    if (poll?.user_vote) {
      setError('You have already voted in this poll');
      return;
    }

    setVoting(true);
    setError(null);

    try {
      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: pollId,
          poll_option_id: optionId,
          user_id: currentUserId
        });

      if (voteError) {
        throw new Error(`Error submitting vote: ${voteError.message}`);
      }

      // Update local state to reflect the vote
      if (poll) {
        const updatedOptions = poll.options.map(option => {
          if (option.id === optionId) {
            return {
              ...option,
              vote_count: option.vote_count + 1
            };
          }
          return option;
        });

        setPoll({
          ...poll,
          options: updatedOptions,
          total_votes: poll.total_votes + 1,
          user_vote: optionId
        });
      }
    } catch (err: any) {
      console.error('Error voting:', err);
      setError(err.message || 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white ${compact ? 'p-3' : 'p-4'} rounded-lg shadow flex justify-center items-center h-24`}>
        <Loader2 className="animate-spin text-blue-500" size={20} />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className={`bg-white ${compact ? 'p-3' : 'p-4'} rounded-lg shadow`}>
        <div className="text-red-500 text-sm">
          {error || 'Failed to load poll'}
        </div>
      </div>
    );
  }

  const calculatePercentage = (voteCount: number) => {
    if (poll.total_votes === 0) return 0;
    return Math.round((voteCount / poll.total_votes) * 100);
  };

  return (
    <div className={`bg-white ${compact ? 'p-3' : 'p-4'} rounded-lg shadow`}>
      <div className="flex items-center mb-2">
        <BarChart size={compact ? 16 : 20} className="mr-2 text-blue-500" />
        <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'}`}>{poll.question}</h3>
      </div>

      <div className={`space-y-${compact ? '2' : '3'} mb-3`}>
        {poll.options.map((option) => {
          const percentage = calculatePercentage(option.vote_count);
          const isSelected = poll.user_vote === option.id;
          const hasVoted = !!poll.user_vote;

          return (
            <div key={option.id} className="relative">
              {!hasVoted ? (
                <button
                  onClick={() => handleVote(option.id)}
                  disabled={voting || poll.is_closed}
                  className={`w-full text-left p-${compact ? '2' : '3'} border rounded-md hover:bg-gray-50 
                    ${voting ? 'opacity-50 cursor-not-allowed' : ''}
                    ${poll.is_closed ? 'cursor-not-allowed' : ''}
                    ${compact ? 'text-sm' : ''}`}
                >
                  {option.option_text}
                </button>
              ) : (
                <div className="relative border rounded-md overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                  <div className={`relative p-${compact ? '2' : '3'} flex justify-between items-center ${compact ? 'text-sm' : ''}`}>
                    <div className="flex items-center">
                      {isSelected && (
                        <span className="mr-1 text-blue-500">✓</span>
                      )}
                      <span>{option.option_text}</span>
                    </div>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="text-red-500 text-xs mb-2">
          {error}
        </div>
      )}

      <div className={`text-${compact ? 'xs' : 'sm'} text-gray-500 flex justify-between items-center`}>
        <span>{poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}</span>
        {poll.is_closed && <span className="text-orange-500">Poll closed</span>}
      </div>
    </div>
  );
};

export default PollEmbed; 