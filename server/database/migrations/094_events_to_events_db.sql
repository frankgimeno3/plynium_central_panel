-- 094_events_to_events_db.sql
-- Rename public.events -> public.events_db (canonical name going forward).
-- Also creates a compatibility VIEW public.events pointing to events_db.

DO $$
BEGIN
  -- Already migrated.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='events_db'
  ) THEN
    RETURN;
  END IF;

  -- If old table exists, rename it.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='events'
  ) THEN
    ALTER TABLE public.events RENAME TO events_db;
  ELSE
    RETURN;
  END IF;

  -- Keep old name as read-only alias to avoid breaking older queries.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'events'
  ) THEN
    EXECUTE 'CREATE VIEW public.events AS SELECT * FROM public.events_db';
  END IF;
END $$;

