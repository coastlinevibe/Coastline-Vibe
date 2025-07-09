import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  const supabase = createClient();
  const results = {
    auth: null,
    tables: null,
    notificationsTableExists: false,
    createNotificationAttempt: null,
    rawInsertAttempt: null,
    diagnostics: {}
  };
  
  try {
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    results.auth = { user: user ? { id: user.id, email: user.email } : null, error: authError };
    
    if (!user) {
      return NextResponse.json({ 
        message: "Not authenticated. Please log in first.", 
        results 
      }, { status: 401 });
    }

    // 2. List all tables in the database
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .eq('table_schema', 'public');
    
    results.tables = { 
      data: tablesData,
      tableNames: tablesData?.map(t => t.table_name) || [],
      error: tablesError 
    };
    
    // 3. Check if notifications table exists
    results.notificationsTableExists = tablesData?.some(t => t.table_name === 'notifications') || false;
    
    // 4. Try to create the notifications table if it doesn't exist
    if (!results.notificationsTableExists) {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          target_entity_type TEXT,
          target_entity_id TEXT,
          content_snippet TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can read their own notifications" 
        ON public.notifications FOR SELECT 
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Authenticated users can create notifications" 
        ON public.notifications FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
        
        CREATE POLICY "Users can update their own notifications" 
        ON public.notifications FOR UPDATE
        USING (auth.uid() = user_id);
      `;
      
      // Try to use RPC to create the table
      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql_query: createTableSQL 
      });
      
      results.diagnostics.tableCreationAttempt = { error: createError };
      
      // Check if table exists after creation attempt
      const { data: checkData } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'notifications');
      
      results.notificationsTableExists = checkData && checkData.length > 0;
    }

    // 5. Try creating a notification using the utility function
    const { error: createNotifsError } = await supabase.rpc('create_notification_direct', {
      user_id_param: user.id,
      actor_user_id_param: null, // System notification
      community_id_param: null,
      type_param: 'test',
      target_entity_type_param: null,
      target_entity_id_param: null,
      content_snippet_param: 'Test notification from debug endpoint'
    });
    
    results.createNotificationAttempt = { error: createNotifsError };

    // 6. Try raw insert into notifications table
    const { data: insertData, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        actor_user_id: null, // System notification
        type: 'test',
        content_snippet: 'Raw insert test notification',
        is_read: false
      })
      .select();
    
    results.rawInsertAttempt = { data: insertData, error: insertError };
    
    // 7. List any existing notifications for this user
    const { data: existingNotifs, error: notifsFetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id);
    
    results.diagnostics.existingNotifications = { 
      count: existingNotifs?.length || 0,
      data: existingNotifs,
      error: notifsFetchError
    };
    
    // 8. Check RLS policies
    const { data: policiesData, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, cmd, qual')
      .eq('tablename', 'notifications');
    
    results.diagnostics.rlsPolicies = { data: policiesData, error: policiesError };

    return NextResponse.json({
      message: "Notifications diagnostics completed",
      results
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      message: "Error running diagnostics", 
      error: error.message,
      results
    }, { status: 500 });
  }
} 