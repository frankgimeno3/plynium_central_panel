-- 002_shared_extensions_and_functions.sql
-- Extensiones, función set_updated_at() y helper get_default_portal_id().
-- Idempotente. Requiere que la tabla portals exista (001).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

ALTER TABLE portals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION get_default_portal_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT id FROM portals ORDER BY created_at ASC NULLS LAST, id ASC LIMIT 1;
$$;

COMMENT ON FUNCTION set_updated_at() IS 'Trigger function to set updated_at = now() on row update';
COMMENT ON FUNCTION get_default_portal_id() IS 'Returns the default portal id for backfills (lowest id).';
