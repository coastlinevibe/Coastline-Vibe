export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at?: string;
          updated_at?: string;
          username: string;
          email: string;
          avatar_url?: string;
          role?: string;
          is_approved?: boolean;
          is_admin?: boolean;
          community_id?: string;
          approval_status?: 'pending' | 'approved' | 'declined';
        };
      };
      posts: {
        Row: {
          id: string;
          created_at?: string;
          user_id: string;
          content: string;
          community_id: string;
        };
      };
      feed_post_likes: {
        Row: {
          id: string;
          created_at?: string;
          user_id: string;
          post_id: string;
        };
      };
    };
    Views: {
      community_feed_view: {
        Row: {
          id: string;
          created_at?: string;
          content: string;
          user_id: string;
          community_id: string;
          username?: string;
          avatar_url?: string;
          like_count?: number;
        };
      };
    };
  };
};
