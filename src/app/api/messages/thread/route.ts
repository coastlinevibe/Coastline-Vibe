import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const supabase = createClient(cookies());
  const { searchParams } = new URL(req.url);
  const community_id = searchParams.get('community_id');
  const user_id = searchParams.get('user_id');
  const friend_id = searchParams.get('friend_id');

  if (!community_id || !user_id || !friend_id) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
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

  // Fetch messages
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('community_id', community_id)
    .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages });
} 