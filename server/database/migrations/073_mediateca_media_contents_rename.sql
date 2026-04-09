-- 073_mediateca_media_contents_rename.sql
-- Renames public.media_contents -> public.mediateca_media_contents and columns to mediateca_* / content_mime_type.

DO $$
BEGIN
  -- Rename table when old name exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'media_contents'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents'
  ) THEN
    DROP INDEX IF EXISTS public.media_contents_folder_id_idx;
    DROP INDEX IF EXISTS public.media_contents_type_idx;
    DROP INDEX IF EXISTS public.media_contents_created_at_idx;
    ALTER TABLE public.media_contents RENAME TO mediateca_media_contents;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents'
  ) THEN
    RETURN;
  END IF;

  -- Column renames (idempotent)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'mediateca_content_id'
  ) THEN
    ALTER TABLE public.mediateca_media_contents RENAME COLUMN id TO mediateca_content_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'folder_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'mediateca_folder_id'
  ) THEN
    ALTER TABLE public.mediateca_media_contents RENAME COLUMN folder_id TO mediateca_folder_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'content_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'mediateca_content_name'
  ) THEN
    ALTER TABLE public.mediateca_media_contents RENAME COLUMN content_name TO mediateca_content_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 's3_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'mediateca_s3_key'
  ) THEN
    ALTER TABLE public.mediateca_media_contents RENAME COLUMN s3_key TO mediateca_s3_key;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'content_src'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'mediateca_content_src'
  ) THEN
    ALTER TABLE public.mediateca_media_contents RENAME COLUMN content_src TO mediateca_content_src;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'mime_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'content_mime_type'
  ) THEN
    ALTER TABLE public.mediateca_media_contents RENAME COLUMN mime_type TO content_mime_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'mediateca_content_type'
  ) THEN
    ALTER TABLE public.mediateca_media_contents RENAME COLUMN type TO mediateca_content_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'mediateca_content_created_at'
  ) THEN
    ALTER TABLE public.mediateca_media_contents RENAME COLUMN created_at TO mediateca_content_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents' AND column_name = 'mediateca_content_updated_at'
  ) THEN
    ALTER TABLE public.mediateca_media_contents RENAME COLUMN updated_at TO mediateca_content_updated_at;
  END IF;

  DROP INDEX IF EXISTS public.mediateca_media_contents_folder_id_idx;
  DROP INDEX IF EXISTS public.mediateca_media_contents_type_idx;
  DROP INDEX IF EXISTS public.mediateca_media_contents_created_at_idx;
  DROP INDEX IF EXISTS public.media_contents_folder_id_idx;
  DROP INDEX IF EXISTS public.media_contents_type_idx;
  DROP INDEX IF EXISTS public.media_contents_created_at_idx;

  CREATE INDEX IF NOT EXISTS mediateca_media_contents_folder_idx
    ON public.mediateca_media_contents (mediateca_folder_id);
  CREATE INDEX IF NOT EXISTS mediateca_media_contents_type_idx
    ON public.mediateca_media_contents (mediateca_content_type);
  CREATE INDEX IF NOT EXISTS mediateca_media_contents_created_at_idx
    ON public.mediateca_media_contents (mediateca_content_created_at);
END $$;
