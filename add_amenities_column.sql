-- Add amenities column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;

-- Add missing columns to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS meta_tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_types JSONB DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS menu_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{}'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS video_provider TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS menu_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS menu_price TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS menu_image_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS featured_type TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS name TEXT;

-- Update columns if they are the wrong type
ALTER TABLE businesses ALTER COLUMN amenities TYPE JSONB USING COALESCE(amenities, '[]')::jsonb;
ALTER TABLE businesses ALTER COLUMN tags TYPE JSONB USING COALESCE(tags, '[]')::jsonb;
ALTER TABLE businesses ALTER COLUMN meta_tags TYPE JSONB USING COALESCE(meta_tags, '[]')::jsonb;
ALTER TABLE businesses ALTER COLUMN business_types TYPE JSONB USING COALESCE(business_types, '[]')::jsonb;
ALTER TABLE businesses ALTER COLUMN menu_items TYPE JSONB USING COALESCE(menu_items, '[]')::jsonb;
ALTER TABLE businesses ALTER COLUMN gallery_urls TYPE JSONB USING COALESCE(gallery_urls, '[]')::jsonb;
ALTER TABLE businesses ALTER COLUMN schedule TYPE JSONB USING COALESCE(schedule, '{}')::jsonb;
