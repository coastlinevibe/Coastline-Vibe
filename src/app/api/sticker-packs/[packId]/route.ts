import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET endpoint to fetch a specific sticker pack
export async function GET(
  request: NextRequest,
  { params }: { params: { packId: string } }
) {
  try {
    const packId = params.packId;
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');

    if (!packId || !communityId) {
      return NextResponse.json(
        { error: { message: 'Missing pack ID or community ID' } }, 
        { status: 400 }
      );
    }

    // Initialize Supabase server client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Fetch the sticker pack
    const { data, error } = await supabase
      .from('sticker_packs')
      .select('*')
      .eq('id', packId)
      .eq('community_id', communityId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: { message: error.message } }, 
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: { message: 'Sticker pack not found' } }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in GET sticker pack:', error);
    return NextResponse.json(
      { error: { message: error.message || 'An unexpected error occurred' } }, 
      { status: 500 }
    );
  }
}

// PATCH endpoint to update a sticker pack
export async function PATCH(
  request: NextRequest,
  { params }: { params: { packId: string } }
) {
  try {
    const packId = params.packId;
    const body = await request.json();
    const { name, description, category, communityId } = body;

    if (!packId || !name || !category || !communityId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Initialize Supabase server client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Verify current user is a community admin
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to update sticker packs' }, 
        { status: 401 }
      );
    }

    // Check if user is admin for this community
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, community_id')
      .eq('id', session.user.id)
      .single();

    if (!profileData || profileData.role !== 'community admin' || profileData.community_id !== communityId) {
      return NextResponse.json(
        { success: false, error: 'You must be a community admin to update sticker packs' }, 
        { status: 403 }
      );
    }

    // Update the sticker pack
    const { error } = await supabase
      .from('sticker_packs')
      .update({
        name,
        description,
        category
      })
      .eq('id', packId)
      .eq('community_id', communityId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in PATCH sticker pack:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
} 