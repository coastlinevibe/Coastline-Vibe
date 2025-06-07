import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { groupId, startTime, endTime } = body;

    // Validate inputs
    if (!groupId || !startTime || !endTime) {
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Verify user is authenticated and is a member of the group
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a member of the group
    const { data: memberData, error: memberError } = await supabase
      .from('vibe_groups_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (memberError || !memberData) {
      return NextResponse.json(
        { message: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Fetch messages from the specified time range
    const { data: messages, error: messagesError } = await supabase
      .from('vibe_groups_messages')
      .select(`
        *,
        sender:profiles!sender_id(username),
        media:vibe_groups_media(*),
        voice_note:vibe_groups_voice_notes(*)
      `)
      .eq('group_id', groupId)
      .eq('is_deleted', false)
      .gte('created_at', startTime)
      .lte('created_at', endTime)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { message: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // If no messages, return early
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { message: 'No messages found in the specified time range' },
        { status: 404 }
      );
    }

    // Format messages for AI processing
    const formattedConversation = messages.map((msg: any) => {
      let content = msg.content || '';
      
      // Add media information if present
      if (msg.media && msg.media.length > 0) {
        content += ` [Shared ${msg.media.length} ${msg.media.length === 1 ? 'file' : 'files'}]`;
      }
      
      // Add voice note information if present
      if (msg.voice_note) {
        content += ` [Voice note: ${msg.voice_note.transcription || 'No transcription available'}]`;
      }
      
      // Format as a conversation with usernames
      return `${msg.sender?.username || 'Unknown'}: ${content}`;
    }).join('\n\n');

    // Get group details for context
    const { data: groupData, error: groupError } = await supabase
      .from('vibe_groups')
      .select('name, description')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('Error fetching group details:', groupError);
      return NextResponse.json(
        { message: 'Failed to fetch group details' },
        { status: 500 }
      );
    }

    // Create system prompt
    const systemPrompt = `You are the AI Deckhand for the "${groupData.name}" Vibe Group. 
Your task is to create a concise summary (max 300 words) of the conversation that took place 
between ${new Date(startTime).toLocaleString()} and ${new Date(endTime).toLocaleString()}.
Focus on:
1. Main topics discussed
2. Key decisions or plans made
3. Questions that were asked and answered
4. Any action items or follow-ups mentioned
5. Overall tone and sentiment of the conversation

Be conversational and use nautical/coastal language where appropriate, as this fits the "Vibe Groups" theme.`;

    // Generate summary with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: formattedConversation }
      ],
      max_tokens: 500,
    });

    const summaryText = completion.choices[0].message.content;

    // Store the summary in the database
    const { data: summaryData, error: summaryError } = await supabase
      .from('vibe_groups_ai_summaries')
      .insert({
        group_id: groupId,
        summary_text: summaryText,
        start_timestamp: startTime,
        end_timestamp: endTime,
        generated_at: new Date().toISOString(),
        voice_url: null // Voice conversion would be a separate step
      })
      .select()
      .single();

    if (summaryError) {
      console.error('Error storing summary:', summaryError);
      return NextResponse.json(
        { message: 'Failed to store summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Summary generated successfully',
      summary: summaryData
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 