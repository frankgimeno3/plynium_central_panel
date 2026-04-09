-- 106_publication_slots_rename_to_publication_slots_db.sql
-- Rename publication_slots -> publication_slots_db (align with *_db naming). Idempotent.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'publication_slots'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'publication_slots_db'
  ) THEN
    ALTER TABLE public.publication_slots RENAME TO publication_slots_db;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname = 'publication_slots_flatplan_id_idx'
  ) THEN
    ALTER INDEX public.publication_slots_flatplan_id_idx RENAME TO publication_slots_db_flatplan_id_idx;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname = 'publication_slots_planned_publication_id_idx'
  ) THEN
    ALTER INDEX public.publication_slots_planned_publication_id_idx RENAME TO publication_slots_db_planned_publication_id_idx;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname = 'publication_slots_id_advertiser_idx'
  ) THEN
    ALTER INDEX public.publication_slots_id_advertiser_idx RENAME TO publication_slots_db_id_advertiser_idx;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'publication_slots_db' AND c.conname = 'publication_slots_pkey'
  ) THEN
    ALTER TABLE public.publication_slots_db RENAME CONSTRAINT publication_slots_pkey TO publication_slots_db_pkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'S' AND c.relname = 'publication_slots_id_seq'
  ) THEN
    ALTER SEQUENCE public.publication_slots_id_seq RENAME TO publication_slots_db_id_seq;
  END IF;
END $$;
