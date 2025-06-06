'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Download, Loader2, FileSpreadsheet, FileText } from 'lucide-react';

interface PollExportProps {
  pollId: string;
  pollQuestion: string;
}

const PollExport: React.FC<PollExportProps> = ({ pollId, pollQuestion }) => {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPollData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch poll options with vote counts
      const { data: optionsWithVotes, error: optionsError } = await supabase
        .rpc('get_poll_results', { poll_id_param: pollId });

      if (optionsError) {
        throw new Error(`Error fetching poll options: ${optionsError.message}`);
      }

      return optionsWithVotes;
    } catch (err: any) {
      console.error('Error fetching poll data for export:', err);
      setError(err.message || 'Failed to fetch poll data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const exportAsCSV = async () => {
    const data = await fetchPollData();
    if (!data) return;

    try {
      // Format data for CSV
      const headers = ['Option', 'Votes', 'Percentage'];
      const totalVotes = data.reduce((sum: number, option: any) => sum + parseInt(option.vote_count || 0), 0);
      
      const rows = data.map((option: any) => {
        const votes = parseInt(option.vote_count || 0);
        const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
        return [
          option.option_text,
          votes,
          `${percentage}%`
        ];
      });

      // Add total row
      rows.push(['Total', totalVotes, '100.0%']);

      // Convert to CSV format
      const csvContent = [
        `Poll: ${pollQuestion}`,
        '',
        headers.join(','),
        ...rows.map((row: (string | number)[]) => row.join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `poll-results-${pollId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Error exporting CSV:', err);
      setError(err.message || 'Failed to export as CSV');
    }
  };

  const exportAsText = async () => {
    const data = await fetchPollData();
    if (!data) return;

    try {
      // Format data for text
      const totalVotes = data.reduce((sum: number, option: any) => sum + parseInt(option.vote_count || 0), 0);
      
      let textContent = `Poll: ${pollQuestion}\n\nResults:\n`;
      
      data.forEach((option: any) => {
        const votes = parseInt(option.vote_count || 0);
        const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
        textContent += `- ${option.option_text}: ${votes} votes (${percentage}%)\n`;
      });

      textContent += `\nTotal votes: ${totalVotes}`;

      // Create and download file
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `poll-results-${pollId}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Error exporting text:', err);
      setError(err.message || 'Failed to export as text');
    }
  };

  return (
    <div className="mt-3 pt-3 border-t">
      <h4 className="text-sm font-medium mb-2 flex items-center">
        <Download size={16} className="mr-1 text-gray-600" />
        Export Results
      </h4>

      <div className="flex gap-2">
        <button
          onClick={exportAsCSV}
          disabled={loading}
          className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
        >
          {loading ? (
            <Loader2 size={14} className="mr-1 animate-spin" />
          ) : (
            <FileSpreadsheet size={14} className="mr-1" />
          )}
          CSV
        </button>

        <button
          onClick={exportAsText}
          disabled={loading}
          className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
        >
          {loading ? (
            <Loader2 size={14} className="mr-1 animate-spin" />
          ) : (
            <FileText size={14} className="mr-1" />
          )}
          Text
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-xs mt-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default PollExport; 