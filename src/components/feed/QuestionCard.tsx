'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HelpCircle, MessageSquare, CheckCircle, Tag, Flag, XSquare } from 'lucide-react';

interface QuestionCardProps {
  postId: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ postId }) => {
  const supabase = createClient();
  const [question, setQuestion] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerCount, setAnswerCount] = useState(0);
  const [hasAcceptedAnswer, setHasAcceptedAnswer] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
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
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        
        // Fetch the post data
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*, profiles:user_id(username, avatar_url)')
          .eq('id', postId)
          .eq('type', 'ask')
          .single();
        
        if (postError) {
          throw new Error(postError.message);
        }
        
        if (!postData) {
          throw new Error('Question not found');
        }
        
        setQuestion(postData);
        
        // Get answer count
        const { data: answerCountData, error: answerError } = await supabase
          .from('posts')
          .select('id', { count: 'exact' })
          .eq('parent_id', postId)
          .eq('type', 'comment');
        
        if (!answerError) {
          setAnswerCount(answerCountData?.length || 0);
        }
        
        // Check if there's an accepted answer
        const { data: acceptedAnswer } = await supabase
          .from('question_answers')
          .select('*')
          .eq('question_id', postId)
          .eq('is_accepted', true)
          .maybeSingle();
        
        setHasAcceptedAnswer(!!acceptedAnswer);
      } catch (err: any) {
        console.error('Error fetching question:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestion();
  }, [postId, supabase]);

  const handleReport = async () => {
    if (!currentUserId) {
      setReportError("You must be logged in to report questions");
      return;
    }
    
    try {
      const { error } = await supabase.from('post_reports').insert({
        reported_content_id: postId,
        content_type: 'ask',
        reason: reportReason,
        reporter_user_id: currentUserId,
        community_id: question?.community_id,
      });
      if (error) throw error;
      setShowReportModal(false);
      setReportReason('');
      alert('Question reported successfully. Our team will review it.');
    } catch (error) {
      console.error("Error reporting question:", error);
      setReportError("Failed to submit report. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="p-4 text-red-500">
        Error: {error || 'Question data not available'}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-start">
          <div className="p-2 rounded-full bg-blue-100 text-blue-700 mr-3">
            <HelpCircle size={20} />
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold mb-1">{question.title}</h3>
              {currentUserId && question.user_id !== currentUserId && (
                <button 
                  onClick={() => setShowReportModal(true)} 
                  className="text-gray-500 hover:text-red-500 ml-2"
                  title="Report question"
                >
                  <Flag size={16} />
                </button>
              )}
            </div>
            
            <div className="text-sm text-gray-500 mb-3">
              Asked by {question.profiles?.username || 'Anonymous'} • {
                new Date(question.created_at).toLocaleDateString()
              }
            </div>
            
            <div className="text-gray-700 mb-3">
              {question.content}
            </div>
            
            {question.hashtags && question.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {question.hashtags.map((tag: string) => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded"
                  >
                    <Tag size={12} className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center text-gray-500">
                <MessageSquare size={16} className="mr-1" />
                <span>{answerCount} {answerCount === 1 ? 'answer' : 'answers'}</span>
              </div>
              
              {hasAcceptedAnswer && (
                <div className="flex items-center text-green-600">
                  <CheckCircle size={16} className="mr-1" />
                  <span>Answered</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report Question</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <XSquare size={20}/>
              </button>
            </div>
            <textarea
              className="w-full p-2 border rounded mb-4 bg-white text-black border-gray-300 placeholder-gray-400"
              rows={3}
              placeholder="Please provide a reason for reporting this question..."
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

export default QuestionCard; 