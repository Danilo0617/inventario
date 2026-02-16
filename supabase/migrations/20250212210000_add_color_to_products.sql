/*
  # Agregar columna Color a Productos
  
  ## Cambios
  - Se agrega la columna 'color' (texto) a la tabla 'products'.
  - Es opcional (nullable) para no romper registros existentes.
*/

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS color text;
