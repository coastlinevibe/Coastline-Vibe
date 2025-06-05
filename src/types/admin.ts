export interface LocationVerificationRequest {
  id: string; // request id
  user_id: string;
  address_line1: string;
  city: string;
  postal_code: string;
  country: string;
  status: string;
  created_at: string;
  // from profiles table
  username?: string;
  email?: string;
  avatar_url?: string | null;
}

export type VerificationRequestWithProfile = {
  id: string;
  user_id: string;
  address_line1: string;
  city: string;
  postal_code: string;
  country: string;
  status: string;
  created_at: string;
  profile: {
    username?: string;
    email?: string;
    avatar_url?: string | null;
  } | null; 
}; 