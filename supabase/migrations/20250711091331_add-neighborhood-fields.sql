-- Add neighborhood_id and district columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS neighborhood_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS district VARCHAR(255);

-- Create an index on neighborhood_id for faster queries
CREATE INDEX IF NOT EXISTS idx_businesses_neighborhood_id ON businesses(neighborhood_id);

-- Create an index on district for faster queries
CREATE INDEX IF NOT EXISTS idx_businesses_district ON businesses(district);

-- Add comment to explain the columns
COMMENT ON COLUMN businesses.neighborhood_id IS 'Identifier for the neighborhood based on Da Nang neighborhood data';
COMMENT ON COLUMN businesses.district IS 'Administrative district in Da Nang';

-- Update existing businesses with neighborhood data where possible
-- This is a placeholder - in a real implementation, you would write a script to match existing 
-- neighborhood values to the new neighborhood_id values
