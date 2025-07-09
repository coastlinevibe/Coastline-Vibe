'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function FixNotificationsPage() {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      setError('Not authenticated. Please log in first.');
      setLoading(false);
      return;
    }
    setUser(data.user);
    await checkTables();
  };

  const checkTables = async () => {
    setLoading(true);
    try {
      // Check notifications table
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (error) {
        throw new Error(`Error fetching tables: ${error.message}`);
      }

      const tableNames = tables?.map(t => t.table_name) || [];
      const hasNotifications = tableNames.includes('notifications');

      setStatus({
        ...status,
        tables: tableNames,
        hasNotificationsTable: hasNotifications
      });

      // Check existing notifications if table exists
      if (hasNotifications) {
        await checkNotifications();
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(`Error fetching notifications: ${error.message}`);
      }

      setStatus({
        ...status,
        notifications: {
          count: data?.length || 0,
          data: data
        }
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createTable = async () => {
    setAction('create_table');
    setResult(null);
    setError(null);
    
    try {
      const sql = `
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
      
      // First try using exec_sql function
      const { error: execError } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (execError) {
        setResult({
          success: false,
          method: 'exec_sql',
          error: execError
        });
        
        // Try direct API endpoint if available
        try {
          const response = await fetch('/api/notifications/setup');
          const data = await response.json();
          setResult({
            ...result,
            apiEndpoint: data
          });
        } catch (apiError: any) {
          setError(`API endpoint error: ${apiError.message}`);
        }
      } else {
        setResult({
          success: true,
          method: 'exec_sql'
        });
      }
      
      // Check if table exists now
      await checkTables();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAction(null);
    }
  };

  const createTestNotification = async () => {
    setAction('create_notification');
    setResult(null);
    setError(null);
    
    try {
      if (!user) throw new Error('Not authenticated');
      
      // Try direct insert
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'test',
          content_snippet: 'This is a test notification from the fix tool',
          is_read: false
        })
        .select();
        
      if (error) {
        setResult({
          success: false,
          method: 'direct_insert',
          error
        });
      } else {
        setResult({
          success: true,
          method: 'direct_insert',
          notification: data
        });
        
        // Refresh notifications
        await checkNotifications();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAction(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Fix Notifications Tool</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <span className="ml-3">Checking system status...</span>
          </div>
        </div>
      ) : (
        <>
          {/* User Status */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">User Status</h2>
            {user ? (
              <div>
                <p className="mb-1"><span className="font-medium">ID:</span> {user.id}</p>
                <p className="mb-1"><span className="font-medium">Email:</span> {user.email}</p>
              </div>
            ) : (
              <p className="text-red-500">Not logged in</p>
            )}
          </div>
          
          {/* Notifications Table Status */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Notifications Table Status</h2>
            {status.hasNotificationsTable ? (
              <div className="mb-4">
                <p className="text-green-500 mb-2">✅ Notifications table exists</p>
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={checkTables}
                >
                  Refresh Status
                </button>
              </div>
            ) : (
              <div>
                <p className="text-red-500 mb-2">❌ Notifications table does not exist</p>
                <button
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  onClick={createTable}
                  disabled={action === 'create_table'}
                >
                  {action === 'create_table' ? 'Creating...' : 'Create Notifications Table'}
                </button>
              </div>
            )}
            
            <div className="mt-4">
              <p className="font-medium mb-2">Available tables:</p>
              <div className="bg-gray-100 p-3 rounded max-h-40 overflow-y-auto">
                <ul className="list-disc list-inside">
                  {status.tables?.map((table: string) => (
                    <li key={table} className={table === 'notifications' ? 'text-green-600 font-medium' : ''}>
                      {table}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Create Test Notification */}
          {status.hasNotificationsTable && user && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold mb-4">Create Test Notification</h2>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={createTestNotification}
                disabled={action === 'create_notification'}
              >
                {action === 'create_notification' ? 'Creating...' : 'Create Test Notification'}
              </button>
            </div>
          )}
          
          {/* Existing Notifications */}
          {status.notifications && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold mb-4">Recent Notifications ({status.notifications.count})</h2>
              {status.notifications.count > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {status.notifications.data.map((notif: any) => (
                        <tr key={notif.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{notif.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{notif.type}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{notif.content_snippet}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(notif.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No notifications found</p>
              )}
              <div className="mt-4">
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                  onClick={checkNotifications}
                >
                  Refresh Notifications
                </button>
              </div>
            </div>
          )}
          
          {/* Action Result */}
          {result && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Action Result</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
} 