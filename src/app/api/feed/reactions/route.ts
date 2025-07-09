import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import fs from 'fs';
import path from 'path';

// POST route for admin to apply migrations
export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  // Check if the user is authenticated and is an admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Check if user is an admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 403 }
    );
  }
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'src', 'app', 'api', 'feed', 'reactions', 'migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (migrationError) {
      throw migrationError;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Feed reactions migration applied successfully' 
    });
  } catch (error) {
    console.error('Error applying feed reactions migration:', error);
    return NextResponse.json(
      { error: 'Failed to apply migration', details: error },
      { status: 500 }
    );
  }
}

// PUT route for adding reactions
export async function PUT(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  // Check if the user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Parse the request body
    const { postId, reactionType, reactionId, expiresAt } = await req.json();
    
    if (!postId || !reactionType || !reactionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch the community_id for the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('community_id')
      .eq('id', postId)
      .single();
    if (postError || !post) {
      return NextResponse.json(
        { error: 'Could not find post or community_id' },
        { status: 400 }
      );
    }

    // Map 'static' and 'emoji' type to 'sticker' to comply with the table constraint
    let mappedReactionType = reactionType;
    if (reactionType === 'static' || reactionType === 'emoji') {
      mappedReactionType = 'sticker';
    }

    // Insert into post_like_reaction table
    const { data, error } = await supabase
      .from('post_like_reaction')
      .insert({
        post_id: postId,
        user_id: user.id,
        reaction: reactionId,
        reaction_type: mappedReactionType,
        reaction_id: reactionId,
        expires_at: expiresAt || null,
        community_id: post.community_id
      })
      .select();
    
    if (error) {
      console.error('Error adding reaction:', error);
      return NextResponse.json(
        { error: 'Failed to add reaction', details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      reaction: data
    });
  } catch (error) {
    console.error('Error processing reaction:', error);
    return NextResponse.json(
      { error: 'Failed to process reaction', details: error },
      { status: 500 }
    );
  }
} 