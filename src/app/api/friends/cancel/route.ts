import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const supabase = createClient(cookies());
  const body = await req.json();
  const { user_id, friend_id } = body;

  if (!user_id || !friend_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Delete the pending friend request
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},user_id.eq.${user_id})`)
    .eq('status', 'pending');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 