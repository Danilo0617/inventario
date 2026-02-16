-- 1. Asegurar que existen las columnas de límites de inventario
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_quantity INTEGER DEFAULT 100;

-- 2. Eliminar la columna color ya que el usuario solicitó quitarla
ALTER TABLE products DROP COLUMN IF EXISTS color;

-- 3. Forzar la recarga de la configuración de la API (Solución para PGRST204)
NOTIFY pgrst, 'reload config';
