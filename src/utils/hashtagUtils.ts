/**
 * Extract hashtags from text content
 * @param content - The text content to extract hashtags from
 * @returns Array of hashtags without the # symbol
 */
export const extractHashtags = (content: string): string[] => {
  if (!content) return [];
  
  // Match hashtags using regex
  // This matches words that start with # and contain letters, numbers, or underscores
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex);
  
  if (!matches) return [];
  
  // Remove the # symbol and return unique hashtags
  return [...new Set(matches.map(tag => tag.substring(1)))];
};

/**
 * Split content by hashtags for highlighting
 * @param content - The text content to split by hashtags
 * @returns Array of parts where each part is either a hashtag or regular text
 */
export const splitContentByHashtags = (content: string): { text: string; isHashtag: boolean }[] => {
  if (!content) return [];
  
  // Split the content by hashtags
  const parts = content.split(/(#\w+)/g);
  
  return parts.map(part => ({
    text: part,
    isHashtag: part.startsWith('#')
  }));
};

/**
 * Find popular hashtags from an array of posts
 * @param posts - Array of posts to extract hashtags from
 * @param limit - Maximum number of hashtags to return
 * @returns Array of most frequently used hashtags
 */
export const findPopularHashtags = (
  posts: Array<{ content: string }>,
  limit: number = 5
): string[] => {
  if (!posts || posts.length === 0) return [];
  
  // Extract all hashtags from all posts
  const allHashtags = posts
    .filter(post => post.content)
    .flatMap(post => extractHashtags(post.content));
  
  // Count occurrences of each hashtag
  const hashtagCounts: Record<string, number> = {};
  allHashtags.forEach(tag => {
    hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
  });
  
  // Sort hashtags by frequency
  return Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}; 