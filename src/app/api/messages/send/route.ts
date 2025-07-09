import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const supabase = createClient(cookies());
  const body = await req.json();
  const { community_id, user_id, friend_id, content } = body;

  if (!community_id || !user_id || !friend_id || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check if users are friends in this community
  const { data: friends, error: friendsError } = await supabase
    .from('friend_requests')
    .select('id')
    .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`)
    .eq('community_id', community_id)
    .eq('status', 'accepted');

  if (friendsError || !friends || friends.length === 0) {
    return NextResponse.json({ error: 'Not friends in this community' }, { status: 403 });
  }

  // Insert message
  const { error } = await supabase
    .from('messages')
    .insert([
      {
        community_id,
        user_id,
        friend_id,
        content
      }
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 