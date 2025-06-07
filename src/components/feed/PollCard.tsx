'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, Loader2, BarChart, Clock, Lock, AlertCircle, Tag, Flag, XSquare } from 'lucide-react';
import PollAnalytics from './PollAnalytics';
import PollExport from './PollExport';
import PollShare from './PollShare';

interface PollOption {
  id: string;
  option_text: string;
  vote_count?: number;
}

interface Poll {
  id: string;
  question: string;
  is_closed: boolean;
  show_voter_names: boolean;
  created_at: string;
  expires_at?: string | null;
  created_by_user_id: string;
  community_id: string;
  options: PollOption[];
  total_votes: number;
  user_vote?: string;
  tags?: string[] | null;
}

interface PollCardProps {
  pollId: string;
  postId: string;
}

const PollCard: React.FC<PollCardProps> = ({ pollId, postId }) => {
  const supabase = createClient();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);

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
      setLoading(true);
      setError(null);

      try {
        // Fetch poll data
        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .select('*')
          .eq('id', pollId)
          .single();

        if (pollError) {
          throw new Error(`Error fetching poll: ${pollError.message}`);
        }

        // Fetch poll options
        const { data: optionsData, error: optionsError } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', pollId);

        if (optionsError) {
          throw new Error(`Error fetching poll options: ${optionsError.message}`);
        }

        // Fetch vote counts for each option
        const { data: voteCountsData, error: voteCountsError } = await supabase
          .rpc('get_poll_results', { poll_id_param: pollId });

        if (voteCountsError) {
          console.error('Error fetching vote counts:', voteCountsError);
          // Continue without vote counts
        }

        // If user is logged in, check if they've voted
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

        // Process options with vote counts
        const optionsWithCounts = optionsData.map(option => {
          const voteData = voteCountsData?.find((v: any) => v.option_id === option.id);
          return {
            ...option,
            vote_count: voteData ? parseInt(voteData.vote_count) : 0
          };
        });

        // Calculate total votes
        const totalVotes = optionsWithCounts.reduce((sum, option) => sum + (option.vote_count || 0), 0);

        setPoll({
          ...pollData,
          options: optionsWithCounts,
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
              vote_count: (option.vote_count || 0) + 1
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

  const handleClosePoll = async () => {
    if (!currentUserId || !poll) return;
    
    // Only allow poll creator to close the poll
    if (poll.created_by_user_id !== currentUserId) {
      setError('Only the poll creator can close this poll');
      return;
    }

    setIsClosing(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('polls')
        .update({ is_closed: true })
        .eq('id', pollId);

      if (updateError) {
        throw new Error(`Error closing poll: ${updateError.message}`);
      }

      // Update local state
      setPoll(prev => prev ? { ...prev, is_closed: true } : null);
    } catch (err: any) {
      console.error('Error closing poll:', err);
      setError(err.message || 'Failed to close poll');
    } finally {
      setIsClosing(false);
    }
  };

  const handleReport = async () => {
    if (!currentUserId) {
      setReportError("You must be logged in to report polls");
      return;
    }
    
    try {
      const { error } = await supabase.from('post_reports').insert({
        reported_content_id: pollId,
        content_type: 'poll',
        reason: reportReason,
        reporter_user_id: currentUserId,
        community_id: poll?.community_id,
      });
      if (error) throw error;
      setShowReportModal(false);
      setReportReason('');
      alert('Poll reported successfully. Our team will review it.');
    } catch (error) {
      console.error("Error reporting poll:", error);
      setReportError("Failed to submit report. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow flex justify-center items-center h-32">
        <Loader2 className="animate-spin text-blue-500" size={24} />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-red-500">
          {error || 'Failed to load poll'}
        </div>
      </div>
    );
  }

  const calculatePercentage = (voteCount: number) => {
    if (poll.total_votes === 0) return 0;
    return Math.round((voteCount / poll.total_votes) * 100);
  };

  // Format expiration date for display
  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Check if poll is expired
  const isExpired = poll.expires_at ? new Date(poll.expires_at) <= new Date() : false;

  // Check if user is the poll creator
  const isCreator = currentUserId === poll.created_by_user_id;

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <BarChart size={20} className="mr-2 text-blue-500" />
            <h3 className="font-semibold text-lg">{poll.question}</h3>
          </div>
          {currentUserId && poll.created_by_user_id !== currentUserId && (
            <button 
              onClick={() => setShowReportModal(true)} 
              className="text-gray-500 hover:text-red-500"
              title="Report poll"
            >
              <Flag size={16} />
            </button>
          )}
        </div>

        {/* Display tags if available */}
        {poll.tags && poll.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            <Tag size={14} className="text-gray-500" />
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

        <div className="space-y-3 mb-4">
          {poll.options.map((option) => {
            const percentage = calculatePercentage(option.vote_count || 0);
            const isSelected = poll.user_vote === option.id;
            const hasVoted = !!poll.user_vote;

            return (
              <div key={option.id} className="relative">
                {/* Option button or result bar */}
                {!hasVoted ? (
                  <button
                    onClick={() => handleVote(option.id)}
                    disabled={voting || poll.is_closed}
                    className={`w-full text-left p-3 border rounded-md hover:bg-gray-50 
                      ${voting ? 'opacity-50 cursor-not-allowed' : ''}
                      ${poll.is_closed ? 'cursor-not-allowed' : ''}`}
                  >
                    {option.option_text}
                  </button>
                ) : (
                  <div className="relative border rounded-md overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <div className="relative p-3 flex justify-between items-center">
                      <div className="flex items-center">
                        {isSelected && (
                          <>
                            <CheckCircle size={16} className="mr-2 text-blue-500" />
                            <span className="text-blue-500 text-sm font-medium mr-2">You Voted</span>
                          </>
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
          <div className="text-red-500 text-sm mb-3">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-500">
          <div className="flex justify-between items-center mb-1">
            <span>{poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}</span>
            {poll.is_closed && <span className="text-orange-500 flex items-center"><Lock size={14} className="mr-1" /> Poll closed</span>}
          </div>
          
          {poll.expires_at && (
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Clock size={14} className="mr-1" />
              <span>
                {isExpired 
                  ? 'Poll expired on ' 
                  : 'Poll closes on '} 
                {formatExpirationDate(poll.expires_at)}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-2 mb-2">
            {/* Share button */}
            <PollShare 
              pollId={pollId} 
              postId={postId} 
              communityId={poll.community_id} 
              question={poll.question} 
            />

            {/* Show close button only to poll creator and if poll is not already closed */}
            {isCreator && !poll.is_closed && (
              <button
                onClick={handleClosePoll}
                disabled={isClosing}
                className="flex items-center text-sm text-orange-600 hover:text-orange-800"
              >
                {isClosing ? (
                  <>
                    <Loader2 size={14} className="mr-1 animate-spin" />
                    Closing...
                  </>
                ) : (
                  <>
                    <Lock size={14} className="mr-1" />
                    Close Poll
                  </>
                )}
              </button>
            )}
          </div>
          
          <PollAnalytics pollId={pollId} isCreator={isCreator} />
          
          {/* Only show export option to poll creator */}
          {isCreator && (
            <PollExport pollId={pollId} pollQuestion={poll.question} />
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report Poll</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <XSquare size={20}/>
              </button>
            </div>
            <textarea
              className="w-full p-2 border rounded mb-4 bg-white text-black border-gray-300 placeholder-gray-400"
              rows={3}
              placeholder="Please provide a reason for reporting this poll..."
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

export default PollCard; 