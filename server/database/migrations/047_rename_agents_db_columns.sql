-- 047_rename_agents_db_columns.sql
-- Todas las columnas de agents_db con prefijo agent_. Idempotente.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'agents_db'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agents_db' AND column_name = 'id_agent'
    ) THEN
      ALTER TABLE public.agents_db RENAME COLUMN id_agent TO agent_id;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agents_db' AND column_name = 'name'
    ) THEN
      ALTER TABLE public.agents_db RENAME COLUMN name TO agent_name;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agents_db' AND column_name = 'email'
    ) THEN
      ALTER TABLE public.agents_db RENAME COLUMN email TO agent_email;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agents_db' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.agents_db RENAME COLUMN created_at TO agent_created_at;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agents_db' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE public.agents_db RENAME COLUMN updated_at TO agent_updated_at;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'agents_db_name' AND c.relkind = 'i'
    ) THEN
      ALTER INDEX public.agents_db_name RENAME TO agents_db_agent_name;
    END IF;
  END IF;
END $$;
