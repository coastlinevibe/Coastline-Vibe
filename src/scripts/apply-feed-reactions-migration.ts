/**
 * Script to apply the feed reactions migration
 * 
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/apply-feed-reactions-migration.ts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function applyMigration() {
  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or service role key. Please check your environment variables.');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'src', 'app', 'api', 'feed', 'reactions', 'migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying feed reactions migration...');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      throw error;
    }
    
    console.log('Feed reactions migration applied successfully!');
  } catch (error) {
    console.error('Error applying feed reactions migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration(); 