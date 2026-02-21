-- 001_shared_updated_at.sql
-- Objetivo: Extensión pgcrypto para UUID, función set_updated_at() reutilizable
-- y helper para obtener portal_id por defecto. Idempotente.

-- Permite gen_random_uuid() en migraciones posteriores
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función que actualiza la columna updated_at al hacer UPDATE.
-- Uso: CREATE TRIGGER ... BEFORE UPDATE ON tabla FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Opcional: portals puede no tener created_at; añadirlo para consistencia en backfills
ALTER TABLE portals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Helper: función que devuelve el portal_id por defecto (primer portal por created_at o id).
-- Usar en backfills: (SELECT get_default_portal_id())
CREATE OR REPLACE FUNCTION get_default_portal_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT id FROM portals ORDER BY created_at ASC NULLS LAST, id ASC LIMIT 1;
$$;

COMMENT ON FUNCTION set_updated_at() IS 'Trigger function to set updated_at = now() on row update';
COMMENT ON FUNCTION get_default_portal_id() IS 'Returns the default portal id for backfills (lowest id).';
