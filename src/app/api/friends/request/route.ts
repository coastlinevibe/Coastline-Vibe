import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const supabase = createClient(cookies());
  const body = await req.json();
  const { community_id, user_id, friend_id, reason } = body;

  if (!community_id || !user_id || !friend_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check if already friends or pending request exists (use user_id/friend_id for friend_requests)
  const { data: req1, error: req1Error } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('user_id', user_id)
    .eq('friend_id', friend_id)
    .in('status', ['pending', 'accepted']);
  const { data: req2, error: req2Error } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('user_id', friend_id)
    .eq('friend_id', user_id)
    .in('status', ['pending', 'accepted']);
  if (req1Error || req2Error) {
    return NextResponse.json({ error: (req1Error || req2Error).message }, { status: 500 });
  }
  const existingRequest = [...(req1 || []), ...(req2 || [])];
  if (existingRequest.length > 0) {
    return NextResponse.json({ error: 'Already friends or pending' }, { status: 409 });
  }

  // Check if already friends in friend_requests table (bidirectional)
  const { data: acc1, error: acc1Error } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('user_id', user_id)
    .eq('friend_id', friend_id)
    .eq('community_id', community_id)
    .eq('status', 'accepted');
  const { data: acc2, error: acc2Error } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('user_id', friend_id)
    .eq('friend_id', user_id)
    .eq('community_id', community_id)
    .eq('status', 'accepted');
  if (acc1Error || acc2Error) {
    return NextResponse.json({ error: (acc1Error || acc2Error).message }, { status: 500 });
  }
  const existingFriend = [...(acc1 || []), ...(acc2 || [])];
  if (existingFriend.length > 0) {
    return NextResponse.json({ error: 'Already friends or pending' }, { status: 409 });
  }

  // Check that both user and friend are in the same community
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('community_id')
    .eq('id', user_id)
    .single();
  const { data: friendProfile, error: friendProfileError } = await supabase
    .from('profiles')
    .select('community_id')
    .eq('id', friend_id)
    .single();
  if (userError || friendProfileError) {
    return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
  }
  if (!userProfile || !friendProfile || userProfile.community_id !== friendProfile.community_id || userProfile.community_id !== community_id) {
    return NextResponse.json({ error: 'Both users must be in the same community' }, { status: 403 });
  }

  // Insert friend request
  const { error: insertError } = await supabase
    .from('friend_requests')
    .insert([
      {
        user_id,
        friend_id,
        status: 'pending',
        reason: reason || null,
        community_id
      }
    ]);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Create notification for recipient
  await supabase.from('notifications').insert([
    {
      user_id: friend_id,
      actor_user_id: user_id,
      type: 'FRIEND_REQUEST',
      content_snippet: 'sent you a friend request',
      target_entity_id: user_id,
      target_entity_type: 'profile',
      community_id,
      is_read: false
    }
  ]);

  return NextResponse.json({ success: true });
} 