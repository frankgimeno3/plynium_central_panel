-- 090_projects_db_rename_columns.sql
-- Normalize projects_db column names to canonical project_* schema.

CREATE OR REPLACE FUNCTION public.set_projects_db_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.project_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'projects_db'
  ) THEN
    CREATE TABLE public.projects_db (
      project_id VARCHAR(255) PRIMARY KEY,
      contract_id VARCHAR(255) NOT NULL,
      project_title VARCHAR(255) NOT NULL,
      project_status VARCHAR(255) NOT NULL,
      project_publication_date DATE NULL,
      service_id VARCHAR(255) NOT NULL,
      publication_id VARCHAR(255) NULL,
      pm_events_id_array TEXT[] NULL DEFAULT '{}'::text[],
      project_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      project_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;

  -- Renames from legacy schema.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='id_project'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='project_id'
  ) THEN
    ALTER TABLE public.projects_db RENAME COLUMN id_project TO project_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='id_contract'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='contract_id'
  ) THEN
    ALTER TABLE public.projects_db RENAME COLUMN id_contract TO contract_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='title'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='project_title'
  ) THEN
    ALTER TABLE public.projects_db RENAME COLUMN title TO project_title;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='status'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='project_status'
  ) THEN
    ALTER TABLE public.projects_db RENAME COLUMN status TO project_status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='publication_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='project_publication_date'
  ) THEN
    ALTER TABLE public.projects_db RENAME COLUMN publication_date TO project_publication_date;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='service'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='service_id'
  ) THEN
    ALTER TABLE public.projects_db RENAME COLUMN service TO service_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='pm_events_array'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='pm_events_id_array'
  ) THEN
    ALTER TABLE public.projects_db RENAME COLUMN pm_events_array TO pm_events_id_array;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='project_created_at'
  ) THEN
    ALTER TABLE public.projects_db RENAME COLUMN created_at TO project_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='project_updated_at'
  ) THEN
    ALTER TABLE public.projects_db RENAME COLUMN updated_at TO project_updated_at;
  END IF;

  -- Ensure required canonical columns exist (without enforcing constraints on existing prod data).
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='contract_id'
  ) THEN
    ALTER TABLE public.projects_db ADD COLUMN contract_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='service_id'
  ) THEN
    ALTER TABLE public.projects_db ADD COLUMN service_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='publication_id'
  ) THEN
    ALTER TABLE public.projects_db ADD COLUMN publication_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='project_title'
  ) THEN
    ALTER TABLE public.projects_db ADD COLUMN project_title VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='project_status'
  ) THEN
    ALTER TABLE public.projects_db ADD COLUMN project_status VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='project_publication_date'
  ) THEN
    ALTER TABLE public.projects_db ADD COLUMN project_publication_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='pm_events_id_array'
  ) THEN
    ALTER TABLE public.projects_db ADD COLUMN pm_events_id_array TEXT[] NULL DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='project_created_at'
  ) THEN
    ALTER TABLE public.projects_db ADD COLUMN project_created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_db' AND column_name='project_updated_at'
  ) THEN
    ALTER TABLE public.projects_db ADD COLUMN project_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  -- Drop legacy indexes and create canonical ones.
  DROP INDEX IF EXISTS public.projects_db_id_contract_idx;
  DROP INDEX IF EXISTS public.projects_db_status_idx;
  DROP INDEX IF EXISTS public.projects_db_service_idx;
  DROP INDEX IF EXISTS public.projects_db_publication_date_idx;

  CREATE INDEX IF NOT EXISTS projects_db_contract_id_idx ON public.projects_db (contract_id);
  CREATE INDEX IF NOT EXISTS projects_db_project_status_idx ON public.projects_db (project_status);
  CREATE INDEX IF NOT EXISTS projects_db_service_id_idx ON public.projects_db (service_id);
  CREATE INDEX IF NOT EXISTS projects_db_project_publication_date_idx ON public.projects_db (project_publication_date);

  -- Keep project_updated_at current on UPDATE.
  DROP TRIGGER IF EXISTS projects_db_updated_at ON public.projects_db;
  CREATE TRIGGER projects_db_updated_at
    BEFORE UPDATE ON public.projects_db
    FOR EACH ROW EXECUTE FUNCTION public.set_projects_db_updated_at();

  -- Drop leftover legacy columns (only if they still exist).
  ALTER TABLE public.projects_db DROP COLUMN IF EXISTS id_project;
  ALTER TABLE public.projects_db DROP COLUMN IF EXISTS id_contract;
  ALTER TABLE public.projects_db DROP COLUMN IF EXISTS title;
  ALTER TABLE public.projects_db DROP COLUMN IF EXISTS status;
  ALTER TABLE public.projects_db DROP COLUMN IF EXISTS publication_date;
  ALTER TABLE public.projects_db DROP COLUMN IF EXISTS service;
  ALTER TABLE public.projects_db DROP COLUMN IF EXISTS pm_events_array;
  ALTER TABLE public.projects_db DROP COLUMN IF EXISTS created_at;
  ALTER TABLE public.projects_db DROP COLUMN IF EXISTS updated_at;
END $$;

