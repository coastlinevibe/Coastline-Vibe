import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  const supabase = createClient();
  
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: "Not authenticated",
        details: authError
      }, { status: 401 });
    }

    // Check if notifications table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notifications');
      
    const notificationsTableExists = tables && tables.length > 0;
    
    // Try inserting a notification
    let insertResult = null;
    let existingNotifications = null;
    
    if (notificationsTableExists) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'test',
          content_snippet: 'Debug test notification',
          is_read: false
        })
        .select();
        
      insertResult = { data, error };
      
      // Check existing notifications
      const { data: notifs, error: notifsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id);
        
      existingNotifications = {
        count: notifs?.length || 0,
        data: notifs,
        error: notifsError
      };
    }
    
    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, email: user.email },
      notificationsTableExists,
      tablesError,
      insertResult,
      existingNotifications
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: "Error running diagnostics",
      message: error.message 
    }, { status: 500 });
  }
} 