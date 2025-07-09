--Migration file

-- Add facilities and related columns to the businesses table if they don't exist
DO $$
BEGIN
    -- Check if facilities column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'facilities'
    ) THEN
        ALTER TABLE businesses ADD COLUMN facilities JSONB DEFAULT '[]'::JSONB;
    END IF;

    -- Check if facility_hours column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'facility_hours'
    ) THEN
        ALTER TABLE businesses ADD COLUMN facility_hours JSONB DEFAULT '{}'::JSONB;
    END IF;
    
    -- Add other columns used in the BusinessMultiStepForm if they don't exist
    
    -- Basic info
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'featured_type'
    ) THEN
        ALTER TABLE businesses ADD COLUMN featured_type TEXT;
    END IF;
    
    -- Amenities
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'amenities'
    ) THEN
        ALTER TABLE businesses ADD COLUMN amenities JSONB DEFAULT '[]'::JSONB;
    END IF;
    
    -- Location
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'neighborhood'
    ) THEN
        ALTER TABLE businesses ADD COLUMN neighborhood TEXT;
    END IF;
    
    -- Media
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'video_provider'
    ) THEN
        ALTER TABLE businesses ADD COLUMN video_provider TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'video_url'
    ) THEN
        ALTER TABLE businesses ADD COLUMN video_url TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'thumbnail_url'
    ) THEN
        ALTER TABLE businesses ADD COLUMN thumbnail_url TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'cover_url'
    ) THEN
        ALTER TABLE businesses ADD COLUMN cover_url TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'gallery_urls'
    ) THEN
        ALTER TABLE businesses ADD COLUMN gallery_urls JSONB DEFAULT '[]'::JSONB;
    END IF;
    
    -- SEO
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'tags'
    ) THEN
        ALTER TABLE businesses ADD COLUMN tags JSONB DEFAULT '[]'::JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'meta_tags'
    ) THEN
        ALTER TABLE businesses ADD COLUMN meta_tags JSONB DEFAULT '[]'::JSONB;
    END IF;
    
    -- Schedule
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'schedule'
    ) THEN
        ALTER TABLE businesses ADD COLUMN schedule JSONB DEFAULT '{}'::JSONB;
    END IF;
    
    -- Contact
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'contact_email'
    ) THEN
        ALTER TABLE businesses ADD COLUMN contact_email TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'contact_phone'
    ) THEN
        ALTER TABLE businesses ADD COLUMN contact_phone TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'website'
    ) THEN
        ALTER TABLE businesses ADD COLUMN website TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'social_facebook'
    ) THEN
        ALTER TABLE businesses ADD COLUMN social_facebook TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'social_twitter'
    ) THEN
        ALTER TABLE businesses ADD COLUMN social_twitter TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'social_linkedin'
    ) THEN
        ALTER TABLE businesses ADD COLUMN social_linkedin TEXT;
    END IF;
    
    -- Business Type
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'business_types'
    ) THEN
        ALTER TABLE businesses ADD COLUMN business_types JSONB DEFAULT '[]'::JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'menu_name'
    ) THEN
        ALTER TABLE businesses ADD COLUMN menu_name TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'menu_price'
    ) THEN
        ALTER TABLE businesses ADD COLUMN menu_price TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'menu_items'
    ) THEN
        ALTER TABLE businesses ADD COLUMN menu_items JSONB DEFAULT '[]'::JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'menu_image_url'
    ) THEN
        ALTER TABLE businesses ADD COLUMN menu_image_url TEXT;
    END IF;
    
    -- Timestamps
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'submitted_at'
    ) THEN
        ALTER TABLE businesses ADD COLUMN submitted_at TIMESTAMPTZ;
    END IF;
END
$$;