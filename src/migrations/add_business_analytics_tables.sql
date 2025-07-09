-- Add business analytics tables

-- Table for tracking business analytics
CREATE TABLE IF NOT EXISTS business_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on business_id and date for faster queries
CREATE INDEX IF NOT EXISTS idx_business_analytics_business_id ON business_analytics(business_id);
CREATE INDEX IF NOT EXISTS idx_business_analytics_date ON business_analytics(date);

-- Table for tracking business favorites
CREATE TABLE IF NOT EXISTS business_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- Create index on business_id and user_id
CREATE INDEX IF NOT EXISTS idx_business_favorites_business_id ON business_favorites(business_id);
CREATE INDEX IF NOT EXISTS idx_business_favorites_user_id ON business_favorites(user_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_business_view(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO business_analytics (business_id, views)
  VALUES (p_business_id, 1)
  ON CONFLICT (business_id, date) 
  DO UPDATE SET views = business_analytics.views + 1, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to increment inquiry count
CREATE OR REPLACE FUNCTION increment_business_inquiry(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO business_analytics (business_id, inquiries)
  VALUES (p_business_id, 1)
  ON CONFLICT (business_id, date) 
  DO UPDATE SET inquiries = business_analytics.inquiries + 1, updated_at = NOW();
END;
$$ LANGUAGE plpgsql; 