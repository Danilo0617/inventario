/*
  # Fix Missing Columns & Reload Schema Cache
  
  Este script asegura que las columnas de reglas de stock existan y fuerza
  a la API a reconocerlas para solucionar el error PGRST204.

  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Asegurar que existan las columnas de cantidad mínima y máxima
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_quantity integer DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_quantity integer DEFAULT 100;

-- 2. Asegurar que exista la columna de color (por si acaso)
ALTER TABLE products ADD COLUMN IF NOT EXISTS color text;

-- 3. CRÍTICO: Forzar la recarga de la caché del esquema de PostgREST (API)
-- Esto soluciona el error "Could not find the column in the schema cache"
NOTIFY pgrst, 'reload config';
