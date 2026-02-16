/*
  # Fix Missing Inventory Limits Columns
  
  ## Query Description:
  This migration ensures the 'min_quantity' and 'max_quantity' columns exist in the 'products' table
  and forces a schema cache reload to resolve the PGRST204 error.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Table: products
  - Columns: min_quantity (int), max_quantity (int)
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_quantity INTEGER DEFAULT 100;

-- Force PostgREST schema cache reload to ensure the API recognizes the new columns immediately
NOTIFY pgrst, 'reload config';
