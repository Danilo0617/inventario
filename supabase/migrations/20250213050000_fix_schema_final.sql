-- 1. Asegurar que existan las columnas de límites de inventario
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_quantity INTEGER DEFAULT 100;

-- 2. Eliminar la columna color para coincidir con el frontend
ALTER TABLE products DROP COLUMN IF EXISTS color;

-- 3. Forzar la recarga de la caché del esquema de la API (Soluciona error PGRST204)
NOTIFY pgrst, 'reload config';
