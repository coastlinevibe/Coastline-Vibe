import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export async function POST(req: NextRequest) {
  const supabase = createClient(cookies());
  const body = await req.json();
  const {
    community_id,
    property_id,
    seller_id,
    sender_id,
    name,
    email,
    phone,
    message
  } = body;

  if (!community_id || !property_id || !seller_id || !sender_id || !name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error } = await supabase.from('property_inquiries').insert([
    {
      community_id,
      property_id,
      seller_id,
      sender_id,
      name,
      email,
      phone,
      message
    }
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 