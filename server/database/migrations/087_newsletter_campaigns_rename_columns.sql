-- 087_newsletter_campaigns_rename_columns.sql
-- Canonical newsletter_campaign_* columns + portal_id + planned publication dates array.

CREATE OR REPLACE FUNCTION public.set_newsletter_campaigns_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.newsletter_campaign_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  first_portal INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'newsletter_campaign_name'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns'
  ) THEN
    RETURN;
  END IF;

  SELECT portal_id INTO first_portal FROM public.portals_id ORDER BY portal_id ASC LIMIT 1;

  ALTER TABLE public.newsletters_db DROP CONSTRAINT IF EXISTS newsletters_db_newsletter_campaign_id_fkey;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'id_campaign'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'newsletter_campaign_id'
  ) THEN
    ALTER TABLE public.newsletter_campaigns RENAME COLUMN id_campaign TO newsletter_campaign_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.newsletter_campaigns RENAME COLUMN name TO newsletter_campaign_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.newsletter_campaigns RENAME COLUMN description TO newsletter_campaign_description;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'portal_id'
  ) THEN
    ALTER TABLE public.newsletter_campaigns ADD COLUMN portal_id INTEGER NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'portal_code'
  ) THEN
    UPDATE public.newsletter_campaigns c
    SET portal_id = p.portal_id
    FROM public.portals_id p
    WHERE c.portal_id IS NULL
      AND (
        p.portal_name_key = c.portal_code
        OR p.portal_name = c.portal_code
        OR CAST(p.portal_id AS TEXT) = c.portal_code
      );

    IF first_portal IS NOT NULL THEN
      UPDATE public.newsletter_campaigns
      SET portal_id = first_portal
      WHERE portal_id IS NULL;
    END IF;

    ALTER TABLE public.newsletter_campaigns DROP COLUMN portal_code;
  END IF;

  BEGIN
    ALTER TABLE public.newsletter_campaigns
      ADD CONSTRAINT newsletter_campaigns_portal_id_fkey
      FOREIGN KEY (portal_id) REFERENCES public.portals_id(portal_id) ON DELETE RESTRICT;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'newsletter_campaign'
  ) THEN
    ALTER TABLE public.newsletter_campaigns ADD COLUMN newsletter_campaign TEXT NULL DEFAULT ''::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'frequency'
  ) THEN
    ALTER TABLE public.newsletter_campaigns RENAME COLUMN frequency TO newsletter_campaign_publication_frequency;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.newsletter_campaigns RENAME COLUMN start_date TO newsletter_campaign_start_date;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.newsletter_campaigns RENAME COLUMN end_date TO newsletter_campaign_end_date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'newsletter_campaign_planned_publication_dates_array'
  ) THEN
    ALTER TABLE public.newsletter_campaigns ADD COLUMN newsletter_campaign_planned_publication_dates_array DATE[] NOT NULL DEFAULT '{}'::date[];
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.newsletter_campaigns RENAME COLUMN status TO newsletter_campaign_status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.newsletter_campaigns RENAME COLUMN created_at TO newsletter_campaign_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_campaigns' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.newsletter_campaigns RENAME COLUMN updated_at TO newsletter_campaign_updated_at;
  END IF;

  ALTER TABLE public.newsletter_campaigns ALTER COLUMN portal_id SET NOT NULL;

  DROP TRIGGER IF EXISTS newsletter_campaigns_updated_at ON public.newsletter_campaigns;
  CREATE TRIGGER newsletter_campaigns_updated_at
    BEFORE UPDATE ON public.newsletter_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.set_newsletter_campaigns_updated_at();

  BEGIN
    ALTER TABLE public.newsletters_db
      ADD CONSTRAINT newsletters_db_newsletter_campaign_id_fkey
      FOREIGN KEY (newsletter_campaign_id) REFERENCES public.newsletter_campaigns(newsletter_campaign_id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
