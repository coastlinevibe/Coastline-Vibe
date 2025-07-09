import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user || authError) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { userId, type, message, entityType, entityId } = body;
    
    // Basic validation
    if (!userId || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId and type are required' }, 
        { status: 400 }
      );
    }

    // First check if notifications table exists
    const { data: tablesData } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notifications');
      
    const tableExists = tablesData && tablesData.length > 0;

    // If table doesn't exist, create it
    if (!tableExists) {
      const createTableSQL = `
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
      `;
      
      // Try to execute SQL to create the table
      const { error: createError } = await supabase.rpc('exec_sql', { sql_query: createTableSQL });
      
      // Check if table was created
      if (createError) {
        return NextResponse.json(
          { success: false, error: 'Failed to create notifications table', details: createError },
          { status: 500 }
        );
      }
      
      // Verify table was created
      const { data: verifyData } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'notifications');
        
      if (!verifyData || verifyData.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Failed to verify notifications table creation' },
          { status: 500 }
        );
      }
    }

    // Create notification
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        actor_user_id: user.id,
        type: type,
        target_entity_type: entityType || null,
        target_entity_id: entityId || null,
        content_snippet: message || `You have a new ${type} notification`,
        is_read: false
      })
      .select();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create notification', details: insertError },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json({
      success: true,
      notification,
      tableCreated: !tableExists
    });
  } catch (error: any) {
    console.error('Error in create notification API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 