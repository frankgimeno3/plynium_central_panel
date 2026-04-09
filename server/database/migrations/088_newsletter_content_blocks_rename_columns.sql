-- 088_newsletter_content_blocks_rename_columns.sql
-- Canonical newsletter_block_* columns; FK newsletter_id -> newsletters_db(newsletter_id).

CREATE OR REPLACE FUNCTION public.set_newsletter_content_blocks_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.newsletter_block_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_content_blocks' AND column_name = 'newsletter_block_id'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'newsletter_content_blocks'
  ) THEN
    RETURN;
  END IF;

  ALTER TABLE public.newsletter_content_blocks
    DROP CONSTRAINT IF EXISTS newsletter_content_blocks_id_newsletter_fkey;

  DROP INDEX IF EXISTS public.newsletter_content_blocks_id_newsletter_idx;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_content_blocks' AND column_name = 'id_newsletter'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_content_blocks' AND column_name = 'newsletter_id'
  ) THEN
    ALTER TABLE public.newsletter_content_blocks RENAME COLUMN id_newsletter TO newsletter_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_content_blocks' AND column_name = 'id_block'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_content_blocks' AND column_name = 'newsletter_block_id'
  ) THEN
    ALTER TABLE public.newsletter_content_blocks RENAME COLUMN id_block TO newsletter_block_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_content_blocks' AND column_name = 'block_type'
  ) THEN
    ALTER TABLE public.newsletter_content_blocks RENAME COLUMN block_type TO newsletter_block_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_content_blocks' AND column_name = 'block_order'
  ) THEN
    ALTER TABLE public.newsletter_content_blocks RENAME COLUMN block_order TO newsletter_block_position;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_content_blocks' AND column_name = 'data'
  ) THEN
    ALTER TABLE public.newsletter_content_blocks RENAME COLUMN data TO newsletter_block_content;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_content_blocks' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.newsletter_content_blocks RENAME COLUMN created_at TO newsletter_block_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_content_blocks' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.newsletter_content_blocks RENAME COLUMN updated_at TO newsletter_block_updated_at;
  END IF;

  CREATE INDEX IF NOT EXISTS newsletter_content_blocks_newsletter_id_idx ON public.newsletter_content_blocks (newsletter_id);

  BEGIN
    ALTER TABLE public.newsletter_content_blocks
      ADD CONSTRAINT newsletter_content_blocks_newsletter_id_fkey
      FOREIGN KEY (newsletter_id) REFERENCES public.newsletters_db(newsletter_id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  DROP TRIGGER IF EXISTS newsletter_content_blocks_updated_at ON public.newsletter_content_blocks;
  CREATE TRIGGER newsletter_content_blocks_updated_at
    BEFORE UPDATE ON public.newsletter_content_blocks
    FOR EACH ROW EXECUTE FUNCTION public.set_newsletter_content_blocks_updated_at();
END $$;
