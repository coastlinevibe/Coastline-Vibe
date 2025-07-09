-- Create business_favorites table
CREATE TABLE IF NOT EXISTS business_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- Add RLS policies
ALTER TABLE business_favorites ENABLE ROW LEVEL SECURITY;

-- Policy for inserting favorites (users can add their own favorites)
CREATE POLICY insert_own_favorites ON business_favorites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for selecting favorites (users can see their own favorites)
CREATE POLICY select_own_favorites ON business_favorites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Policy for deleting favorites (users can delete their own favorites)
CREATE POLICY delete_own_favorites ON business_favorites
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX business_favorites_user_id_idx ON business_favorites(user_id);
CREATE INDEX business_favorites_business_id_idx ON business_favorites(business_id);
CREATE INDEX business_favorites_community_id_idx ON business_favorites(community_id); 