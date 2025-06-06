'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface PollAnalyticsProps {
  pollId: string;
  isCreator: boolean;
}

interface PollAnalyticsData {
  totalVotes: number;
  optionData: {
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }[];
  votesByDay?: {
    date: string;
    count: number;
  }[];
}

const PollAnalytics: React.FC<PollAnalyticsProps> = ({ pollId, isCreator }) => {
  const supabase = createClient();
  const [analyticsData, setAnalyticsData] = useState<PollAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchAnalytics = async () => {
    if (!isCreator) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch poll options with votes
      const { data: optionsData, error: optionsError } = await supabase
        .from('poll_options')
        .select(`
          id,
          option_text,
          poll_votes (
            created_at
          )
        `)
        .eq('poll_id', pollId);

      if (optionsError) {
        throw new Error(`Error fetching poll options: ${optionsError.message}`);
      }

      // Process data for analytics
      let totalVotes = 0;
      const optionData = optionsData.map(option => {
        const votes = option.poll_votes?.length || 0;
        totalVotes += votes;
        
        return {
          id: option.id,
          text: option.option_text,
          votes,
          percentage: 0, // Will calculate after we have total
        };
      });

      // Calculate percentages
      if (totalVotes > 0) {
        optionData.forEach(option => {
          option.percentage = Math.round((option.votes / totalVotes) * 100);
        });
      }

      // Sort options by votes (descending)
      optionData.sort((a, b) => b.votes - a.votes);

      // Process votes by day
      const allVotes = optionsData.flatMap(option => 
        option.poll_votes?.map(vote => ({
          date: new Date(vote.created_at).toISOString().split('T')[0],
        })) || []
      );

      // Count votes by day
      const votesByDayMap = allVotes.reduce((acc, { date }) => {
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Convert to array and sort by date
      const votesByDay = Object.entries(votesByDayMap).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));

      setAnalyticsData({
        totalVotes,
        optionData,
        votesByDay
      });
    } catch (err: any) {
      console.error('Error fetching poll analytics:', err);
      setError(err.message || 'Failed to load poll analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showAnalytics && !analyticsData && !loading) {
      fetchAnalytics();
    }
  }, [showAnalytics, analyticsData, loading, pollId, isCreator]);

  if (!isCreator) {
    return null;
  }

  return (
    <div className="mt-3 border-t pt-3">
      <button 
        onClick={() => setShowAnalytics(!showAnalytics)}
        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        <BarChart2 size={16} className="mr-1" />
        <span>Poll Analytics</span>
        {showAnalytics ? (
          <ChevronUp size={16} className="ml-1" />
        ) : (
          <ChevronDown size={16} className="ml-1" />
        )}
      </button>

      {showAnalytics && (
        <div className="mt-2">
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="animate-spin text-blue-500 mr-2" size={20} />
              <span>Loading analytics...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : analyticsData ? (
            <div>
              <h4 className="font-medium mb-2">Vote Distribution</h4>
              <div className="space-y-2 mb-4">
                {analyticsData.optionData.map(option => (
                  <div key={option.id} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>{option.text}</span>
                      <span>{option.votes} votes ({option.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${option.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {analyticsData.votesByDay && analyticsData.votesByDay.length > 0 && (
                <>
                  <h4 className="font-medium mb-2">Votes Over Time</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left py-1">Date</th>
                          <th className="text-right py-1">Votes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.votesByDay.map(day => (
                          <tr key={day.date}>
                            <td className="py-1">{day.date}</td>
                            <td className="text-right py-1">{day.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No data available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PollAnalytics; 