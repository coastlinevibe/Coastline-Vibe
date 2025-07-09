import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const communityId = searchParams.get('communityId');
  
  if (!communityId) {
    return NextResponse.json(
      { error: 'Community ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch reaction notifications for this user in this community
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        created_at,
        content_snippet,
        is_read,
        target_entity_type,
        target_entity_id,
        actor_user_id,
        actor_profile:profiles!actor_user_id(username, avatar_url)
      `)
      .eq('user_id', user.id)
      .eq('community_id', communityId)
      .eq('type', 'reaction')
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (notifError) {
      console.error('Error fetching reaction notifications:', notifError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ notifications });
    
  } catch (error) {
    console.error('Error in reaction notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
