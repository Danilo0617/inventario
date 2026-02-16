/*
  # Agregar dimensiones a la tabla de movimientos
  
  ## Query Description:
  Agrega las columnas 'height' (alto) y 'width' (ancho) a la tabla 'movements' para permitir el registro detallado de inventario por medidas (ej. planchas de mármol).

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Table: movements
  - New Columns: 
    - height (numeric, nullable)
    - width (numeric, nullable)
*/

ALTER TABLE public.movements 
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS width numeric;
