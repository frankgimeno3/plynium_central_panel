-- 114_notification_company_content_to_panel_ticket_company_data.sql
-- Renombra notification_company_content -> panel_ticket_company_data y columnas a ticket_*.

ALTER TABLE IF EXISTS public.notification_company_content
  DROP CONSTRAINT IF EXISTS notification_company_content_panel_ticket_id_fkey;
ALTER TABLE IF EXISTS public.panel_ticket_company_data
  DROP CONSTRAINT IF EXISTS panel_ticket_company_data_ticket_id_fkey;

ALTER TABLE IF EXISTS public.notification_company_content
  DROP CONSTRAINT IF EXISTS notification_company_content_panel_ticket_id_key;
ALTER TABLE IF EXISTS public.panel_ticket_company_data
  DROP CONSTRAINT IF EXISTS notification_company_content_panel_ticket_id_key;
ALTER TABLE IF EXISTS public.panel_ticket_company_data
  DROP CONSTRAINT IF EXISTS panel_ticket_company_data_panel_ticket_id_key;
ALTER TABLE IF EXISTS public.panel_ticket_company_data
  DROP CONSTRAINT IF EXISTS panel_ticket_company_data_ticket_id_key;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notification_company_content'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_company_data'
  ) THEN
    ALTER TABLE public.notification_company_content RENAME TO panel_ticket_company_data;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'panel_ticket_company_data' AND c.conname = 'notification_company_content_pkey'
  ) THEN
    ALTER TABLE public.panel_ticket_company_data RENAME CONSTRAINT notification_company_content_pkey TO panel_ticket_company_data_pkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_company_data' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.panel_ticket_company_data RENAME COLUMN id TO ticket_company_data_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_company_data' AND column_name = 'panel_ticket_id'
  ) THEN
    ALTER TABLE public.panel_ticket_company_data RENAME COLUMN panel_ticket_id TO ticket_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_company_data' AND column_name = 'nombre_comercial'
  ) THEN
    ALTER TABLE public.panel_ticket_company_data RENAME COLUMN nombre_comercial TO ticket_company_name;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_company_data' AND column_name = 'nombre_fiscal'
  ) THEN
    ALTER TABLE public.panel_ticket_company_data RENAME COLUMN nombre_fiscal TO ticket_company_tax_name;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_company_data' AND column_name = 'tax_id'
  ) THEN
    ALTER TABLE public.panel_ticket_company_data RENAME COLUMN tax_id TO ticket_company_tax_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_company_data' AND column_name = 'cargo_creador'
  ) THEN
    ALTER TABLE public.panel_ticket_company_data RENAME COLUMN cargo_creador TO ticket_company_creator_role;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_company_data' AND column_name = 'web_empresa'
  ) THEN
    ALTER TABLE public.panel_ticket_company_data RENAME COLUMN web_empresa TO ticket_company_website;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_company_data' AND column_name = 'pais_empresa'
  ) THEN
    ALTER TABLE public.panel_ticket_company_data RENAME COLUMN pais_empresa TO ticket_company_country;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_company_data' AND column_name = 'descripcion_empresa'
  ) THEN
    ALTER TABLE public.panel_ticket_company_data RENAME COLUMN descripcion_empresa TO ticket_company_description;
  END IF;
END $$;

ALTER TABLE public.panel_ticket_company_data DROP COLUMN IF EXISTS created_at;
ALTER TABLE public.panel_ticket_company_data DROP COLUMN IF EXISTS updated_at;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'S' AND c.relname = 'notification_company_content_id_seq'
  ) THEN
    ALTER SEQUENCE public.notification_company_content_id_seq RENAME TO panel_ticket_company_data_ticket_company_data_id_seq;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'panel_ticket_company_data'
      AND c.conname = 'panel_ticket_company_data_ticket_id_key'
  ) THEN
    ALTER TABLE public.panel_ticket_company_data
      ADD CONSTRAINT panel_ticket_company_data_ticket_id_key UNIQUE (ticket_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'panel_ticket_company_data'
      AND c.conname = 'panel_ticket_company_data_ticket_id_fkey'
  ) THEN
    ALTER TABLE public.panel_ticket_company_data
      ADD CONSTRAINT panel_ticket_company_data_ticket_id_fkey
      FOREIGN KEY (ticket_id) REFERENCES public.panel_tickets (panel_ticket_id) ON DELETE CASCADE;
  END IF;
END $$;
