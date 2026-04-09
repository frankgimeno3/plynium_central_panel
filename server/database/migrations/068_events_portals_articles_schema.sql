-- 068_events_portals_articles_schema.sql
-- Ajusta events/event_portals/event_articles al canon:
-- - events: id_fair -> event_id; country/location/region/start_date/end_date/created_at/updated_at/event_main_image/id_customer -> event_* / customer_id
-- - event_portals: añade event_portal_id (UUID PK), renombra slug/status/created_at/updated_at, UNIQUE(event_id, portal_id)
-- - event_articles: añade event_article_id (UUID PK), renombra created_at -> event_updated_at, UNIQUE(event_id, article_id)
-- Idempotente: si events.event_id ya existe, no hace nada (pero asegura columnas/constraints en tablas puente).

DO $$
DECLARE
  has_event_id boolean;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='events'
  ) THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='events' AND column_name='event_id'
  ) INTO has_event_id;

  IF NOT has_event_id THEN
    -- events renames
    ALTER TABLE public.events RENAME COLUMN id_fair TO event_id;
    ALTER TABLE public.events RENAME COLUMN country TO event_country;
    ALTER TABLE public.events RENAME COLUMN location TO event_location;
    ALTER TABLE public.events RENAME COLUMN main_description TO event_main_description;
    ALTER TABLE public.events RENAME COLUMN region TO event_region;
    ALTER TABLE public.events RENAME COLUMN start_date TO event_start_date;
    ALTER TABLE public.events RENAME COLUMN end_date TO event_end_date;
    ALTER TABLE public.events RENAME COLUMN created_at TO event_created_at;
    ALTER TABLE public.events RENAME COLUMN updated_at TO event_updated_at;
    ALTER TABLE public.events RENAME COLUMN event_main_image TO event_main_image_src;
    ALTER TABLE public.events RENAME COLUMN id_customer TO customer_id;
  END IF;

  -- Ensure events updated_at trigger exists
  CREATE OR REPLACE FUNCTION public.set_events_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $f$
  BEGIN
    NEW.event_updated_at := now();
    RETURN NEW;
  END;
  $f$;

  DROP TRIGGER IF EXISTS events_updated_at ON public.events;
  CREATE TRIGGER events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.set_events_updated_at();

  -- event_portals table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='event_portals') THEN
    -- add id and move PK
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='event_portals' AND column_name='event_portal_id'
    ) THEN
      ALTER TABLE public.event_portals ADD COLUMN event_portal_id UUID NOT NULL DEFAULT gen_random_uuid();
    END IF;

    -- rename cols (best effort: only if old exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_portals' AND column_name='slug') THEN
      ALTER TABLE public.event_portals RENAME COLUMN slug TO event_portal_slug;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_portals' AND column_name='status') THEN
      ALTER TABLE public.event_portals RENAME COLUMN status TO event_portal_status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_portals' AND column_name='created_at') THEN
      ALTER TABLE public.event_portals RENAME COLUMN created_at TO event_created_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_portals' AND column_name='updated_at') THEN
      ALTER TABLE public.event_portals RENAME COLUMN updated_at TO event_updated_at;
    END IF;

    -- constraints/indexes
    BEGIN
      ALTER TABLE public.event_portals DROP CONSTRAINT event_portals_pkey;
    EXCEPTION WHEN undefined_object THEN
      NULL;
    END;
    BEGIN
      ALTER TABLE public.event_portals ADD CONSTRAINT event_portals_pkey PRIMARY KEY (event_portal_id);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER TABLE public.event_portals ADD CONSTRAINT event_portals_event_id_portal_id_key UNIQUE (event_id, portal_id);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;

    DROP INDEX IF EXISTS public.event_portals_portal_slug_uidx;
    CREATE UNIQUE INDEX IF NOT EXISTS event_portals_portal_slug_uidx ON public.event_portals (portal_id, event_portal_slug);

    -- Ensure updated_at trigger exists for event_portals
    CREATE OR REPLACE FUNCTION public.set_event_portals_updated_at()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $g$
    BEGIN
      NEW.event_updated_at := now();
      RETURN NEW;
    END;
    $g$;
    DROP TRIGGER IF EXISTS event_portals_updated_at ON public.event_portals;
    CREATE TRIGGER event_portals_updated_at
      BEFORE UPDATE ON public.event_portals
      FOR EACH ROW EXECUTE FUNCTION public.set_event_portals_updated_at();
  END IF;

  -- event_articles table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='event_articles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='event_articles' AND column_name='event_article_id'
    ) THEN
      ALTER TABLE public.event_articles ADD COLUMN event_article_id UUID NOT NULL DEFAULT gen_random_uuid();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_articles' AND column_name='created_at') THEN
      ALTER TABLE public.event_articles RENAME COLUMN created_at TO event_updated_at;
    END IF;

    BEGIN
      ALTER TABLE public.event_articles DROP CONSTRAINT event_articles_pkey;
    EXCEPTION WHEN undefined_object THEN
      NULL;
    END;
    BEGIN
      ALTER TABLE public.event_articles ADD CONSTRAINT event_articles_pkey PRIMARY KEY (event_article_id);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER TABLE public.event_articles ADD CONSTRAINT event_articles_event_id_article_id_key UNIQUE (event_id, article_id);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;

    -- Ensure updated_at trigger exists for event_articles
    CREATE OR REPLACE FUNCTION public.set_event_articles_updated_at()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $h$
    BEGIN
      NEW.event_updated_at := now();
      RETURN NEW;
    END;
    $h$;
    DROP TRIGGER IF EXISTS event_articles_updated_at ON public.event_articles;
    CREATE TRIGGER event_articles_updated_at
      BEFORE UPDATE ON public.event_articles
      FOR EACH ROW EXECUTE FUNCTION public.set_event_articles_updated_at();
  END IF;
END $$;

