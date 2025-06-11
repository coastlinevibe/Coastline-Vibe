'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HelpCircle, MessageSquare, CheckCircle, Tag } from 'lucide-react';

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
          .single();
        
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
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-start">
        <div className="p-2 rounded-full bg-blue-100 text-blue-700 mr-3">
          <HelpCircle size={20} />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{question.title}</h3>
          
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
  );
};

export default QuestionCard; 