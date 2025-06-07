import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type SuggestResponse = {
  suggestions: string[];
} | {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuggestResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    const { promptStart, communityContext } = req.body;

    if (!promptStart) {
      return res.status(400).json({ error: 'A prompt start is required in the request body' });
    }

    // Get API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    // Format community context if available
    const communityInfo = communityContext 
      ? `This is for a community named "${communityContext.communityName}" with the description: "${communityContext.communityDescription}".` 
      : "";

    // Call OpenAI API to generate suggestions
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a helpful community post assistant. Your job is to generate 3 different potential completions for a community post that a user has started typing. ${communityInfo} Make suggestions that are friendly, constructive, and likely to engage the community in a positive way. Each suggestion should be different in tone and content but appropriate for a community forum. Keep each suggestion to 1-2 sentences.`
        },
        {
          role: "user",
          content: `I've started typing a post: "${promptStart}". Please suggest 3 different ways I could complete this post.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || "";
    
    // Parse the response to extract the 3 suggestions
    // We need to split by lines and process each line
    let suggestions: string[] = [];
    
    // Split by newlines first
    const lines = response.split('\n').filter(line => line.trim());
    
    // Try to extract suggestions from numbered or bullet point lists
    for (const line of lines) {
      // Check for numbered items like "1. suggestion" or "1) suggestion"
      const numberedMatch = line.match(/^\d+[\.\)]\s*(.*)/);
      if (numberedMatch && numberedMatch[1]) {
        suggestions.push(numberedMatch[1].trim());
        continue;
      }
      
      // Check for bullet points like "- suggestion" or "* suggestion"
      const bulletMatch = line.match(/^[\-\*]\s*(.*)/);
      if (bulletMatch && bulletMatch[1]) {
        suggestions.push(bulletMatch[1].trim());
        continue;
      }
      
      // If not a bullet or number but looks like a sentence, add it
      if (line.length > 10 && !line.startsWith('I') && !line.toLowerCase().includes('suggestion')) {
        suggestions.push(line.trim());
      }
    }
    
    // If we couldn't identify suggestions, just use the first 3 lines
    if (suggestions.length === 0) {
      suggestions = lines.slice(0, 3);
    }
    
    // Ensure we only return max 3 suggestions
    suggestions = suggestions.slice(0, 3);

    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({ error: 'Error processing your request' });
  }
} 