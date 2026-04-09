-- 100_publications_to_publications_db.sql
-- Rename public.publications -> public.publications_db (legacy DBs).
-- Read-only VIEW public.publications for compatibility (same pattern as events / portals_id).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'publications'
      AND table_type = 'BASE TABLE'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'publications_db'
  ) THEN
    RAISE NOTICE 'Skipping publications rename: base table publications and publications_db both exist';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'publications'
      AND table_type = 'BASE TABLE'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'publications_db'
  ) THEN
    ALTER TABLE public.publications RENAME TO publications_db;

    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'publications_pkey'
        AND conrelid = 'public.publications_db'::regclass
    ) THEN
      ALTER TABLE public.publications_db RENAME CONSTRAINT publications_pkey TO publications_db_pkey;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'publications_date_idx'
    ) THEN
      ALTER INDEX public.publications_date_idx RENAME TO publications_db_date_idx;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'publications_db'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'publications'
        AND table_type = 'BASE TABLE'
    ) THEN
      NULL;
    ELSE
      EXECUTE 'CREATE OR REPLACE VIEW public.publications AS SELECT * FROM public.publications_db';
    END IF;
  END IF;
END $$;
