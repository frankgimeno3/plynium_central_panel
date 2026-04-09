-- 109_publications_db_schema.sql
-- Align publications_db with canon (065): publication_id PK + magazine/year/issue/theme/status/format columns.

ALTER TABLE IF EXISTS public.publication_slots_db
  DROP CONSTRAINT IF EXISTS publication_slots_db_publication_id_fkey;
ALTER TABLE IF EXISTS public.publication_slot_content
  DROP CONSTRAINT IF EXISTS publication_slot_content_publication_id_fkey;
ALTER TABLE IF EXISTS public.offered_preferential_pages
  DROP CONSTRAINT IF EXISTS offered_preferential_pages_publication_id_fkey;

-- View public.publications (100_publications_to_publications_db.sql) is SELECT * from publications_db and pins
-- dropped columns; remove it before ALTER TABLE ... DROP COLUMN, then recreate at end of this migration.
DROP VIEW IF EXISTS public.publications;

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
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db' AND column_name = 'id_magazine'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db' AND column_name = 'magazine_id'
  ) THEN
    ALTER TABLE public.publications_db RENAME COLUMN id_magazine TO magazine_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db' AND column_name = 'year'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db' AND column_name = 'publication_year'
  ) THEN
    ALTER TABLE public.publications_db RENAME COLUMN year TO publication_year;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db' AND column_name = 'edition_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db' AND column_name = 'publication_edition_name'
  ) THEN
    ALTER TABLE public.publications_db RENAME COLUMN edition_name TO publication_edition_name;
  END IF;
END $$;

-- Copy issue_number before drop
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db' AND column_name = 'issue_number'
  ) THEN
    ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS magazine_general_issue_number INTEGER NULL;
    ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS magazine_this_year_issue INTEGER NULL;
    UPDATE public.publications_db SET magazine_general_issue_number = COALESCE(magazine_general_issue_number, issue_number);
    UPDATE public.publications_db SET magazine_this_year_issue = COALESCE(magazine_this_year_issue, issue_number);
    ALTER TABLE public.publications_db DROP COLUMN issue_number;
  END IF;
END $$;

-- New columns only (no renames left for these)
ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS magazine_general_issue_number INTEGER NULL;
ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS magazine_this_year_issue INTEGER NULL;
ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS publication_expected_publication_month SMALLINT NULL;
ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS real_publication_month_date DATE NULL;
ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS publication_materials_deadline DATE NULL;
ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS publication_main_image_url VARCHAR(512) NULL;
ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS publication_edition_name VARCHAR(255) NULL DEFAULT ''::character varying;
ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS is_special_edition BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS publication_theme VARCHAR(255) NULL DEFAULT ''::character varying;
ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS publication_status VARCHAR(64) NOT NULL DEFAULT 'draft'::character varying;
ALTER TABLE public.publications_db ADD COLUMN IF NOT EXISTS publication_format VARCHAR(32) NOT NULL DEFAULT 'flipbook'::character varying;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db'
      AND column_name = 'publication_main_image_url' AND character_maximum_length = 255
  ) THEN
    ALTER TABLE public.publications_db ALTER COLUMN publication_main_image_url TYPE VARCHAR(512);
  END IF;
END $$;

-- Migrate from legacy columns before drop
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db' AND column_name = 'date'
  ) THEN
    UPDATE public.publications_db SET real_publication_month_date = (date)::date
    WHERE real_publication_month_date IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'publications_db' AND column_name = 'revista'
  ) THEN
    UPDATE public.publications_db
    SET publication_theme = COALESCE(NULLIF(TRIM(publication_theme), ''), revista)
    WHERE revista IS NOT NULL AND TRIM(revista) <> '';
  END IF;
END $$;

ALTER TABLE public.publications_db DROP COLUMN IF EXISTS portal;
ALTER TABLE public.publications_db DROP COLUMN IF EXISTS redirection_link;
ALTER TABLE public.publications_db DROP COLUMN IF EXISTS date;
ALTER TABLE public.publications_db DROP COLUMN IF EXISTS revista;
ALTER TABLE public.publications_db DROP COLUMN IF EXISTS "número";
ALTER TABLE public.publications_db DROP COLUMN IF EXISTS created_at;
ALTER TABLE public.publications_db DROP COLUMN IF EXISTS updated_at;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'publications_db_publication_format_check'
  ) THEN
    ALTER TABLE public.publications_db
      ADD CONSTRAINT publications_db_publication_format_check
      CHECK (publication_format IN ('flipbook', 'informer'));
  END IF;
END $$;

DROP INDEX IF EXISTS public.publications_db_date_idx;

CREATE INDEX IF NOT EXISTS publications_db_magazine_id_idx ON public.publications_db (magazine_id);
CREATE INDEX IF NOT EXISTS publications_db_publication_year_idx ON public.publications_db (publication_year);
CREATE INDEX IF NOT EXISTS publications_db_publication_status_idx ON public.publications_db (publication_status);
CREATE INDEX IF NOT EXISTS publications_db_real_pub_date_idx ON public.publications_db (real_publication_month_date);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'publication_slots_db_publication_id_fkey'
  ) THEN
    ALTER TABLE public.publication_slots_db
      ADD CONSTRAINT publication_slots_db_publication_id_fkey
      FOREIGN KEY (publication_id) REFERENCES public.publications_db (publication_id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'publication_slot_content_publication_id_fkey'
  ) THEN
    ALTER TABLE public.publication_slot_content
      ADD CONSTRAINT publication_slot_content_publication_id_fkey
      FOREIGN KEY (publication_id) REFERENCES public.publications_db (publication_id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'offered_preferential_pages_publication_id_fkey'
  ) THEN
    ALTER TABLE public.offered_preferential_pages
      ADD CONSTRAINT offered_preferential_pages_publication_id_fkey
      FOREIGN KEY (publication_id) REFERENCES public.publications_db (publication_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Restore compatibility view (same rules as 100_publications_to_publications_db.sql)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'publications_db'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'publications'
      AND table_type = 'BASE TABLE'
  ) THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.publications AS SELECT * FROM public.publications_db';
  END IF;
END $$;
