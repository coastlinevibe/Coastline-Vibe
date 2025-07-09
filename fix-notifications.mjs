#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get the directory path of the current file
const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required environment variables:');
    if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
    if (!serviceRoleKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease create a .env file with these variables and try again.');
    process.exit(1);
  }
  
  // Create Supabase admin client with service role key for migrations
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    console.log('🔧 Checking database setup...');
    
    // Read SQL migration file
    const migrationPath = join(__dirname, 'src', 'migrations', 'create_notifications_table.sql');
    let migrationSQL;
    
    try {
      migrationSQL = readFileSync(migrationPath, 'utf8');
      console.log('✅ Migration file loaded successfully');
    } catch (err) {
      console.error('❌ Failed to read migration file:', err.message);
      process.exit(1);
    }
    
    // Check if notifications table exists
    console.log('🔍 Checking if notifications table exists...');
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notifications');
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message);
      process.exit(1);
    }
    
    const tableExists = tablesData && tablesData.length > 0;
    console.log(tableExists ? '✅ Notifications table exists' : '❌ Notifications table does not exist');
    
    // Apply migration using RPC
    console.log('🚀 Applying migration...');
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });
    
    if (migrationError) {
      // If RPC doesn't exist, execute the SQL directly
      if (migrationError.message.includes('does not exist')) {
        console.log('⚠️ exec_sql RPC not found, falling back to direct SQL execution');
        
        // Execute the SQL statements one by one
        const statements = migrationSQL.split(';').filter(s => s.trim().length > 0);
        
        for (const statement of statements) {
          const { error } = await supabase.sql(statement + ';');
          if (error) {
            console.error('❌ Error executing SQL statement:', error.message);
            console.error('Statement:', statement);
            process.exit(1);
          }
        }
        
        console.log('✅ Migration applied successfully');
      } else {
        console.error('❌ Error applying migration:', migrationError.message);
        process.exit(1);
      }
    } else {
      console.log('✅ Migration applied successfully');
    }
    
    // Create a test notification to verify functionality
    console.log('🔔 Creating test notification...');
    
    // Get any user from the system to test with
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();
    
    if (userError) {
      console.error('❌ Error getting test user:', userError.message);
      process.exit(1);
    }
    
    const testUserId = userData.id;
    
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: testUserId,
        actor_user_id: testUserId,
        type: 'test',
        content_snippet: 'This is a test notification from fix-notifications.mjs',
        is_read: false
      })
      .select();
    
    if (notificationError) {
      console.error('❌ Error creating test notification:', notificationError.message);
      process.exit(1);
    }
    
    console.log('✅ Test notification created successfully:', notification);
    console.log('🎉 All done! Notifications should now be working properly.');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

main(); 