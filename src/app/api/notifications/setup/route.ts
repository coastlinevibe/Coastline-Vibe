import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  const supabase = createClient();
  
  try {
    // Check for auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Step 1: Check if the notifications table exists
    console.log('Checking if notifications table exists...');
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notifications');
      
    if (tableError) {
      return NextResponse.json({ 
        error: 'Error checking for notifications table', 
        details: tableError 
      }, { status: 500 });
    }

    // Step 2: If table doesn't exist, try to create it with direct SQL
    let tableCreated = false;
    if (!tableExists || tableExists.length === 0) {
      console.log('Notifications table does not exist, creating...');
      
      // Try first with exec_sql function if it exists
      const { error: execSqlError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          
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
          
          GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
        `
      });
      
      if (!execSqlError) {
        tableCreated = true;
      } else {
        console.log('Failed to create table using exec_sql:', execSqlError);
      }
    } else {
      console.log('Notifications table already exists');
      tableCreated = true;
    }

    // Step 3: Test creating a notification
    let notificationResult = null;
    if (tableCreated) {
      console.log('Creating test notification...');
      
      const { data: testNotification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          actor_user_id: user.id,
          type: 'test',
          content_snippet: 'This is a test notification',
          is_read: false
        })
        .select();
        
      if (notifError) {
        console.log('Error creating notification directly:', notifError);
        
        // Try with RPC function
        const { data: rpcNotification, error: rpcError } = await supabase.rpc(
          'create_notification_direct',
          {
            user_id_param: user.id,
            actor_user_id_param: user.id,
            community_id_param: null,
            type_param: 'test',
            target_entity_type_param: null,
            target_entity_id_param: null,
            content_snippet_param: 'This is a test notification from RPC'
          }
        );
        
        if (rpcError) {
          console.log('Error creating notification via RPC:', rpcError);
        } else {
          notificationResult = {
            type: 'rpc',
            data: rpcNotification
          };
        }
      } else {
        notificationResult = {
          type: 'direct',
          data: testNotification
        };
      }
    }

    return NextResponse.json({
      success: true,
      table_exists: tableExists && tableExists.length > 0,
      table_created: tableCreated,
      notification_result: notificationResult
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error 
    }, { status: 500 });
  }
} 