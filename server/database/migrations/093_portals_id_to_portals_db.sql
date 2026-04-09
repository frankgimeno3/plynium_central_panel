-- 093_portals_id_to_portals_db.sql
-- Rename public.portals_id -> public.portals_db (canonical name going forward).
-- Also creates a compatibility VIEW public.portals_id pointing to portals_db.

DO $$
BEGIN
  -- Already migrated.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='portals_db'
  ) THEN
    RETURN;
  END IF;

  -- If old table exists, rename it.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='portals_id'
  ) THEN
    ALTER TABLE public.portals_id RENAME TO portals_db;
  ELSE
    -- Nothing to do.
    RETURN;
  END IF;

  -- Keep old name as read-only alias to avoid breaking older queries.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'portals_id'
  ) THEN
    EXECUTE 'CREATE VIEW public.portals_id AS SELECT * FROM public.portals_db';
  END IF;
END $$;

