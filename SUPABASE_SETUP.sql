-- ═══════════════════════════════════════════════════════════════════
-- KreditPlus — Setup Completo de Base de Datos v2
-- Incluye: solicitudes, contactos, asesores, notas de seguimiento
-- ═══════════════════════════════════════════════════════════════════
-- Instrucciones:
-- 1. Ve a tu proyecto en https://supabase.com
-- 2. Haz clic en "SQL Editor" en el menú lateral
-- 3. Pega todo este archivo y haz clic en "Run"
-- ═══════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════

-- ─── 0. LIMPIEZA DE ESTRUCTURA ANTERIOR (Evita errores) ───────────
DROP TABLE IF EXISTS kreditplus_notas CASCADE;
DROP TABLE IF EXISTS kreditplus_contactos CASCADE;
DROP TABLE IF EXISTS kreditplus_solicitudes CASCADE;
DROP TABLE IF EXISTS kreditplus_asesores CASCADE;

-- ─── 1. TABLA ASESORES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kreditplus_asesores (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  nombre      TEXT         NOT NULL,
  email       TEXT         UNIQUE NOT NULL,
  celular     TEXT,
  zona        TEXT,        -- Bogotá, Medellín, Cali, etc.
  activo      BOOLEAN      DEFAULT true,
  clave       TEXT         DEFAULT 'asesor2024', -- clave de acceso al panel asesor
  notas_admin TEXT,        -- notas internas del admin sobre este asesor
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── 2. TABLA SOLICITUDES (actualizada) ───────────────────────────
CREATE TABLE IF NOT EXISTS kreditplus_solicitudes (
  id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  tipo_credito TEXT,
  monto        TEXT,
  nombre       TEXT         NOT NULL,
  cedula       TEXT,
  email        TEXT,
  celular      TEXT         NOT NULL,
  ciudad       TEXT,
  ocupacion    TEXT,
  estado       TEXT         DEFAULT 'nuevo'
                            CHECK (estado IN ('nuevo','asignado','contactado','en_estudio',
                                              'documentacion','aprobado','desembolsado',
                                              'rechazado','en_espera','cerrado')),
  asesor_id    UUID         REFERENCES kreditplus_asesores(id) ON DELETE SET NULL,
  prioridad    TEXT         DEFAULT 'normal'
                            CHECK (prioridad IN ('baja','normal','alta','urgente')),
  notas        TEXT,
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── 3. TABLA CONTACTOS (actualizada) ────────────────────────────
CREATE TABLE IF NOT EXISTS kreditplus_contactos (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  nombre         TEXT         NOT NULL,
  email          TEXT,
  telefono       TEXT,
  tipo_solicitud TEXT,
  mensaje        TEXT,
  estado         TEXT         DEFAULT 'nuevo'
                              CHECK (estado IN ('nuevo','asignado','en_gestion',
                                                'resuelto','cerrado')),
  asesor_id      UUID         REFERENCES kreditplus_asesores(id) ON DELETE SET NULL,
  notas          TEXT,
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── 4. TABLA NOTAS / SEGUIMIENTO ────────────────────────────────
CREATE TABLE IF NOT EXISTS kreditplus_notas (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  solicitud_id   UUID         REFERENCES kreditplus_solicitudes(id) ON DELETE CASCADE,
  contacto_id    UUID         REFERENCES kreditplus_contactos(id) ON DELETE CASCADE,
  asesor_id      UUID         REFERENCES kreditplus_asesores(id) ON DELETE SET NULL,
  asesor_nombre  TEXT,
  nota           TEXT         NOT NULL,
  tipo           TEXT         DEFAULT 'seguimiento'
                              CHECK (tipo IN ('seguimiento','llamada','whatsapp',
                                             'documento','visita','aprobacion','rechazo'))
);

-- ─── 5. RLS (Row Level Security) ─────────────────────────────────
ALTER TABLE kreditplus_asesores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE kreditplus_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kreditplus_contactos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kreditplus_notas       ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para anon (ajustar a roles en producción real)
CREATE POLICY "anon_all_asesores"
  ON kreditplus_asesores FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_insert_solicitudes"
  ON kreditplus_solicitudes FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_solicitudes"
  ON kreditplus_solicitudes FOR SELECT TO anon USING (true);

CREATE POLICY "anon_update_solicitudes"
  ON kreditplus_solicitudes FOR UPDATE TO anon USING (true);

CREATE POLICY "anon_insert_contactos"
  ON kreditplus_contactos FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_contactos"
  ON kreditplus_contactos FOR SELECT TO anon USING (true);

CREATE POLICY "anon_update_contactos"
  ON kreditplus_contactos FOR UPDATE TO anon USING (true);

CREATE POLICY "anon_all_notas"
  ON kreditplus_notas FOR ALL TO anon USING (true) WITH CHECK (true);

-- ─── 6. TRIGGERS updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_asesores_upd') THEN
    CREATE TRIGGER trg_asesores_upd BEFORE UPDATE ON kreditplus_asesores
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_solicitudes_upd') THEN
    CREATE TRIGGER trg_solicitudes_upd BEFORE UPDATE ON kreditplus_solicitudes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contactos_upd') THEN
    CREATE TRIGGER trg_contactos_upd BEFORE UPDATE ON kreditplus_contactos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── 7. DATOS DE EJEMPLO ─────────────────────────────────────────
INSERT INTO kreditplus_asesores (nombre, email, celular, zona, clave) VALUES
  ('Valentina Ríos',    'v.rios@kreditplus.co',    '310 900 1001', 'Bogotá',    'val2024'),
  ('Santiago Morales',  's.morales@kreditplus.co', '311 900 1002', 'Medellín',  'santi24'),
  ('Camila Herrera',    'c.herrera@kreditplus.co', '312 900 1003', 'Cali',      'cami24')
ON CONFLICT (email) DO NOTHING;

INSERT INTO kreditplus_solicitudes (tipo_credito, monto, nombre, celular, ciudad, estado) VALUES
  ('Crédito personal',    'Hasta $3.000.000',          'María García',    '310 123 4567', 'Bogotá',      'nuevo'),
  ('Capital para negocio','$3.000.000 a $10.000.000',  'Carlos Martínez', '315 987 6543', 'Medellín',    'asignado'),
  ('Crédito personal',    '$10.000.000 a $30.000.000', 'Ana Rodríguez',   '300 456 7890', 'Cali',        'aprobado'),
  ('Compra de cartera',   '$3.000.000 a $10.000.000',  'Luis Pérez',      '318 321 0987', 'Bucaramanga', 'nuevo'),
  ('Crédito personal',    'Hasta $3.000.000',          'Diana Torres',    '317 555 0011', 'Bogotá',      'contactado'),
  ('Capital para negocio','$3.000.000 a $10.000.000',  'Roberto Silva',   '313 444 9988', 'Cartagena',   'nuevo')
ON CONFLICT DO NOTHING;

INSERT INTO kreditplus_contactos (nombre, email, telefono, tipo_solicitud, mensaje, estado) VALUES
  ('Juan López',   'juan@email.com',   '320 111 2233', 'Información comercial',    '¿Cuáles son los requisitos para un crédito?', 'nuevo'),
  ('Laura Gómez',  'laura@email.com',  '311 444 5566', 'Seguimiento de solicitud', 'Quiero saber el estado de mi solicitud.',     'asignado'),
  ('Pedro Suárez', 'pedro@email.com',  '312 777 8899', 'PQRS',                     'Tuve un problema con mi proceso de pago.',    'resuelto')
ON CONFLICT DO NOTHING;

-- ─── 8. MIGRACIÓN: Agregar nuevas columnas a base de datos existente ──
-- Ejecuta esto si ya tenías la tabla creada antes de esta versión:
ALTER TABLE kreditplus_solicitudes ADD COLUMN IF NOT EXISTS cedula    TEXT;
ALTER TABLE kreditplus_solicitudes ADD COLUMN IF NOT EXISTS email     TEXT;
ALTER TABLE kreditplus_solicitudes ADD COLUMN IF NOT EXISTS ocupacion TEXT;

-- ═══════ TABLA: kreditplus_cuentas_pago (Cuentas para recaudo/pagos) ═══════
CREATE TABLE IF NOT EXISTS kreditplus_cuentas_pago (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  banco text NOT NULL,
  tipo_cuenta text NOT NULL,
  numero_cuenta text NOT NULL,
  titular text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Políticas RLS para cuentas de pago
ALTER TABLE kreditplus_cuentas_pago ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cuentas_pago" ON kreditplus_cuentas_pago;
DROP POLICY IF EXISTS "auth_all_cuentas_pago" ON kreditplus_cuentas_pago;

CREATE POLICY "anon_select_cuentas_pago"
  ON kreditplus_cuentas_pago FOR SELECT TO anon USING (activo = true);

CREATE POLICY "auth_all_cuentas_pago"
  ON kreditplus_cuentas_pago FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ═══════ TABLA: kreditplus_pagos (Comprobantes de pago) ═══════
CREATE TABLE IF NOT EXISTS kreditplus_pagos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula text NOT NULL,
  monto text NOT NULL,
  cuenta_id text,
  comprobante_url text NOT NULL,
  estado text DEFAULT 'pendiente', -- pendiente, verificado, rechazado
  created_at timestamp with time zone DEFAULT now()
);

-- Políticas RLS para pagos
ALTER TABLE kreditplus_pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_pagos" ON kreditplus_pagos;
DROP POLICY IF EXISTS "auth_all_pagos" ON kreditplus_pagos;

CREATE POLICY "anon_insert_pagos"
  ON kreditplus_pagos FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "auth_all_pagos"
  ON kreditplus_pagos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- IMPORTANTE: Para guardar imágenes, se debe crear un bucket en Storage llamado "comprobantes" 
-- y darle permisos públicos (Public) y permitir INSERT a anon.

