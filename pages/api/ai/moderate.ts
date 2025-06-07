import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ModerationResponse = {
  isAppropriate: boolean;
  kindnessSuggestion: string | null;
  confidence: number;
} | {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ModerationResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required in the request body' });
    }

    // Get API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    // First, use OpenAI's Moderation API to check for harmful content
    const moderationResult = await openai.moderations.create({
      input: content,
    });

    const flagged = moderationResult.results[0]?.flagged || false;
    
    // If content is already appropriate according to moderation API
    if (!flagged) {
      return res.status(200).json({
        isAppropriate: true,
        kindnessSuggestion: null,
        confidence: 1.0
      });
    }

    // If flagged, analyze with GPT to get a kindness suggestion
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a community moderation assistant. Your job is to analyze text for a community forum and provide kindness reminders when content might be inappropriate or unkind. Your suggestions should be constructive, helpful, and encourage positive communication."
        },
        {
          role: "user",
          content: `Please analyze this content for a community forum and provide a kindness suggestion if needed: "${content}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const kindnessSuggestion = completion.choices[0]?.message?.content || null;
    
    // Always include a suggestion if the content was flagged
    return res.status(200).json({
      isAppropriate: false,
      kindnessSuggestion,
      confidence: moderationResult.results[0]?.category_scores?.['harassment/threatening'] || 0.5
    });
  } catch (error) {
    console.error('Error moderating content:', error);
    return res.status(500).json({ error: 'Error processing your request' });
  }
} 