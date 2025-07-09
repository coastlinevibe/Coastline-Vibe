import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would call an AI service here
    // For now, we'll use mock suggestions based on the comment content
    const suggestions = generateSuggestions(text);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating reply suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

function generateSuggestions(text: string): string[] {
  // Simple mock implementation that returns different suggestions based on the content
  const lowerText = text.toLowerCase();
  
  // Default suggestions
  let suggestions = [
    'Thanks for sharing your perspective!',
    'I completely agree with your point.',
    'Could you elaborate more on that?',
  ];

  // Content-based suggestions
  if (lowerText.includes('question') || lowerText.includes('?')) {
    suggestions = [
      'Happy to help answer that!',
      'Great question, I was wondering the same.',
      'Let me think about this and get back to you.',
    ];
  } else if (lowerText.includes('problem') || lowerText.includes('issue') || lowerText.includes('help')) {
    suggestions = [
      'Sorry to hear you\'re having trouble.',
      'I had a similar issue recently.',
      'Have you tried reaching out to support?',
    ];
  } else if (lowerText.includes('thanks') || lowerText.includes('thank you')) {
    suggestions = [
      'You\'re welcome!',
      'Happy to help anytime.',
      'No problem at all!',
    ];
  } else if (lowerText.includes('idea') || lowerText.includes('suggestion')) {
    suggestions = [
      'That\'s a brilliant idea!',
      'I like how you\'re thinking about this.',
      'This could work really well.',
    ];
  }

  return suggestions;
}