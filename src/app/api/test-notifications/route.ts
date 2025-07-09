import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Try executing the database function to create the notifications table if it doesn't exist
    const { error: setupError } = await supabase.rpc('create_notifications_table');

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Authentication error', 
        details: userError 
      }, { status: 401 });
    }
    
    // Try creating a test notification directly in the database
    const { data: testNotification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        actor_user_id: user.id,
        type: 'test',
        content_snippet: 'This is a test notification',
        is_read: false
      })
      .select();
    
    if (notificationError) {
      // If insertion failed, check if table exists
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'notifications');
      
      if (tableError) {
        return NextResponse.json({
          error: 'Error checking if notifications table exists',
          details: tableError
        }, { status: 500 });
      }
      
      const tableExists = tableInfo && tableInfo.length > 0;
      
      return NextResponse.json({ 
        error: 'Error creating test notification',
        table_exists: tableExists,
        setup_error: setupError,
        details: notificationError 
      }, { status: 500 });
    }
    
    // Try creating a test notification using the utility function
    const { data: fnData, error: fnError } = await supabase.rpc(
      'create_post_like_notification',
      {
        post_owner_id: user.id,
        actor_user_id: user.id,
        post_id: 'test-post-id',
        community_id: null,
        actor_username: 'Test User'
      }
    );
    
    // Try retrieving notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      return NextResponse.json({ 
        error: 'Error fetching notifications', 
        details: fetchError 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      test_notification: testNotification,
      function_result: { data: fnData, error: fnError },
      notifications: notifications
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error 
    }, { status: 500 });
  }
} 