-- 089_pm_events_db_rename_columns.sql
-- Normalize pm_events_db column names to canonical pm_event_* schema.

CREATE OR REPLACE FUNCTION public.set_pm_events_db_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.pm_event_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pm_events_db'
  ) THEN
    CREATE TABLE public.pm_events_db (
      pm_event_id VARCHAR(255) PRIMARY KEY,
      project_id VARCHAR(255) NOT NULL,
      customer_id VARCHAR(255) NOT NULL,
      pm_event_type VARCHAR(255) NOT NULL,
      pm_event_date DATE NOT NULL,
      pm_event_description TEXT NOT NULL DEFAULT ''::text,
      pm_event_state VARCHAR(255) NOT NULL DEFAULT 'pending'::character varying,
      pm_event_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      pm_event_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;

  -- Renames from legacy schema (id_* / generic timestamps) to canonical.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='id_event'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_id'
  ) THEN
    ALTER TABLE public.pm_events_db RENAME COLUMN id_event TO pm_event_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='id_project'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='project_id'
  ) THEN
    ALTER TABLE public.pm_events_db RENAME COLUMN id_project TO project_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='id_customer'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='customer_id'
  ) THEN
    ALTER TABLE public.pm_events_db RENAME COLUMN id_customer TO customer_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='event_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_type'
  ) THEN
    ALTER TABLE public.pm_events_db RENAME COLUMN event_type TO pm_event_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_date'
  ) THEN
    ALTER TABLE public.pm_events_db RENAME COLUMN date TO pm_event_date;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='event_description'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_description'
  ) THEN
    ALTER TABLE public.pm_events_db RENAME COLUMN event_description TO pm_event_description;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='event_state'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_state'
  ) THEN
    ALTER TABLE public.pm_events_db RENAME COLUMN event_state TO pm_event_state;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_created_at'
  ) THEN
    ALTER TABLE public.pm_events_db RENAME COLUMN created_at TO pm_event_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_updated_at'
  ) THEN
    ALTER TABLE public.pm_events_db RENAME COLUMN updated_at TO pm_event_updated_at;
  END IF;

  -- Ensure required canonical columns exist (in case of partial schemas).
  -- Note: we intentionally do NOT attempt to add a PRIMARY KEY here, because enforcing PK
  -- on an existing table can fail if there are NULL/duplicate values in production data.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_id'
  ) THEN
    ALTER TABLE public.pm_events_db ADD COLUMN pm_event_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='project_id'
  ) THEN
    ALTER TABLE public.pm_events_db ADD COLUMN project_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='customer_id'
  ) THEN
    ALTER TABLE public.pm_events_db ADD COLUMN customer_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_type'
  ) THEN
    ALTER TABLE public.pm_events_db ADD COLUMN pm_event_type VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_date'
  ) THEN
    ALTER TABLE public.pm_events_db ADD COLUMN pm_event_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_description'
  ) THEN
    ALTER TABLE public.pm_events_db ADD COLUMN pm_event_description TEXT NOT NULL DEFAULT ''::text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_state'
  ) THEN
    ALTER TABLE public.pm_events_db ADD COLUMN pm_event_state VARCHAR(255) NOT NULL DEFAULT 'pending'::character varying;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_created_at'
  ) THEN
    ALTER TABLE public.pm_events_db ADD COLUMN pm_event_created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pm_events_db' AND column_name='pm_event_updated_at'
  ) THEN
    ALTER TABLE public.pm_events_db ADD COLUMN pm_event_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  -- Drop legacy indexes (if they exist) and create canonical ones.
  DROP INDEX IF EXISTS public.pm_events_db_id_project_idx;
  DROP INDEX IF EXISTS public.pm_events_db_id_customer_idx;
  DROP INDEX IF EXISTS public.pm_events_db_event_type_idx;
  DROP INDEX IF EXISTS public.pm_events_db_date_idx;
  DROP INDEX IF EXISTS public.pm_events_db_event_state_idx;

  CREATE INDEX IF NOT EXISTS pm_events_db_project_id_idx ON public.pm_events_db (project_id);
  CREATE INDEX IF NOT EXISTS pm_events_db_customer_id_idx ON public.pm_events_db (customer_id);
  CREATE INDEX IF NOT EXISTS pm_events_db_pm_event_type_idx ON public.pm_events_db (pm_event_type);
  CREATE INDEX IF NOT EXISTS pm_events_db_pm_event_date_idx ON public.pm_events_db (pm_event_date);
  CREATE INDEX IF NOT EXISTS pm_events_db_pm_event_state_idx ON public.pm_events_db (pm_event_state);

  -- Keep pm_event_updated_at current on UPDATE.
  DROP TRIGGER IF EXISTS pm_events_db_updated_at ON public.pm_events_db;
  CREATE TRIGGER pm_events_db_updated_at
    BEFORE UPDATE ON public.pm_events_db
    FOR EACH ROW EXECUTE FUNCTION public.set_pm_events_db_updated_at();

  -- Finally, drop any leftover legacy columns (only if they still exist).
  ALTER TABLE public.pm_events_db DROP COLUMN IF EXISTS id_event;
  ALTER TABLE public.pm_events_db DROP COLUMN IF EXISTS id_project;
  ALTER TABLE public.pm_events_db DROP COLUMN IF EXISTS id_customer;
  ALTER TABLE public.pm_events_db DROP COLUMN IF EXISTS event_type;
  ALTER TABLE public.pm_events_db DROP COLUMN IF EXISTS date;
  ALTER TABLE public.pm_events_db DROP COLUMN IF EXISTS event_description;
  ALTER TABLE public.pm_events_db DROP COLUMN IF EXISTS event_state;
  ALTER TABLE public.pm_events_db DROP COLUMN IF EXISTS created_at;
  ALTER TABLE public.pm_events_db DROP COLUMN IF EXISTS updated_at;
END $$;

