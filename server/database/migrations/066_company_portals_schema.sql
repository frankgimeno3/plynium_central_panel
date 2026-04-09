-- 066_company_portals_schema.sql
-- PK company_portal_id (UUID); company_id+portal_id UNIQUE; slug→company_portal_slug; timestamps; drop status.
-- Idempotente: si ya existe company_portal_id, no hace nada.

CREATE OR REPLACE FUNCTION public.set_company_portals_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.company_portal_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'company_portals'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'company_portals'
    AND column_name = 'company_portal_id'
  ) THEN
    RETURN;
  END IF;

  DROP TRIGGER IF EXISTS company_portals_updated_at ON public.company_portals;
  DROP INDEX IF EXISTS public.company_portals_portal_slug_uidx;

  ALTER TABLE public.company_portals
    ADD COLUMN company_portal_id UUID NOT NULL DEFAULT gen_random_uuid();

  ALTER TABLE public.company_portals DROP CONSTRAINT company_portals_pkey;

  ALTER TABLE public.company_portals
    ADD CONSTRAINT company_portals_pkey PRIMARY KEY (company_portal_id);

  ALTER TABLE public.company_portals
    ADD CONSTRAINT company_portals_company_id_portal_id_key UNIQUE (company_id, portal_id);

  ALTER TABLE public.company_portals RENAME COLUMN slug TO company_portal_slug;
  ALTER TABLE public.company_portals RENAME COLUMN created_at TO company_portal_created_at;
  ALTER TABLE public.company_portals RENAME COLUMN updated_at TO company_portal_updated_at;

  ALTER TABLE public.company_portals DROP COLUMN IF EXISTS status;

  CREATE UNIQUE INDEX IF NOT EXISTS company_portals_portal_slug_uidx
    ON public.company_portals (portal_id, company_portal_slug);

  CREATE TRIGGER company_portals_updated_at
    BEFORE UPDATE ON public.company_portals
    FOR EACH ROW EXECUTE FUNCTION public.set_company_portals_updated_at();
END $$;
