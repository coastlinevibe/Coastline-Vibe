import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI with API key if available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

type RewriteResponse = {
  rewrittenText: string;
  mode?: string;
} | {
  error: string;
};

// Simple fallback rewriting function when API key is not available
function fallbackRewrite(text: string): string {
  // Very basic politeness improvements
  const lowercaseText = text.toLowerCase();
  
  // Replace some common impolite phrases
  let politeText = text
    .replace(/shut up/gi, "please be quiet")
    .replace(/stupid/gi, "not ideal")
    .replace(/i hate/gi, "I don't prefer")
    .replace(/terrible/gi, "not great")
    .replace(/awful/gi, "less than ideal")
    .replace(/crap/gi, "stuff")
    .replace(/garbage/gi, "not the best");
  
  // Add polite phrases if none exist
  if (!lowercaseText.includes("please") && !lowercaseText.includes("thank")) {
    politeText = "I would appreciate it if " + politeText;
  }
  
  // Improve ending with thank you if it's a question or request
  if (text.endsWith("?") && !lowercaseText.includes("thank")) {
    politeText = politeText + " Thank you!";
  }
  
  return politeText;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RewriteResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required in the request body' });
    }

    // Get API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    // If no API key is available, use fallback rewriting
    if (!apiKey || !openai) {
      console.log('No OpenAI API key available, using fallback rewriting');
      return res.status(200).json({ 
        rewrittenText: fallbackRewrite(text),
        mode: 'fallback'
      });
    }

    // Call OpenAI API to rewrite the text
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that rewrites text to be more polite, friendly, and community-appropriate. Keep the same meaning but make it more positive, constructive, and kind. Always maintain the original intent but adjust the tone and wording to be as friendly as possible."
        },
        {
          role: "user",
          content: `Please rewrite the following text to be more polite and friendly for a community forum: "${text}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const rewrittenText = completion.choices[0]?.message?.content || text;
    
    return res.status(200).json({ 
      rewrittenText,
      mode: 'ai'
    });
  } catch (error) {
    console.error('Error rewriting text:', error);
    
    // On error, still try to return something useful with the fallback
    // Get the text from the request body again since it's not in scope
    const { text = "" } = req.body;
    
    return res.status(200).json({ 
      rewrittenText: fallbackRewrite(text),
      mode: 'fallback_after_error'
    });
  }
} 