/*
  # Add Cost Column to Movements
  
  1. Changes
    - Add 'cost' column to 'movements' table if it doesn't exist.
    - Reload PostgREST config to fix PGRST204 error.
  
  2. Security
    - Safe operation (IF NOT EXISTS).
*/

-- 1. Add the missing 'cost' column to the movements table
ALTER TABLE movements 
ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;

-- 2. Force the PostgREST API to refresh its schema cache
-- This resolves the PGRST204 error immediately
NOTIFY pgrst, 'reload config';
