-- 1. Ensure all required columns exist in the products table with correct defaults
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_quantity INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '';

-- 2. CRITICAL: Force the PostgREST API to refresh its schema cache
-- This resolves the PGRST204 error by making the API recognize the new columns immediately
NOTIFY pgrst, 'reload config';
