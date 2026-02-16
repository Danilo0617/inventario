-- Asegurar que la columna 'color' exista en la tabla products
ALTER TABLE products ADD COLUMN IF NOT EXISTS color text;

-- Notificar a PostgREST para recargar el esquema de caché (corrige el error PGRST204)
NOTIFY pgrst, 'reload config';
