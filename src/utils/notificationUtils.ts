import { createClient } from '@/lib/supabase/client';

/**
 * Ensure the notifications table exists
 */
export const ensureNotificationsTable = async () => {
  const supabase = createClient();
  
  try {
    // Check if table exists first
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notifications');
    
    if (!data || data.length === 0) {
      console.log('Notifications table does not exist, creating it now...');
      
      // Create the table
      const { error: createError } = await supabase.rpc('exec_sql', {
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
      
      if (createError) {
        console.error('Failed to create notifications table:', createError);
        return false;
      }
      
      console.log('Notifications table created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error in ensureNotificationsTable:', error);
    return false;
  }
};

/**
 * Alternative notification function that uses direct inserts with less validation
 * @param userId The ID of the user to receive the notification
 * @param message The notification message
 * @param type The type of notification
 * @returns The created notification or null if there was an error
 */
export const createDirectNotification = async (
  userId: string,
  message: string,
  type: string = 'system'
) => {
  const supabase = createClient();

  try {
    console.log(`Creating direct ${type} notification for user ${userId}: ${message}`);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type,
        content_snippet: message,
        is_read: false
      })
      .select();

    if (error) {
      console.error('Error creating direct notification:', error);
      return null;
    }

    console.log('Direct notification created successfully', data);
    return data;
  } catch (error) {
    console.error('Exception in createDirectNotification:', error);
    return null;
  }
};

/**
 * Create a notification for a user
 * @param userId The ID of the user to receive the notification
 * @param actorUserId The ID of the user who triggered the notification (can be null for system notifications)
 * @param communityId The ID of the community this notification is associated with (can be null)
 * @param type The type of notification (e.g., 'post_like', 'comment', 'mention')
 * @param targetEntityType The type of entity this notification relates to (e.g., 'posts', 'comments')
 * @param targetEntityId The ID of the specific entity this notification relates to
 * @param contentSnippet A short message or preview for the notification
 * @returns The created notification or null if there was an error
 */
export const createNotification = async (
  userId: string,
  actorUserId: string | null,
  communityId: string | null,
  type: string,
  targetEntityType: string | null,
  targetEntityId: string | null,
  contentSnippet: string | null
) => {
  const supabase = createClient();

  // Don't create notification if the actor is the same as the recipient
  if (actorUserId === userId) {
    return null;
  }

  try {
    // Insert the notification
    console.log(`Creating ${type} notification for user ${userId}`);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        actor_user_id: actorUserId,
        community_id: communityId,
        type,
        target_entity_type: targetEntityType,
        target_entity_id: targetEntityId,
        content_snippet: contentSnippet,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      
      // Try fallback direct notification
      return createDirectNotification(userId, contentSnippet || `You have a new ${type} notification`, type);
    }

    console.log('Notification created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createNotification:', error);
    
    // Try fallback direct notification
    return createDirectNotification(userId, contentSnippet || `You have a new ${type} notification`, type);
  }
};

/**
 * Create a post like notification
 * @param postOwnerId The ID of the post owner
 * @param actorUserId The ID of the user who liked the post
 * @param postId The ID of the post that was liked
 * @param communityId The ID of the community
 * @param actorUsername The username of the actor
 * @returns The created notification or null if there was an error
 */
export const createPostLikeNotification = async (
  postOwnerId: string,
  actorUserId: string,
  postId: string,
  communityId: string,
  actorUsername: string
) => {
  console.log(`Creating post like notification: ${actorUsername} liked a post`);
  
  // Try to ensure notification table exists first
  await ensureNotificationsTable();
  
  // First try the standard method
  const result = await createNotification(
    postOwnerId,
    actorUserId,
    communityId,
    'post_like',
    'posts',
    postId,
    `${actorUsername} liked your post.`
  );
  
  if (result) return result;
  
  // If that failed, try direct notification as fallback
  return createDirectNotification(
    postOwnerId,
    `${actorUsername} liked your post.`,
    'post_like'
  );
};

/**
 * Create a comment notification
 * @param postOwnerId The ID of the post owner
 * @param actorUserId The ID of the user who commented
 * @param postId The ID of the post that was commented on
 * @param communityId The ID of the community
 * @param actorUsername The username of the actor
 * @returns The created notification or null if there was an error
 */
export const createCommentNotification = async (
  postOwnerId: string,
  actorUserId: string,
  postId: string,
  communityId: string,
  actorUsername: string
) => {
  console.log(`Creating comment notification: ${actorUsername} commented on a post`);
  
  // Try to ensure notification table exists first
  await ensureNotificationsTable();
  
  // First try the standard method
  const result = await createNotification(
    postOwnerId,
    actorUserId,
    communityId,
    'comment',
    'posts',
    postId,
    `${actorUsername} commented on your post.`
  );
  
  if (result) return result;
  
  // If that failed, try direct notification as fallback
  return createDirectNotification(
    postOwnerId,
    `${actorUsername} commented on your post.`,
    'comment'
  );
};

/**
 * Create a poll vote notification
 * @param pollOwnerId The ID of the poll owner
 * @param actorUserId The ID of the user who voted on the poll
 * @param pollId The ID of the poll that was voted on
 * @param postId The ID of the post containing the poll
 * @param communityId The ID of the community
 * @param actorUsername The username of the actor
 * @returns The created notification or null if there was an error
 */
export const createPollVoteNotification = async (
  pollOwnerId: string,
  actorUserId: string,
  pollId: string,
  postId: string,
  communityId: string,
  actorUsername: string
) => {
  console.log(`Creating poll vote notification: ${actorUsername} voted on a poll`);
  
  // Try to ensure notification table exists first
  await ensureNotificationsTable();
  
  // First try the standard method
  const result = await createNotification(
    pollOwnerId,
    actorUserId,
    communityId,
    'poll',
    'posts',
    postId,
    `${actorUsername} voted on your poll.`,
  );
  
  if (result) return result;
  
  // If that failed, try direct notification as fallback
  return createDirectNotification(
    pollOwnerId,
    `${actorUsername} voted on your poll.`,
    'poll'
  );
}; 

/**
 * Create an RSVP notification
 * @param eventOwnerId The ID of the event owner
 * @param actorUserId The ID of the user who RSVPed to the event
 * @param eventId The ID of the event
 * @param communityId The ID of the community
 * @param actorUsername The username of the actor
 * @param rsvpStatus The RSVP status ('yes', 'no', or 'maybe')
 * @returns The created notification or null if there was an error
 */
export const createRsvpNotification = async (
  eventOwnerId: string,
  actorUserId: string,
  eventId: string,
  communityId: string,
  actorUsername: string,
  rsvpStatus: 'yes' | 'no' | 'maybe'
) => {
  console.log(`Creating RSVP notification: ${actorUsername} RSVP'd ${rsvpStatus} to your event`);
  await ensureNotificationsTable();
  const result = await createNotification(
    eventOwnerId,
    actorUserId,
    communityId,
    'rsvp',
    'events',
    eventId,
    `${actorUsername} RSVP'd "${rsvpStatus}" to your event.`
  );
  if (result) return result;
  return createDirectNotification(
    eventOwnerId,
    `${actorUsername} RSVP'd "${rsvpStatus}" to your event.`,
    'rsvp'
  );
}; 