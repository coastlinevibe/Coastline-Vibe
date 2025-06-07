'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Loader2, Calendar, Tag, X } from 'lucide-react';
import PoliteRewriter from './PoliteRewriter';
import ContentSuggestions from './ContentSuggestions';
import KindnessReminder from './KindnessReminder';

interface PollCreatorProps {
  communityId: string;
  onPollCreated: () => void;
}

// Common poll categories/tags for suggestions
const SUGGESTED_TAGS = [
  'Community', 'Events', 'Decision', 'Feedback', 'Fun', 
  'Planning', 'Opinion', 'Preference', 'Important'
];

const PollCreator: React.FC<PollCreatorProps> = ({ communityId, onPollCreated }) => {
  const supabase = createClient();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']); // Start with two empty options
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [hasExpiration, setHasExpiration] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // Add state to track if AI features are actively processing
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      setError('Polls must have at least 2 options');
      return;
    }
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

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
  
  // Handle polite rewriting for poll question
  const handleRewriteQuestion = (rewrittenText: string) => {
    setQuestion(rewrittenText);
  };
  
  // Handle polite rewriting for poll options
  const handleRewriteOption = (index: number, rewrittenText: string) => {
    const newOptions = [...options];
    newOptions[index] = rewrittenText;
    setOptions(newOptions);
  };
  
  // Handle content suggestions for poll question
  const handleSelectSuggestion = (suggestion: string) => {
    setQuestion(suggestion);
  };
  
  // Handle kindness reminders
  const handleContentChange = (newContent: string) => {
    setQuestion(newContent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!question.trim()) {
      setError('Poll question is required');
      return;
    }

    // Filter out empty options and check if we have at least 2
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('Polls must have at least 2 non-empty options');
      return;
    }

    // Validate expiration date if set
    if (hasExpiration && !expiresAt) {
      setError('Please select an expiration date or disable expiration');
      return;
    }

    setIsCreating(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to create a poll');
        setIsCreating(false);
        return;
      }

      // 1. Create a post first
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          community_id: communityId,
          type: 'poll',
          content: question, // Store the question in the post content as well
          is_visible: true
        })
        .select('id')
        .single();

      if (postError) {
        throw new Error(`Error creating post: ${postError.message}`);
      }

      // 2. Create the poll
      const pollInsertData: any = {
        post_id: postData.id,
        question: question,
        created_by_user_id: user.id,
        community_id: communityId,
        tags: tags.length > 0 ? tags : null
      };
      
      // Add expiration date if set
      if (hasExpiration && expiresAt) {
        pollInsertData.expires_at = expiresAt;
      }

      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert(pollInsertData)
        .select('id')
        .single();

      if (pollError) {
        throw new Error(`Error creating poll: ${pollError.message}`);
      }

      // 3. Create poll options
      const optionsToInsert = validOptions.map(optionText => ({
        poll_id: pollData.id,
        option_text: optionText
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsToInsert);

      if (optionsError) {
        throw new Error(`Error creating poll options: ${optionsError.message}`);
      }

      // Reset form
      setQuestion('');
      setOptions(['', '']);
      setExpiresAt('');
      setHasExpiration(false);
      setTags([]);
      setTagInput('');
      onPollCreated();
    } catch (err: any) {
      console.error('Error creating poll:', err);
      setError(err.message || 'An error occurred while creating the poll');
    } finally {
      setIsCreating(false);
    }
  };

  // Calculate minimum date for expiration (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  // Filter suggested tags that match the input and aren't already selected
  const filteredSuggestions = SUGGESTED_TAGS.filter(
    tag => tag.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(tag)
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-2">Create a Poll</h3>
      
      <form onSubmit={handleSubmit}>
        {/* Kindness reminder will appear if needed */}
        <KindnessReminder 
          content={question} 
          onContentChange={handleContentChange} 
          disabled={isCreating || isAiProcessing}
        />
      
        <div className="mb-4">
          <label htmlFor="pollQuestion" className="block text-sm font-medium mb-1">
            Question
          </label>
          <div className="relative">
            <input
              id="pollQuestion"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isCreating || isAiProcessing}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <PoliteRewriter
                originalText={question}
                onRewritten={handleRewriteQuestion}
                disabled={isCreating || isAiProcessing}
              />
            </div>
          </div>
          
          {/* Content suggestions */}
          <div className="mt-1">
            <ContentSuggestions
              inputText={question}
              onSelectSuggestion={handleSelectSuggestion}
              disabled={isCreating || isAiProcessing}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Options
          </label>
          {options.map((option, index) => (
            <div key={index} className="flex items-center mb-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="w-full p-2 border border-gray-300 rounded-md mr-2"
                  disabled={isCreating || isAiProcessing}
                />
                {option.trim() && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <PoliteRewriter
                      originalText={option}
                      onRewritten={(text) => handleRewriteOption(index, text)}
                      disabled={isCreating || isAiProcessing}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                className="p-1 text-red-500 hover:text-red-700"
                disabled={options.length <= 2 || isCreating || isAiProcessing}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center text-blue-500 hover:text-blue-700 mt-2"
            disabled={isCreating || isAiProcessing}
          >
            <Plus size={18} className="mr-1" />
            <span>Add Option</span>
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              id="hasExpiration"
              type="checkbox"
              checked={hasExpiration}
              onChange={(e) => setHasExpiration(e.target.checked)}
              className="mr-2"
              disabled={isCreating || isAiProcessing}
            />
            <label htmlFor="hasExpiration" className="text-sm font-medium">
              Set expiration date
            </label>
          </div>
          
          {hasExpiration && (
            <div className="flex items-center">
              <Calendar size={18} className="mr-2 text-gray-500" />
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={minDate}
                className="p-2 border border-gray-300 rounded-md"
                disabled={isCreating || isAiProcessing}
              />
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Tags (Optional)
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
              Creating...
            </>
          ) : (
            'Create Poll'
          )}
        </button>
      </form>
    </div>
  );
};

export default PollCreator; 