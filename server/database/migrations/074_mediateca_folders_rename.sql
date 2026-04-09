-- 074_mediateca_folders_rename.sql
-- Renames public.folders -> public.mediateca_folders and columns to mediateca_*.
-- Recreates FK from mediateca_media_contents and self-FK on folders.

DO $$
BEGIN
  -- Drop FKs that reference folders(id) before rename (constraint names vary by Postgres version)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents'
  ) THEN
    BEGIN
      ALTER TABLE public.mediateca_media_contents DROP CONSTRAINT IF EXISTS mediateca_media_contents_mediateca_folder_id_fkey;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.mediateca_media_contents DROP CONSTRAINT IF EXISTS media_contents_folder_id_fkey;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'folders'
  ) THEN
    BEGIN
      ALTER TABLE public.folders DROP CONSTRAINT IF EXISTS folders_parent_id_fkey;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;

    DROP INDEX IF EXISTS public.folders_parent_id_idx;

    ALTER TABLE public.folders RENAME TO mediateca_folders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'mediateca_folders'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_folders' AND column_name = 'id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_folders' AND column_name = 'mediateca_folder_id'
  ) THEN
    ALTER TABLE public.mediateca_folders RENAME COLUMN id TO mediateca_folder_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_folders' AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_folders' AND column_name = 'mediateca_folder_name'
  ) THEN
    ALTER TABLE public.mediateca_folders RENAME COLUMN name TO mediateca_folder_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_folders' AND column_name = 'parent_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_folders' AND column_name = 'mediateca_parent_folder_id'
  ) THEN
    ALTER TABLE public.mediateca_folders RENAME COLUMN parent_id TO mediateca_parent_folder_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_folders' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_folders' AND column_name = 'mediateca_folder_created_at'
  ) THEN
    ALTER TABLE public.mediateca_folders RENAME COLUMN created_at TO mediateca_folder_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_folders' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mediateca_folders' AND column_name = 'mediateca_folder_updated_at'
  ) THEN
    ALTER TABLE public.mediateca_folders RENAME COLUMN updated_at TO mediateca_folder_updated_at;
  END IF;

  DROP INDEX IF EXISTS public.mediateca_folders_parent_id_idx;
  CREATE INDEX IF NOT EXISTS mediateca_folders_parent_idx
    ON public.mediateca_folders (mediateca_parent_folder_id);

  -- Self-reference
  BEGIN
    ALTER TABLE public.mediateca_folders
      ADD CONSTRAINT mediateca_folders_parent_fkey
      FOREIGN KEY (mediateca_parent_folder_id) REFERENCES public.mediateca_folders(mediateca_folder_id);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Media rows -> folder
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'mediateca_media_contents'
  ) THEN
    BEGIN
      ALTER TABLE public.mediateca_media_contents
        ADD CONSTRAINT mediateca_media_contents_mediateca_folder_id_fkey
        FOREIGN KEY (mediateca_folder_id) REFERENCES public.mediateca_folders(mediateca_folder_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
