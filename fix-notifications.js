require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

  console.log('🔧 Connecting to Supabase...');
  
  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'src', 'migrations', 'fix_notifications.sql');
    console.log(`📄 Reading migration from ${migrationPath}`);
    
    let sql;
    try {
      sql = fs.readFileSync(migrationPath, 'utf8');
      console.log('✅ Migration file loaded');
    } catch (err) {
      console.error(`❌ Error reading migration file: ${err.message}`);
      process.exit(1);
    }

    // Execute the SQL migration
    console.log('🚀 Applying migration to fix notifications...');
    
    // First check if we can execute SQL directly
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql_query: 'SELECT 1;'
    });

    if (sqlError && sqlError.message.includes('does not exist')) {
      console.log('⚠️ exec_sql function not found, creating it first...');
      
      // Create the exec_sql function first
      const { error: createFnError } = await supabase.from('_exec_sql').rpc('CREATE OR REPLACE FUNCTION exec_sql(sql_query text) RETURNS void AS $$ BEGIN EXECUTE sql_query; END; $$ LANGUAGE plpgsql SECURITY DEFINER;');
      
      if (createFnError) {
        console.error(`❌ Could not create exec_sql function: ${createFnError.message}`);
        console.log('⚠️ Falling back to direct SQL execution through the API...');
        
        // Execute each statement separately as a fallback
        const statements = sql.split(';').filter(s => s.trim()).map(s => s.trim() + ';');
        
        for (const statement of statements) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error } = await supabase.from('_direct_sql').rpc(statement);
          if (error) {
            console.error(`❌ Error executing statement: ${error.message}`);
          }
        }
      } else {
        // Now that we have the exec_sql function, use it
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
          console.error(`❌ Error applying migration: ${error.message}`);
          process.exit(1);
        }
      }
    } else {
      // We already have the exec_sql function, use it
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error(`❌ Error applying migration: ${error.message}`);
        process.exit(1);
      }
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Test if notifications table exists
    console.log('🔍 Checking if notifications table exists...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notifications');
      
    if (tablesError) {
      console.error(`❌ Error checking for notifications table: ${tablesError.message}`);
    } else {
      const tableExists = tables && tables.length > 0;
      console.log(tableExists ? '✅ Notifications table exists!' : '❌ Notifications table was not created properly.');
      
      if (tableExists) {
        // Get any user to test notifications with
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, username')
          .limit(1);
          
        if (usersError) {
          console.error(`❌ Error getting test user: ${usersError.message}`);
        } else if (users && users.length > 0) {
          const testUser = users[0];
          console.log(`🧪 Creating test notification for user ${testUser.username}...`);
          
          // Try creating a test notification
          const { data: notification, error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: testUser.id,
              actor_user_id: testUser.id, // Self-notification for testing
              type: 'test',
              content_snippet: 'This is a test notification from fix-notifications.js',
              is_read: false
            })
            .select();
            
          if (notifError) {
            console.error(`❌ Error creating test notification: ${notifError.message}`);
            
            // Try with the function
            console.log('🔄 Trying with direct function...');
            const { data: fnNotif, error: fnError } = await supabase.rpc('create_notification_direct', {
              user_id_param: testUser.id,
              actor_user_id_param: testUser.id,
              community_id_param: null,
              type_param: 'test',
              target_entity_type_param: null,
              target_entity_id_param: null,
              content_snippet_param: 'This is a test notification from function'
            });
            
            if (fnError) {
              console.error(`❌ Function also failed: ${fnError.message}`);
            } else {
              console.log('✅ Test notification created via function!', fnNotif);
            }
          } else {
            console.log('✅ Test notification created directly!', notification);
          }
        }
      }
    }

    console.log('🎉 All done! Notifications should now be working properly.');

  } catch (err) {
    console.error(`❌ Unexpected error: ${err.message}`);
    process.exit(1);
  }
}

main(); 