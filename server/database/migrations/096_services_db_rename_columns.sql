-- 096_services_db_rename_columns.sql
-- Canonical services_db columns:
--   service_id, service_full_name, service_channel, service_product, service_format,
--   service_description, service_unit, service_unit_price, service_unit_specifications
--
-- service_channel: dem | portal | magazine
-- service_product: newsletter | magazine | company directory | banner
-- service_format: e.g. horizontal banner, top banner, right banner, 1 page article, ...

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='services_db'
  ) THEN
    RETURN;
  END IF;

  DROP INDEX IF EXISTS public.services_db_service_description_uidx;
  DROP INDEX IF EXISTS public.services_db_name_idx;
  DROP INDEX IF EXISTS public.services_db_service_name_idx;
  DROP INDEX IF EXISTS public.services_db_service_type_idx;
  DROP INDEX IF EXISTS public.services_db_service_media_idx;

  -- PK / names
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='id_service'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_id'
  ) THEN
    ALTER TABLE public.services_db RENAME COLUMN id_service TO service_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_full_name'
  ) THEN
    ALTER TABLE public.services_db RENAME COLUMN name TO service_full_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_full_name'
  ) THEN
    ALTER TABLE public.services_db RENAME COLUMN service_name TO service_full_name;
  END IF;

  -- Price / unit
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='tariff_price_eur'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_unit_price'
  ) THEN
    ALTER TABLE public.services_db RENAME COLUMN tariff_price_eur TO service_unit_price;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_price_eur'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_unit_price'
  ) THEN
    ALTER TABLE public.services_db RENAME COLUMN service_price_eur TO service_unit_price;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='unit'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_unit'
  ) THEN
    ALTER TABLE public.services_db RENAME COLUMN unit TO service_unit;
  END IF;

  -- Channel / product / format (from prior renames or legacy service_type)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_media'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_channel'
  ) THEN
    ALTER TABLE public.services_db RENAME COLUMN service_media TO service_channel;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_channel'
  ) THEN
    ALTER TABLE public.services_db RENAME COLUMN service_type TO service_channel;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_product'
  ) THEN
    ALTER TABLE public.services_db
      ADD COLUMN service_product VARCHAR(255) NOT NULL DEFAULT ''::character varying;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_format'
  ) THEN
    ALTER TABLE public.services_db
      ADD COLUMN service_format VARCHAR(512) NOT NULL DEFAULT ''::character varying;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_channel'
  ) THEN
    ALTER TABLE public.services_db
      ADD COLUMN service_channel VARCHAR(64) NOT NULL DEFAULT ''::character varying;
  END IF;

  -- Specifications (legacy names)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_specifications'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_unit_specifications'
  ) THEN
    ALTER TABLE public.services_db RENAME COLUMN service_specifications TO service_unit_specifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_unit_specifications'
  ) THEN
    ALTER TABLE public.services_db
      ADD COLUMN service_unit_specifications TEXT NOT NULL DEFAULT ''::text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_description'
  ) THEN
    ALTER TABLE public.services_db
      ADD COLUMN service_description TEXT NOT NULL DEFAULT ''::text;
  END IF;

  -- Merge display_name into service_full_name when useful
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_display_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_full_name'
  ) THEN
    UPDATE public.services_db
    SET service_full_name = COALESCE(NULLIF(TRIM(service_full_name), ''), service_display_name)
    WHERE COALESCE(NULLIF(TRIM(service_full_name), ''), '') = ''
      AND COALESCE(service_display_name, '') <> '';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='display_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_full_name'
  ) THEN
    UPDATE public.services_db
    SET service_full_name = COALESCE(NULLIF(TRIM(service_full_name), ''), display_name)
    WHERE COALESCE(NULLIF(TRIM(service_full_name), ''), '') = ''
      AND COALESCE(display_name, '') <> '';
  END IF;

  -- Legacy description -> service_unit_specifications
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='description'
  ) THEN
    UPDATE public.services_db
    SET service_unit_specifications = COALESCE(NULLIF(service_unit_specifications, ''), description)
    WHERE COALESCE(service_unit_specifications, '') = ''
      AND COALESCE(description, '') <> '';
  END IF;

  -- Best-effort map legacy channel tokens -> dem | portal | magazine + product (run product first).
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_channel'
  ) THEN
    UPDATE public.services_db
    SET service_channel = 'magazine'
    WHERE LOWER(TRIM(service_channel)) = 'mag';

    UPDATE public.services_db
    SET service_product = 'newsletter'
    WHERE service_product = ''
      AND LOWER(TRIM(service_channel)) = 'newsletter';

    UPDATE public.services_db
    SET service_product = 'magazine'
    WHERE service_product = ''
      AND LOWER(TRIM(service_channel)) = 'magazine';

    UPDATE public.services_db
    SET service_channel = 'dem'
    WHERE LOWER(TRIM(service_channel)) IN ('newsletter', 'other');
  END IF;

  -- Ensure required columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_id'
  ) THEN
    ALTER TABLE public.services_db ADD COLUMN service_id VARCHAR(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_full_name'
  ) THEN
    ALTER TABLE public.services_db ADD COLUMN service_full_name VARCHAR(512);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_unit_price'
  ) THEN
    ALTER TABLE public.services_db ADD COLUMN service_unit_price NUMERIC(14,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services_db' AND column_name='service_unit'
  ) THEN
    ALTER TABLE public.services_db ADD COLUMN service_unit VARCHAR(255) NOT NULL DEFAULT ''::character varying;
  END IF;

  CREATE INDEX IF NOT EXISTS services_db_service_full_name_idx ON public.services_db (service_full_name);
  CREATE INDEX IF NOT EXISTS services_db_service_channel_idx ON public.services_db (service_channel);
  CREATE INDEX IF NOT EXISTS services_db_service_product_idx ON public.services_db (service_product);

  -- Drop columns not in final schema
  ALTER TABLE public.services_db DROP COLUMN IF EXISTS delivery_days;
  ALTER TABLE public.services_db DROP COLUMN IF EXISTS publication_date;
  ALTER TABLE public.services_db DROP COLUMN IF EXISTS description;
  ALTER TABLE public.services_db DROP COLUMN IF EXISTS display_name;
  ALTER TABLE public.services_db DROP COLUMN IF EXISTS service_display_name;
  ALTER TABLE public.services_db DROP COLUMN IF EXISTS service_name;
  ALTER TABLE public.services_db DROP COLUMN IF EXISTS service_media;
  ALTER TABLE public.services_db DROP COLUMN IF EXISTS service_type;
  ALTER TABLE public.services_db DROP COLUMN IF EXISTS name;
  ALTER TABLE public.services_db DROP COLUMN IF EXISTS id_service;
  ALTER TABLE public.services_db DROP COLUMN IF EXISTS tariff_price_eur;
  ALTER TABLE public.services_db DROP COLUMN IF EXISTS service_price_eur;
END $$;
