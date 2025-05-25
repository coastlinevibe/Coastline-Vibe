'use client';

import React, { useState, useEffect } from 'react';
import type { Database } from '@/types/supabase'; // Assuming your Supabase types are here
import type { User } from '@supabase/supabase-js';

// Define the shape of the poll data passed to this component
export interface PollOption {
  index: number; // 1, 2, 3, or 4
  text: string;
  voteCount: number;
}

export interface PollDisplayData {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number; // Total votes for the entire poll
  // created_by_username?: string; // Optional: if you want to display who created it
  // created_at: string;
}

// Define the shape of the user's vote data
export interface UserVoteData {
  selectedOptionIndex: number; // 1, 2, 3, or 4
}

interface CommunityPollDisplayProps {
  poll: PollDisplayData;
  currentUser: User | null;
  userVote: UserVoteData | null; // The current user's vote, if any
  onVote: (pollId: string, selectedOptionIndex: number) => Promise<void>; // Function to call when user votes
  // communityId: string; // May not be needed directly if poll is self-contained
}

const CommunityPollDisplay: React.FC<CommunityPollDisplayProps> = ({
  poll,
  currentUser,
  userVote,
  onVote,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(userVote?.selectedOptionIndex || null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  useEffect(() => {
    setSelectedOption(userVote?.selectedOptionIndex || null);
  }, [userVote]);

  const handleVote = async (optionIndex: number) => {
    if (!currentUser) {
      // Optionally, prompt user to log in
      console.warn("User must be logged in to vote.");
      return;
    }
    if (userVote || selectedOption !== null) {
      console.warn("User has already voted or an option is already selected locally.");
      return; // Already voted or selection made, do nothing (UI should ideally prevent this)
    }

    setIsSubmittingVote(true);
    try {
      await onVote(poll.id, optionIndex);
      setSelectedOption(optionIndex); // Optimistically update UI
    } catch (error) {
      console.error("Error submitting vote:", error);
      // Handle error display to user if needed
    } finally {
      setIsSubmittingVote(false);
    }
  };

  if (!poll) {
    return null; // Or some placeholder if poll data isn't ready
  }

  const hasVoted = selectedOption !== null;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 border border-blue-200">
      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3">{poll.question}</h3>
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = poll.totalVotes > 0 && hasVoted ? (option.voteCount / poll.totalVotes) * 100 : 0;
          const isSelectedByCurrentUser = selectedOption === option.index;

          return (
            <button
              key={option.index}
              onClick={() => !hasVoted && handleVote(option.index)}
              disabled={hasVoted || isSubmittingVote}
              className={`w-full text-left p-3 border rounded-md transition-all duration-150
                          ${hasVoted 
                            ? 'cursor-default' 
                            : 'hover:border-blue-500 hover:bg-blue-50 cursor-pointer'}
                          ${isSelectedByCurrentUser ? 'border-blue-600 ring-2 ring-blue-500' : 'border-slate-300'}
                          ${isSubmittingVote && !hasVoted ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm sm:text-base text-slate-700 font-medium">{option.text}</span>
                {hasVoted && (
                  <span className="text-xs sm:text-sm text-slate-500">
                    {option.voteCount} vote{option.voteCount === 1 ? '' : 's'} ({percentage.toFixed(1)}%)
                  </span>
                )}
              </div>
              {hasVoted && (
                <div className="w-full bg-slate-200 rounded-full h-2.5 sm:h-3">
                  <div
                    className="bg-blue-500 h-2.5 sm:h-3 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {hasVoted && poll.totalVotes > 0 && (
        <p className="text-xs text-slate-500 mt-3 text-right">
          Total Votes: {poll.totalVotes}
        </p>
      )}
       {!hasVoted && currentUser && (
         <p className="text-xs text-slate-400 mt-3">Click an option to cast your vote.</p>
       )}
       {!currentUser && (
          <p className="text-xs text-amber-600 mt-3">Please log in to vote.</p>
       )}
    </div>
  );
};

export default CommunityPollDisplay; 