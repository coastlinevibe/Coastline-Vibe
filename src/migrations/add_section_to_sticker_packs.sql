-- Add section column to sticker_packs table
ALTER TABLE sticker_packs ADD COLUMN IF NOT EXISTS section TEXT;

-- Update indices to include section field
CREATE INDEX IF NOT EXISTS idx_sticker_packs_section ON sticker_packs(section);
 
-- Create a composite index for faster lookup by community_id and section
CREATE INDEX IF NOT EXISTS idx_sticker_packs_community_section ON sticker_packs(community_id, section); 