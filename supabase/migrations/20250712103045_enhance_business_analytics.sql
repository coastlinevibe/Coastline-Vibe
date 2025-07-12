-- Create table for business page views
CREATE TABLE IF NOT EXISTS business_page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  device_type TEXT NOT NULL,
  browser TEXT NOT NULL,
  os TEXT NOT NULL,
  country TEXT,
  region TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_business_page_views_business_id ON business_page_views(business_id);
CREATE INDEX IF NOT EXISTS idx_business_page_views_created_at ON business_page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_business_page_views_session_id ON business_page_views(session_id);

-- Create table for business interactions
CREATE TABLE IF NOT EXISTS business_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  element_id TEXT,
  page_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_business_interactions_business_id ON business_interactions(business_id);
CREATE INDEX IF NOT EXISTS idx_business_interactions_created_at ON business_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_business_interactions_type ON business_interactions(interaction_type);

-- Create function to track business page views
CREATE OR REPLACE FUNCTION track_business_page_view(
  p_business_id UUID,
  p_user_id UUID,
  p_session_id TEXT,
  p_page_path TEXT,
  p_referrer TEXT,
  p_device_type TEXT,
  p_browser TEXT,
  p_os TEXT,
  p_country TEXT,
  p_region TEXT,
  p_city TEXT
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO business_page_views (
    business_id, user_id, session_id, page_path, referrer,
    device_type, browser, os, country, region, city
  ) VALUES (
    p_business_id, p_user_id, p_session_id, p_page_path, p_referrer,
    p_device_type, p_browser, p_os, p_country, p_region, p_city
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track business interactions
CREATE OR REPLACE FUNCTION track_business_interaction(
  p_business_id UUID,
  p_user_id UUID,
  p_session_id TEXT,
  p_interaction_type TEXT,
  p_element_id TEXT,
  p_page_path TEXT
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO business_interactions (
    business_id, user_id, session_id, interaction_type, element_id, page_path
  ) VALUES (
    p_business_id, p_user_id, p_session_id, p_interaction_type, p_element_id, p_page_path
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get business analytics summary
CREATE OR REPLACE FUNCTION get_business_analytics_summary(
  p_business_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_prev_start_date DATE;
  v_prev_end_date DATE;
  v_current_views BIGINT;
  v_current_visitors BIGINT;
  v_current_inquiries BIGINT;
  v_current_favorites BIGINT;
  v_prev_views BIGINT;
  v_prev_visitors BIGINT;
  v_prev_inquiries BIGINT;
  v_prev_favorites BIGINT;
  v_views_change NUMERIC;
  v_visitors_change NUMERIC;
  v_inquiries_change NUMERIC;
  v_favorites_change NUMERIC;
BEGIN
  -- Calculate previous date range (same duration)
  v_prev_start_date := p_start_date - (p_end_date - p_start_date + 1);
  v_prev_end_date := p_start_date - 1;
  
  -- Current period metrics
  SELECT COUNT(*) INTO v_current_views
  FROM business_page_views
  WHERE business_id = p_business_id
    AND created_at::DATE BETWEEN p_start_date AND p_end_date;
  
  SELECT COUNT(DISTINCT session_id) INTO v_current_visitors
  FROM business_page_views
  WHERE business_id = p_business_id
    AND created_at::DATE BETWEEN p_start_date AND p_end_date;
  
  SELECT COUNT(*) INTO v_current_inquiries
  FROM business_interactions
  WHERE business_id = p_business_id
    AND interaction_type = 'inquiry'
    AND created_at::DATE BETWEEN p_start_date AND p_end_date;
  
  SELECT COUNT(*) INTO v_current_favorites
  FROM business_interactions
  WHERE business_id = p_business_id
    AND interaction_type = 'favorite'
    AND created_at::DATE BETWEEN p_start_date AND p_end_date;
  
  -- Previous period metrics
  SELECT COUNT(*) INTO v_prev_views
  FROM business_page_views
  WHERE business_id = p_business_id
    AND created_at::DATE BETWEEN v_prev_start_date AND v_prev_end_date;
  
  SELECT COUNT(DISTINCT session_id) INTO v_prev_visitors
  FROM business_page_views
  WHERE business_id = p_business_id
    AND created_at::DATE BETWEEN v_prev_start_date AND v_prev_end_date;
  
  SELECT COUNT(*) INTO v_prev_inquiries
  FROM business_interactions
  WHERE business_id = p_business_id
    AND interaction_type = 'inquiry'
    AND created_at::DATE BETWEEN v_prev_start_date AND v_prev_end_date;
  
  SELECT COUNT(*) INTO v_prev_favorites
  FROM business_interactions
  WHERE business_id = p_business_id
    AND interaction_type = 'favorite'
    AND created_at::DATE BETWEEN v_prev_start_date AND v_prev_end_date;
  
  -- Calculate percentage changes
  v_views_change := CASE 
    WHEN v_prev_views = 0 THEN 100
    ELSE ROUND(((v_current_views - v_prev_views)::NUMERIC / v_prev_views) * 100, 1)
  END;
  
  v_visitors_change := CASE 
    WHEN v_prev_visitors = 0 THEN 100
    ELSE ROUND(((v_current_visitors - v_prev_visitors)::NUMERIC / v_prev_visitors) * 100, 1)
  END;
  
  v_inquiries_change := CASE 
    WHEN v_prev_inquiries = 0 THEN 100
    ELSE ROUND(((v_current_inquiries - v_prev_inquiries)::NUMERIC / v_prev_inquiries) * 100, 1)
  END;
  
  v_favorites_change := CASE 
    WHEN v_prev_favorites = 0 THEN 100
    ELSE ROUND(((v_current_favorites - v_prev_favorites)::NUMERIC / v_prev_favorites) * 100, 1)
  END;
  
  -- Construct result JSON
  v_result := json_build_object(
    'totalViews', v_current_views,
    'uniqueVisitors', v_current_visitors,
    'totalInquiries', v_current_inquiries,
    'totalFavorites', v_current_favorites,
    'viewsChange', v_views_change,
    'visitorsChange', v_visitors_change,
    'inquiriesChange', v_inquiries_change,
    'favoritesChange', v_favorites_change
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get detailed visitor analytics
CREATE OR REPLACE FUNCTION get_business_visitor_analytics(
  p_business_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON AS $$
DECLARE
  v_daily_views JSON;
  v_device_types JSON;
  v_traffic_sources JSON;
  v_countries JSON;
  v_result JSON;
BEGIN
  -- Daily views and unique visitors
  SELECT json_agg(
    json_build_object(
      'date', date_trunc('day', created_at)::DATE,
      'views', COUNT(*),
      'uniqueVisitors', COUNT(DISTINCT session_id)
    )
  ) INTO v_daily_views
  FROM business_page_views
  WHERE business_id = p_business_id
    AND created_at::DATE BETWEEN p_start_date AND p_end_date
  GROUP BY date_trunc('day', created_at)::DATE
  ORDER BY date_trunc('day', created_at)::DATE;
  
  -- Device type breakdown
  SELECT json_agg(
    json_build_object(
      'device', device_type,
      'count', COUNT(*)
    )
  ) INTO v_device_types
  FROM business_page_views
  WHERE business_id = p_business_id
    AND created_at::DATE BETWEEN p_start_date AND p_end_date
  GROUP BY device_type
  ORDER BY COUNT(*) DESC;
  
  -- Traffic sources
  SELECT json_agg(
    json_build_object(
      'referrer', COALESCE(
        CASE 
          WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
          WHEN referrer LIKE '%google.com%' THEN 'Google'
          WHEN referrer LIKE '%facebook.com%' THEN 'Facebook'
          WHEN referrer LIKE '%instagram.com%' THEN 'Instagram'
          WHEN referrer LIKE '%twitter.com%' THEN 'Twitter'
          ELSE 'Other'
        END,
        'Direct'
      ),
      'count', COUNT(*)
    )
  ) INTO v_traffic_sources
  FROM business_page_views
  WHERE business_id = p_business_id
    AND created_at::DATE BETWEEN p_start_date AND p_end_date
  GROUP BY 
    CASE 
      WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
      WHEN referrer LIKE '%google.com%' THEN 'Google'
      WHEN referrer LIKE '%facebook.com%' THEN 'Facebook'
      WHEN referrer LIKE '%instagram.com%' THEN 'Instagram'
      WHEN referrer LIKE '%twitter.com%' THEN 'Twitter'
      ELSE 'Other'
    END
  ORDER BY COUNT(*) DESC;
  
  -- Countries
  SELECT json_agg(
    json_build_object(
      'country', COALESCE(country, 'Unknown'),
      'count', COUNT(*)
    )
  ) INTO v_countries
  FROM business_page_views
  WHERE business_id = p_business_id
    AND created_at::DATE BETWEEN p_start_date AND p_end_date
  GROUP BY country
  ORDER BY COUNT(*) DESC;
  
  -- Construct result JSON
  v_result := json_build_object(
    'dailyViews', COALESCE(v_daily_views, '[]'::JSON),
    'deviceTypes', COALESCE(v_device_types, '[]'::JSON),
    'trafficSources', COALESCE(v_traffic_sources, '[]'::JSON),
    'countries', COALESCE(v_countries, '[]'::JSON)
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on the tables
ALTER TABLE business_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for business_page_views
CREATE POLICY "Business owners can view their own page views"
  ON business_page_views
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Create policies for business_interactions
CREATE POLICY "Business owners can view their own interactions"
  ON business_interactions
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Insert sample data for testing
-- Uncomment and modify as needed for your development environment
/*
DO $$
DECLARE
  v_business_id UUID;
  v_user_id UUID;
  v_session_id TEXT;
  v_date DATE;
BEGIN
  -- Get a business ID (modify as needed)
  SELECT id INTO v_business_id FROM businesses LIMIT 1;
  
  -- Get a user ID (modify as needed)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- Only proceed if we have a business
  IF v_business_id IS NOT NULL THEN
    -- Create 100 sample page views over the last 30 days
    FOR i IN 1..100 LOOP
      v_session_id := uuid_generate_v4();
      v_date := CURRENT_DATE - (random() * 30)::INTEGER;
      
      INSERT INTO business_page_views (
        business_id, user_id, session_id, page_path, referrer,
        device_type, browser, os, country, region, city, created_at
      ) VALUES (
        v_business_id,
        CASE WHEN random() < 0.3 THEN v_user_id ELSE NULL END,
        v_session_id,
        CASE 
          WHEN random() < 0.5 THEN '/business/' || v_business_id
          WHEN random() < 0.3 THEN '/business/' || v_business_id || '/services'
          ELSE '/business/' || v_business_id || '/contact'
        END,
        CASE 
          WHEN random() < 0.4 THEN 'https://google.com'
          WHEN random() < 0.3 THEN 'https://facebook.com'
          WHEN random() < 0.2 THEN 'https://instagram.com'
          ELSE NULL
        END,
        CASE 
          WHEN random() < 0.6 THEN 'mobile'
          WHEN random() < 0.3 THEN 'desktop'
          ELSE 'tablet'
        END,
        CASE 
          WHEN random() < 0.5 THEN 'Chrome'
          WHEN random() < 0.3 THEN 'Safari'
          ELSE 'Firefox'
        END,
        CASE 
          WHEN random() < 0.5 THEN 'iOS'
          WHEN random() < 0.3 THEN 'Android'
          ELSE 'Windows'
        END,
        CASE 
          WHEN random() < 0.7 THEN 'Vietnam'
          WHEN random() < 0.2 THEN 'USA'
          ELSE 'Australia'
        END,
        NULL,
        NULL,
        v_date + (random() * 86400)::INTEGER * INTERVAL '1 second'
      );
      
      -- Add some interactions for this session
      IF random() < 0.3 THEN
        INSERT INTO business_interactions (
          business_id, user_id, session_id, interaction_type, element_id, page_path, created_at
        ) VALUES (
          v_business_id,
          CASE WHEN random() < 0.3 THEN v_user_id ELSE NULL END,
          v_session_id,
          CASE 
            WHEN random() < 0.4 THEN 'inquiry'
            WHEN random() < 0.3 THEN 'favorite'
            WHEN random() < 0.2 THEN 'call'
            ELSE 'click'
          END,
          CASE 
            WHEN random() < 0.5 THEN 'contact-button'
            WHEN random() < 0.3 THEN 'favorite-button'
            ELSE 'service-link'
          END,
          CASE 
            WHEN random() < 0.5 THEN '/business/' || v_business_id
            WHEN random() < 0.3 THEN '/business/' || v_business_id || '/services'
            ELSE '/business/' || v_business_id || '/contact'
          END,
          v_date + (random() * 86400)::INTEGER * INTERVAL '1 second'
        );
      END IF;
    END LOOP;
  END IF;
END $$;
*/ 