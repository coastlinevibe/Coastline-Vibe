'use client';

import { useState, useMemo } from 'react';
import { CheckCircle, TrendingUp } from 'lucide-react';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollCardProps {
  question: string;
  options: PollOption[];
  userVote: string | null; // option ID of the current user's vote
  onVote: (optionId: string) => void;
  postId: string; // To ensure unique radio group names if multiple polls are on a page
  totalVotesOverall?: number; // Optional: if the view already calculates total distinct voters for the poll
}

const PollCard: React.FC<PollCardProps> = ({ question, options, userVote, onVote, postId, totalVotesOverall }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(userVote);

  const totalVotesInOptions = useMemo(() => {
    return options.reduce((sum, option) => sum + option.votes, 0);
  }, [options]);
  
  // Use totalVotesOverall if provided and valid, otherwise use sum of option votes
  const displayTotalVotes = totalVotesOverall !== undefined && totalVotesOverall >= totalVotesInOptions 
                            ? totalVotesOverall 
                            : totalVotesInOptions;

  const handleVote = () => {
    if (selectedOption && !userVote) {
      onVote(selectedOption);
    }
  };

  const userVotedOptionText = useMemo(() => {
    if (userVote) {
      return options.find(opt => opt.id === userVote)?.text || null;
    }
    return null;
  }, [userVote, options]);

  // Colors for poll bars - can be expanded or customized
  const pollBarColors = [
    'bg-sky-500',
    'bg-purple-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
  ];

  return (
    <div className="bg-white shadow-sm rounded-xl p-5 sm:p-6 border border-gray-200">
      <div className="space-y-3 mb-5">
        {options.map((option, index) => {
          const percentage = displayTotalVotes > 0 ? (option.votes / displayTotalVotes) * 100 : 0;
          const isUserChoice = userVote === option.id;
          const isSelectedForVoting = selectedOption === option.id;

          if (userVote) {
            // Voted state: Show results
            return (
              <div key={option.id} className="group">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className={`font-medium ${isUserChoice ? 'text-sky-700' : 'text-gray-700'}`}>
                    {option.text}
                    {isUserChoice && <span className="text-sky-600 ml-1">(Your vote)</span>}
                  </span>
                  <span className={`${isUserChoice ? 'text-sky-600 font-semibold' : 'text-gray-500'}`}>
                    {option.votes} vote{option.votes !== 1 ? 's' : ''} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${pollBarColors[index % pollBarColors.length]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          } else {
            // Not voted state: Show options
            return (
              <label
                key={option.id}
                htmlFor={`poll-${postId}-option-${option.id}`}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors duration-150
                            ${isSelectedForVoting 
                              ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300' 
                              : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'}
                          `}
              >
                <input
                  type="radio"
                  id={`poll-${postId}-option-${option.id}`}
                  name={`poll-${postId}-options`}
                  value={option.id}
                  checked={isSelectedForVoting}
                  onChange={() => setSelectedOption(option.id)}
                  className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500 mr-3"
                />
                <span className="text-sm font-medium text-gray-700">{option.text}</span>
              </label>
            );
          }
        })}
      </div>

      {!userVote && (
        <button
          onClick={handleVote}
          disabled={!selectedOption}
          className="w-full px-4 py-2.5 bg-sky-600 text-white font-semibold rounded-lg shadow-md
                     hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
        >
          Vote
        </button>
      )}

      {userVote && (
        <div className="mt-5 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            {userVotedOptionText && (
               <p className="flex items-center">
                <CheckCircle size={14} className="text-green-600 mr-1.5" />
                You voted for: <span className="font-semibold text-gray-700 ml-1">{userVotedOptionText}</span>
              </p>
            )}
            <p className="flex items-center">
              <TrendingUp size={14} className="text-gray-400 mr-1.5" />
              Total Votes: <span className="font-semibold text-gray-700 ml-1">{displayTotalVotes}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollCard; 