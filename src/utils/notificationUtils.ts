import { createClient } from '@/lib/supabase/client';

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
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return null;
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
  return createNotification(
    postOwnerId,
    actorUserId,
    communityId,
    'post_like',
    'posts',
    postId,
    `${actorUsername} liked your post.`
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
  return createNotification(
    postOwnerId,
    actorUserId,
    communityId,
    'comment',
    'posts',
    postId,
    `${actorUsername} commented on your post.`
  );
};

/**
 * Create a mention notification
 * @param mentionedUserId The ID of the user who was mentioned
 * @param actorUserId The ID of the user who mentioned them
 * @param postId The ID of the post where the mention occurred
 * @param communityId The ID of the community
 * @param actorUsername The username of the actor
 * @param isComment Whether the mention occurred in a comment
 * @returns The created notification or null if there was an error
 */
export const createMentionNotification = async (
  mentionedUserId: string,
  actorUserId: string,
  postId: string,
  communityId: string,
  actorUsername: string,
  isComment: boolean = false
) => {
  return createNotification(
    mentionedUserId,
    actorUserId,
    communityId,
    'mention',
    'posts',
    postId,
    `${actorUsername} mentioned you in a ${isComment ? 'comment' : 'post'}.`
  );
}; 