/*
  # Inicialización del Esquema de Inventario DaymStock

  ## Descripción
  Crea las tablas necesarias para el sistema de inventario y configura la lógica automática de stock.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  1. products: Catálogo de productos
  2. movements: Historial de entradas y salidas
  3. app_users: Gestión de usuarios personalizada para la app
*/

-- 1. Tabla de Productos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity NUMERIC DEFAULT 0,
    height NUMERIC DEFAULT 0,
    width NUMERIC DEFAULT 0,
    area NUMERIC DEFAULT 0,
    cost NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Movimientos
CREATE TABLE IF NOT EXISTS public.movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL, -- 'Ingreso', 'Salida', 'Edición'
    product_id UUID REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    warehouse TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Usuarios de la Aplicación
-- Nota: Usamos una tabla personalizada para cumplir con el requerimiento de que el Admin pueda crear y ver usuarios fácilmente.
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL DEFAULT '123456', -- Contraseña por defecto
    role TEXT NOT NULL, -- 'Admon', 'Empleado', 'Lector'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Función y Trigger para Actualizar Stock Automáticamente
CREATE OR REPLACE FUNCTION update_stock_after_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'Ingreso' THEN
        UPDATE public.products 
        SET quantity = quantity + NEW.quantity 
        WHERE id = NEW.product_id;
    ELSIF NEW.type = 'Salida' THEN
        UPDATE public.products 
        SET quantity = quantity - NEW.quantity 
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_stock ON public.movements;

CREATE TRIGGER tr_update_stock
AFTER INSERT ON public.movements
FOR EACH ROW
EXECUTE FUNCTION update_stock_after_movement();

-- 5. Datos Semilla (Usuario Admin por defecto)
INSERT INTO public.app_users (name, email, password, role)
VALUES ('Administrador', 'admin@daymstock.com', '123456', 'Admon')
ON CONFLICT (email) DO NOTHING;

-- Habilitar RLS (Seguridad) pero permitir acceso público para este prototipo
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total a productos" ON public.products FOR ALL USING (true);
CREATE POLICY "Acceso total a movimientos" ON public.movements FOR ALL USING (true);
CREATE POLICY "Acceso total a usuarios" ON public.app_users FOR ALL USING (true);
