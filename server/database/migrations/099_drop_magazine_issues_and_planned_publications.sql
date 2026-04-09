-- 099_drop_magazine_issues_and_planned_publications.sql
-- Remove magazine_issues and planned_publications; drop orphan FK columns on workflow tables.

DROP TABLE IF EXISTS public.planned_publications CASCADE;
DROP TABLE IF EXISTS public.magazine_issues CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'publication_slots'
  ) THEN
    ALTER TABLE public.publication_slots DROP COLUMN IF EXISTS planned_publication_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'publication_slots_db'
  ) THEN
    ALTER TABLE public.publication_slots_db DROP COLUMN IF EXISTS planned_publication_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'offered_preferential_pages'
  ) THEN
    ALTER TABLE public.offered_preferential_pages DROP COLUMN IF EXISTS planned_publication_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'publication_single_available'
  ) THEN
    ALTER TABLE public.publication_single_available DROP COLUMN IF EXISTS planned_publication_id;
  END IF;
END $$;
