-- Add indexes to improve performance and fix foreign key constraints

-- Add index on business_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'businesses' AND indexname = 'businesses_id_idx'
    ) THEN
        CREATE INDEX businesses_id_idx ON businesses(id);
    END IF;
    
    -- Add index on user_id in businesses table
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'businesses' AND indexname = 'businesses_user_id_idx'
    ) THEN
        CREATE INDEX businesses_user_id_idx ON businesses(user_id);
    END IF;
    
    -- Add index on community_id in businesses table
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'businesses' AND indexname = 'businesses_community_id_idx'
    ) THEN
        CREATE INDEX businesses_community_id_idx ON businesses(community_id);
    END IF;
    
    -- Add index on category_id in businesses table
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'businesses' AND indexname = 'businesses_category_id_idx'
    ) THEN
        CREATE INDEX businesses_category_id_idx ON businesses(category_id);
    END IF;
    
    -- Add index on subcategory_id in businesses table
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'businesses' AND indexname = 'businesses_subcategory_id_idx'
    ) THEN
        CREATE INDEX businesses_subcategory_id_idx ON businesses(subcategory_id);
    END IF;
END
$$; 