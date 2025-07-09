import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputText } = body;

    if (!inputText) {
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      );
    }

    // Check if the input starts with "I'm looking for" to trigger suggestions
    if (inputText.toLowerCase().startsWith("i'm looking for") || 
        inputText.toLowerCase().startsWith("im looking for")) {
      
      // Use the OpenAI API to generate suggestions
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that provides post suggestions for a community platform. Generate 3 specific, friendly, and conversational post suggestions that expand on what the user is looking for. Each suggestion should be a complete sentence that could be used as a post."
            },
            {
              role: "user",
              content: `The user has started typing: "${inputText}". Complete this into 3 friendly, specific post suggestions that a user might want to post in a neighborhood community platform. Be conversational and helpful.`
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        });

        const suggestions = completion.choices[0].message.content?.split('\n')
          .filter(suggestion => suggestion.trim().length > 0)
          .map(suggestion => suggestion.replace(/^\d+\.\s*/, '').trim())
          .slice(0, 3) || [];

        return NextResponse.json({ suggestions });
      } catch (error) {
        console.error('Error calling OpenAI:', error);
        // Fall back to static suggestions if OpenAI fails
        return NextResponse.json({
          suggestions: [
            `Looking for local recommendations on restaurants in the area?`,
            `Looking for someone who can help with lawn maintenance this weekend?`,
            `Looking for advice on the best local parks for kids?`
          ]
        });
      }
    } else {
      // Return empty suggestions for inputs that don't match our trigger
      return NextResponse.json({ suggestions: [] });
    }
  } catch (error) {
    console.error('Error processing post suggestion request:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
} 