-- 097_portals_db_magazine_id_array.sql
-- Add magazine_id_array to portals (canonical table name portals_db; falls back to portals_id).

DO $$
BEGIN
  -- Only alter base tables (093 may leave public.portals_id as a VIEW alias).
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'portals_db' AND c.relkind = 'r'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portals_db' AND column_name = 'magazine_id_array'
  ) THEN
    ALTER TABLE public.portals_db
      ADD COLUMN magazine_id_array VARCHAR(255)[] NULL DEFAULT ARRAY[]::VARCHAR(255)[];
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'portals_id' AND c.relkind = 'r'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'magazine_id_array'
  ) THEN
    ALTER TABLE public.portals_id
      ADD COLUMN magazine_id_array VARCHAR(255)[] NULL DEFAULT ARRAY[]::VARCHAR(255)[];
  END IF;
END $$;
