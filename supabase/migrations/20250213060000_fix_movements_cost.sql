/*
  # Agregar columna de Costo a Movimientos
  
  Este script corrige el error PGRST204 asegurando que la tabla 'movements'
  tenga la columna 'cost' para registrar el valor monetario de los ingresos.

  1. Cambios en Tabla:
     - Agrega columna 'cost' (NUMERIC) con valor por defecto 0.
  
  2. Configuración:
     - Recarga la caché de la API (NOTIFY pgrst) para reconocer el cambio inmediatamente.
*/

-- 1. Agregar la columna cost si no existe
ALTER TABLE movements 
ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;

-- 2. Forzar la recarga de la caché del esquema de API
NOTIFY pgrst, 'reload config';
