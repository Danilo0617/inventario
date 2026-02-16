/*
  # Agregar Costo a Movimientos
  
  Agrega la columna 'cost' a la tabla de movimientos para registrar
  el valor monetario al momento del ingreso.

  ## Cambios
  - Alterar tabla 'movements': agregar columna 'cost' (numeric)
*/

ALTER TABLE public.movements 
ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0;
