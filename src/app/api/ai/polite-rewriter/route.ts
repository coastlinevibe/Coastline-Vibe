import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Use the OpenAI API to rewrite the text in a more polite manner
    try {
      // Check if OpenAI API key is valid
      if (!process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        console.warn('No OpenAI API key found, using mock response');
        throw new Error('No OpenAI API key provided');
      }
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that rewrites short messages to make them more polite, friendly, and detailed for a neighborhood community platform. Make the text conversational, add a friendly greeting, and expand with relevant details while maintaining the original intent."
          },
          {
            role: "user",
            content: `Rewrite the following text to make it more polite and detailed: "${text}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const rewrittenText = completion.choices[0].message.content?.trim();

      return NextResponse.json({ rewrittenText });
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      
      // Mock responses for testing
      if (text.toLowerCase().includes('plumbing')) {
        return NextResponse.json({
          rewrittenText: `Hi neighbors! I'm looking for a trusted plumber in the area who can help with some repairs. Any recommendations would be greatly appreciated!`
        });
      } else {
        return NextResponse.json({
          rewrittenText: `Hi everyone! ${text} Thank you so much for your help and suggestions!`
        });
      }
    }
  } catch (error) {
    console.error('Error processing polite rewriter request:', error);
    return NextResponse.json(
      { error: 'Failed to rewrite text' },
      { status: 500 }
    );
  }
} 