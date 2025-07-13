import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * API route that handles cleanup of banned accounts older than 10 days
 * This should be called by a cron job daily
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with admin privileges
    const supabase = createClient(cookies());

    // Query for banned users older than 10 days
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    const { data: bannedUsers, error: queryError } = await supabase
      .from('profiles')
      .select('id, username, ban_date')
      .eq('is_banned', true)
      .lt('ban_date', tenDaysAgo.toISOString());

    if (queryError) {
      console.error('Error querying banned users:', queryError);
      return NextResponse.json({ 
        success: false, 
        error: queryError.message 
      }, { status: 500 });
    }

    if (!bannedUsers || bannedUsers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No banned users to delete',
        deleted: 0
      });
    }

    // Process each banned user for deletion
    const results = await Promise.all(bannedUsers.map(async (user) => {
      try {
        // Delete user's auth account (this should cascade delete their profile)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`Failed to delete user ${user.username}:`, deleteError);
          return { userId: user.id, success: false, error: deleteError.message };
        }
        
        return { userId: user.id, username: user.username, success: true };
      } catch (err: any) {
        console.error(`Error processing user ${user.username}:`, err);
        return { userId: user.id, success: false, error: err.message };
      }
    }));

    const successfulDeletes = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${bannedUsers.length} banned users`,
      deleted: successfulDeletes,
      results
    });
  } catch (error: any) {
    console.error('Error in cleanup-banned-accounts route:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
} 