/*
  # Corrección de Esquema: Límites de Inventario
  
  Este script soluciona el error PGRST204 asegurando que las columnas
  de límites de inventario existan y forzando la recarga de la caché de la API.

  ## Cambios:
  1. Agrega columnas min_quantity y max_quantity si no existen.
  2. Fuerza la recarga de la configuración de PostgREST.
*/

-- 1. Asegurar que las columnas existan con valores por defecto
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 5;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS max_quantity INTEGER DEFAULT 100;

-- 2. CRÍTICO: Forzar a la API a reconocer los cambios inmediatamente
-- Esto soluciona el error "Could not find the ... column ... in the schema cache"
NOTIFY pgrst, 'reload config';
