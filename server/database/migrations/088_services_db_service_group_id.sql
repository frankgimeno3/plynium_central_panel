-- 088_services_db_service_group_id.sql
-- Sustituye service_channel + service_product por service_group_id (FK a service_groups).
-- Vacía services_db. Requiere que exista public.service_groups (p. ej. migración 087).

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'services_db'
      AND column_name = 'service_channel'
  ) THEN
    TRUNCATE TABLE public.services_db;

    DROP INDEX IF EXISTS public.services_db_service_channel_idx;
    DROP INDEX IF EXISTS public.services_db_service_product_idx;

    ALTER TABLE public.services_db DROP COLUMN IF EXISTS service_channel;
    ALTER TABLE public.services_db DROP COLUMN IF EXISTS service_product;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'services_db'
        AND column_name = 'service_group_id'
    ) THEN
      ALTER TABLE public.services_db
        ADD COLUMN service_group_id UUID NOT NULL REFERENCES public.service_groups(service_group_id) ON DELETE RESTRICT;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS services_db_service_group_id_idx ON public.services_db (service_group_id);

COMMIT;
