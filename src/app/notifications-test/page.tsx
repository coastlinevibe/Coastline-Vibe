'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createDirectNotification } from '@/utils/notificationUtils';

export default function NotificationsTestPage() {
  const [user, setUser] = useState<any>(null);
  const [notificationsTable, setNotificationsTable] = useState<{exists: boolean, error: any}>(
    {exists: false, error: null}
  );
  const [creationResult, setCreationResult] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({
    user: true,
    table: false,
    create: false,
    fetch: false
  });
  const [error, setError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string>('This is a test notification');

  const supabase = createClient();

  useEffect(() => {
    // Check if user is authenticated
    async function checkAuth() {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        setError('Authentication error: ' + error.message);
        setLoading(prev => ({ ...prev, user: false }));
        return;
      }
      
      if (!data.user) {
        setError('You need to be logged in to test notifications');
        setLoading(prev => ({ ...prev, user: false }));
        return;
      }
      
      setUser(data.user);
      setLoading(prev => ({ ...prev, user: false }));
      
      // Check notifications table
      checkNotificationsTable();
    }
    
    checkAuth();
  }, []);

  const checkNotificationsTable = async () => {
    setLoading(prev => ({ ...prev, table: true }));
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'notifications');
      
      if (error) {
        setNotificationsTable({ exists: false, error });
      } else {
        setNotificationsTable({ 
          exists: data && data.length > 0, 
          error: null 
        });
        
        // If table exists, fetch notifications
        if (data && data.length > 0) {
          fetchNotifications();
        }
      }
    } catch (err: any) {
      setNotificationsTable({ 
        exists: false, 
        error: err.message 
      });
    } finally {
      setLoading(prev => ({ ...prev, table: false }));
    }
  };

  const createNotificationsTable = async () => {
    setLoading(prev => ({ ...prev, create: true }));
    try {
      const { error } = await supabase.rpc('exec_sql', {
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
          
          CREATE POLICY "Users can delete their own notifications" 
          ON public.notifications FOR DELETE
          USING (auth.uid() = user_id);
          
          GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
        `
      });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          setError('The exec_sql function does not exist. Please contact an administrator to set up the notifications table.');
        } else {
          setError('Error creating notifications table: ' + error.message);
        }
      } else {
        // Check if table was created
        await checkNotificationsTable();
      }
    } catch (err: any) {
      setError('Exception creating table: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  const createTestNotification = async () => {
    setLoading(prev => ({ ...prev, create: true }));
    setCreationResult(null);
    
    try {
      if (!user) {
        setError('You must be logged in to create notifications');
        return;
      }
      
      const result = await createDirectNotification(
        user.id,
        testMessage,
        'test'
      );
      
      setCreationResult(result);
      
      // Refresh notifications list
      if (result) {
        await fetchNotifications();
      }
    } catch (err: any) {
      setError('Error creating test notification: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, fetch: true }));
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        setError('Error fetching notifications: ' + error.message);
      } else {
        setNotifications(data || []);
      }
    } catch (err: any) {
      setError('Exception fetching notifications: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Notifications Test & Setup</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
          <button 
            className="float-right"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}
      
      {/* User Status */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">User Status</h2>
        {loading.user ? (
          <p>Checking authentication...</p>
        ) : user ? (
          <div>
            <p className="text-green-600">✓ Logged in as: {user.email}</p>
            <p className="text-sm text-gray-600">User ID: {user.id}</p>
          </div>
        ) : (
          <p className="text-red-600">✗ Not logged in. Please log in to test notifications.</p>
        )}
      </div>
      
      {/* Notifications Table Status */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Notifications Table Status</h2>
        {loading.table ? (
          <p>Checking notifications table...</p>
        ) : (
          <div>
            {notificationsTable.exists ? (
              <p className="text-green-600">✓ Notifications table exists</p>
            ) : (
              <div>
                <p className="text-red-600 mb-2">✗ Notifications table does not exist</p>
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={createNotificationsTable}
                  disabled={loading.create}
                >
                  {loading.create ? 'Creating...' : 'Create Notifications Table'}
                </button>
              </div>
            )}
            {notificationsTable.error && (
              <p className="text-red-600 mt-2">Error: {JSON.stringify(notificationsTable.error)}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Create Test Notification */}
      {notificationsTable.exists && user && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <h2 className="text-lg font-semibold mb-2">Create Test Notification</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Notification Message:
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={createTestNotification}
            disabled={loading.create}
          >
            {loading.create ? 'Creating...' : 'Create Test Notification'}
          </button>
          
          {creationResult && (
            <div className="mt-4 p-2 bg-green-100 rounded">
              <p className="text-green-800">Notification created successfully!</p>
              <pre className="text-xs mt-2 overflow-auto max-h-24 bg-gray-100 p-2 rounded">
                {JSON.stringify(creationResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      
      {/* Existing Notifications */}
      {notificationsTable.exists && user && (
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Your Notifications</h2>
            <button
              className="text-blue-500 hover:text-blue-700"
              onClick={fetchNotifications}
              disabled={loading.fetch}
            >
              {loading.fetch ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          {loading.fetch ? (
            <p>Loading notifications...</p>
          ) : notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div key={notification.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-medium">{notification.content_snippet || `${notification.type} notification`}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(notification.created_at).toLocaleString()}
                    {notification.is_read && ' • Read'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No notifications found.</p>
          )}
        </div>
      )}
    </div>
  );
} 