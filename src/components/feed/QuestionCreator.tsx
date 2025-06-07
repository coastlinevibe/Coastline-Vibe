'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HelpCircle, Loader2, Tag, X, Wand2, Lightbulb } from 'lucide-react';
import PoliteRewriter from './PoliteRewriter';
import ContentSuggestions from './ContentSuggestions';
import KindnessReminder from './KindnessReminder';

interface QuestionCreatorProps {
  communityId: string;
  onQuestionCreated: () => void;
}

// Common question categories/tags for suggestions
const SUGGESTED_TAGS = [
  'Help', 'Advice', 'Recommendation', 'Opinion', 'Technical', 
  'Local', 'Services', 'Events', 'Property', 'General'
];

const QuestionCreator: React.FC<QuestionCreatorProps> = ({ communityId, onQuestionCreated }) => {
  const supabase = createClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add state to track if AI features are actively processing
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!title.trim()) {
      setError('Question title is required');
      return;
    }

    if (!content.trim()) {
      setError('Question details are required');
      return;
    }

    setIsCreating(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to ask a question');
        setIsCreating(false);
        return;
      }

      // Create the post
      const postData = {
        title: title,
        content: content,
        user_id: user.id,
        community_id: communityId,
        type: 'ask',
        is_visible: true,
        hashtags: tags.length > 0 ? tags : null
      };

      const { error: postError } = await supabase
        .from('posts')
        .insert(postData);

      if (postError) {
        throw new Error(`Error creating question: ${postError.message}`);
      }

      // Reset form
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
      onQuestionCreated();
    } catch (err: any) {
      console.error('Error creating question:', err);
      setError(err.message || 'An error occurred while creating the question');
    } finally {
      setIsCreating(false);
    }
  };

  // Filter suggested tags that match the input and aren't already selected
  const filteredSuggestions = SUGGESTED_TAGS.filter(
    tag => tag.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(tag)
  );
  
  // Handle polite rewriting for title
  const handleRewriteTitle = (rewrittenText: string) => {
    setTitle(rewrittenText);
  };
  
  // Handle polite rewriting for content
  const handleRewriteContent = (rewrittenText: string) => {
    setContent(rewrittenText);
  };
  
  // Handle content suggestions
  const handleSelectSuggestion = (suggestion: string) => {
    setContent(suggestion);
  };
  
  // Handle kindness reminders
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <HelpCircle size={20} className="mr-2 text-blue-500" />
        Ask a Question
      </h3>
      
      <form onSubmit={handleSubmit}>
        {/* Kindness reminder will appear if needed */}
        <KindnessReminder 
          content={content} 
          onContentChange={handleContentChange} 
          disabled={isCreating || isAiProcessing}
        />
        
        <div className="mb-4">
          <label htmlFor="questionTitle" className="block text-sm font-medium mb-1">
            Question
          </label>
          <div className="relative">
            <input
              id="questionTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question?"
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isCreating || isAiProcessing}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <PoliteRewriter
                originalText={title}
                onRewritten={handleRewriteTitle}
                disabled={isCreating || isAiProcessing}
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="questionContent" className="block text-sm font-medium mb-1">
            Details
          </label>
          <div className="relative">
            <textarea
              id="questionContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide more details about your question..."
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isCreating || isAiProcessing}
            />
            <div className="absolute right-2 bottom-2">
              <PoliteRewriter
                originalText={content}
                onRewritten={handleRewriteContent}
                disabled={isCreating || isAiProcessing}
              />
            </div>
          </div>
          
          {/* Content suggestions */}
          <div className="mt-1">
            <ContentSuggestions
              inputText={content}
              onSelectSuggestion={handleSelectSuggestion}
              disabled={isCreating || isAiProcessing}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Tags
          </label>
          <div className="relative">
            <div className="flex items-center">
              <Tag size={18} className="mr-2 text-gray-500" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowTagSuggestions(true);
                }}
                onKeyDown={handleTagInputKeyDown}
                onFocus={() => setShowTagSuggestions(true)}
                placeholder="Add tags (press Enter)"
                className="flex-1 p-2 border border-gray-300 rounded-md"
                disabled={isCreating || isAiProcessing}
              />
              {tagInput && (
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  disabled={isCreating || isAiProcessing}
                >
                  Add
                </button>
              )}
            </div>

            {/* Tag suggestions */}
            {showTagSuggestions && tagInput && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                {filteredSuggestions.map((tag) => (
                  <div
                    key={tag}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                    onClick={() => handleAddTag(tag)}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Display selected tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    disabled={isCreating || isAiProcessing}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-4">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
          disabled={isCreating || isAiProcessing}
        >
          {isCreating ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            'Post Question'
          )}
        </button>
      </form>
    </div>
  );
};

export default QuestionCreator; 