-- 107_publication_slots_db_columns.sql
-- Canonical column names for publication_slots_db (see 065). Idempotent for fresh and legacy DBs.

ALTER TABLE public.offered_preferential_pages
  DROP CONSTRAINT IF EXISTS offered_preferential_pages_publication_slot_id_fkey;

DROP INDEX IF EXISTS public.publication_slots_db_flatplan_id_idx;
DROP INDEX IF EXISTS public.publication_slots_db_planned_publication_id_idx;
DROP INDEX IF EXISTS public.publication_slots_db_id_advertiser_idx;

ALTER TABLE public.publication_slots_db DROP CONSTRAINT IF EXISTS publication_slots_db_publication_id_fkey;

ALTER TABLE public.publication_slots_db DROP COLUMN IF EXISTS planned_publication_id;
ALTER TABLE public.publication_slots_db DROP COLUMN IF EXISTS flatplan_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publication_slots_db' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.publication_slots_db RENAME COLUMN id TO publication_slot_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publication_slots_db' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE public.publication_slots_db RENAME COLUMN content_type TO slot_content_type;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publication_slots_db' AND column_name = 'state'
  ) THEN
    ALTER TABLE public.publication_slots_db RENAME COLUMN state TO slot_state;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publication_slots_db' AND column_name = 'id_advertiser'
  ) THEN
    ALTER TABLE public.publication_slots_db RENAME COLUMN id_advertiser TO customer_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publication_slots_db' AND column_name = 'id_project'
  ) THEN
    ALTER TABLE public.publication_slots_db RENAME COLUMN id_project TO project_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publication_slots_db' AND column_name = 'image_src'
  ) THEN
    ALTER TABLE public.publication_slots_db RENAME COLUMN image_src TO slot_media_url;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publication_slots_db' AND column_name = 'article_id'
  ) THEN
    ALTER TABLE public.publication_slots_db RENAME COLUMN article_id TO slot_article_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publication_slots_db' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.publication_slots_db RENAME COLUMN created_at TO slot_created_at;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publication_slots_db' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.publication_slots_db RENAME COLUMN updated_at TO slot_updated_at;
  END IF;
END $$;

ALTER TABLE public.publication_slots_db ADD COLUMN IF NOT EXISTS publication_id VARCHAR(255) NULL;
ALTER TABLE public.publication_slots_db ADD COLUMN IF NOT EXISTS publication_format VARCHAR(32) NOT NULL DEFAULT 'flipbook'::character varying;

UPDATE public.publication_slots_db
SET publication_format = 'flipbook'
WHERE publication_format IS NULL OR TRIM(publication_format) = '';

-- FK below references publications_db(publication_id). Legacy DBs may still use id_publication until 109 runs;
-- align the name here so 107 succeeds when run before 109 (same logic as 109_publications_db_schema.sql).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db' AND column_name = 'id_publication'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db' AND column_name = 'publication_id'
  ) THEN
    ALTER TABLE public.publications_db RENAME COLUMN id_publication TO publication_id;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'publication_slots_db_publication_format_check'
  ) THEN
    ALTER TABLE public.publication_slots_db
      ADD CONSTRAINT publication_slots_db_publication_format_check
      CHECK (publication_format IN ('flipbook', 'informer'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'publication_slots_db_publication_id_fkey'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publication_slots_db' AND column_name = 'publication_id'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db' AND column_name = 'publication_id'
  ) THEN
    ALTER TABLE public.publication_slots_db
      ADD CONSTRAINT publication_slots_db_publication_id_fkey
      FOREIGN KEY (publication_id) REFERENCES public.publications_db (publication_id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS publication_slots_db_publication_id_idx ON public.publication_slots_db (publication_id);
CREATE INDEX IF NOT EXISTS publication_slots_db_customer_id_idx ON public.publication_slots_db (customer_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'offered_preferential_pages_publication_slot_id_fkey'
  ) THEN
    ALTER TABLE public.offered_preferential_pages
      ADD CONSTRAINT offered_preferential_pages_publication_slot_id_fkey
      FOREIGN KEY (publication_slot_id) REFERENCES public.publication_slots_db (publication_slot_id) ON DELETE SET NULL;
  END IF;
END $$;
