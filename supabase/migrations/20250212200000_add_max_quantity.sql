/*
  # Agregar Stock Máximo para Reglas de Inventario
  
  ## Cambios
  1. Agregar columna `max_quantity` a la tabla `products`.
  2. Establecer un valor por defecto (ej. 100) para registros existentes.
*/

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS max_quantity NUMERIC DEFAULT 100;

-- Comentario para documentación
COMMENT ON COLUMN products.max_quantity IS 'Cantidad máxima ideal para calcular el estado Medio/Alto del inventario';
