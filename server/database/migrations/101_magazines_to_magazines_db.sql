-- 101_magazines_to_magazines_db.sql
-- Rename public.magazines -> public.magazines_db; canonical columns magazine_*.
-- Optional VIEW public.magazines (legacy column aliases).
-- If public.flatplans exists (pre-103), temporarily drop/recreate its FK to magazines_db during renames.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'magazines' AND table_type = 'BASE TABLE'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'magazines_db' AND table_type = 'BASE TABLE'
  ) THEN
    RAISE NOTICE 'Skipping magazines migration: base tables magazines and magazines_db both exist';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'flatplans' AND table_type = 'BASE TABLE'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'flatplans'
      AND c.conname = 'flatplans_id_magazine_fkey'
  ) THEN
    ALTER TABLE public.flatplans DROP CONSTRAINT flatplans_id_magazine_fkey;
  END IF;

  -- Rename base table magazines -> magazines_db
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'magazines' AND table_type = 'BASE TABLE'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'magazines_db' AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.magazines RENAME TO magazines_db;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'magazines_pkey'
      AND conrelid = 'public.magazines_db'::regclass
  ) THEN
    ALTER TABLE public.magazines_db RENAME CONSTRAINT magazines_pkey TO magazines_db_pkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'magazines_db' AND column_name = 'id_magazine'
  ) THEN
    ALTER TABLE public.magazines_db RENAME COLUMN id_magazine TO magazine_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'magazines_db' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.magazines_db RENAME COLUMN name TO magazine_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'magazines_db' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.magazines_db RENAME COLUMN description TO magazine_description;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'magazines_db' AND column_name = 'first_year'
  ) THEN
    ALTER TABLE public.magazines_db RENAME COLUMN first_year TO magazine_starting_year;
  END IF;

  ALTER TABLE public.magazines_db
    ADD COLUMN IF NOT EXISTS magazine_periodicity VARCHAR(255) NOT NULL DEFAULT ''::character varying;
  ALTER TABLE public.magazines_db
    ADD COLUMN IF NOT EXISTS magazine_subscriber_number INTEGER NULL;

  ALTER TABLE public.magazines_db DROP COLUMN IF EXISTS last_year;
  ALTER TABLE public.magazines_db DROP COLUMN IF EXISTS notes;
  ALTER TABLE public.magazines_db DROP COLUMN IF EXISTS portal_name;
  ALTER TABLE public.magazines_db DROP COLUMN IF EXISTS created_at;
  ALTER TABLE public.magazines_db DROP COLUMN IF EXISTS updated_at;

  DROP INDEX IF EXISTS public.magazines_name_idx;
  DROP INDEX IF EXISTS public.magazines_first_year_idx;
  DROP INDEX IF EXISTS public.magazines_last_year_idx;
  CREATE INDEX IF NOT EXISTS magazines_db_magazine_name_idx ON public.magazines_db (magazine_name);
  CREATE INDEX IF NOT EXISTS magazines_db_magazine_starting_year_idx ON public.magazines_db (magazine_starting_year);

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'flatplans' AND table_type = 'BASE TABLE'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'flatplans'
      AND c.conname = 'flatplans_id_magazine_fkey'
  ) THEN
    ALTER TABLE public.flatplans
      ADD CONSTRAINT flatplans_id_magazine_fkey
      FOREIGN KEY (id_magazine) REFERENCES public.magazines_db (magazine_id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'magazines_db'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'magazines' AND table_type = 'BASE TABLE'
    ) THEN
      NULL;
    ELSE
      EXECUTE $v$
        CREATE OR REPLACE VIEW public.magazines AS
        SELECT
          magazine_id AS id_magazine,
          magazine_name AS name,
          magazine_description AS description,
          magazine_starting_year AS first_year,
          NULL::integer AS last_year,
          ''::text AS notes,
          ''::character varying(255) AS portal_name
        FROM public.magazines_db
      $v$;
    END IF;
  END IF;
END $$;
