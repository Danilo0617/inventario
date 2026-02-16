/*
  # Agregar Cantidad Mínima a Productos

  ## Query Description:
  Agrega la columna 'min_quantity' a la tabla 'products' para permitir alertas de stock bajo.
  Se establece un valor por defecto de 5 unidades.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: products
  - Column: min_quantity (INTEGER, DEFAULT 5)
*/

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 5;
