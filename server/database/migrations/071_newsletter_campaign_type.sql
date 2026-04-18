-- 071_newsletter_campaign_type.sql
-- Reemplaza columnas legacy de newsletter_campaigns por newsletter_type.

BEGIN;

ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS newsletter_type VARCHAR(255);

UPDATE public.newsletter_campaigns
SET newsletter_type = CASE
  WHEN lower(trim(coalesce(newsletter_campaign, ''))) IN ('main', 'specific')
    THEN lower(trim(newsletter_campaign))
  ELSE 'main'
END
WHERE newsletter_type IS NULL
   OR trim(newsletter_type) = '';

ALTER TABLE public.newsletter_campaigns
  ALTER COLUMN newsletter_type SET DEFAULT 'main';

ALTER TABLE public.newsletter_campaigns
  ALTER COLUMN newsletter_type SET NOT NULL;

ALTER TABLE public.newsletter_campaigns
  DROP CONSTRAINT IF EXISTS newsletter_campaigns_newsletter_type_check;

ALTER TABLE public.newsletter_campaigns
  ADD CONSTRAINT newsletter_campaigns_newsletter_type_check
  CHECK (newsletter_type IN ('main', 'specific'));

ALTER TABLE public.newsletter_campaigns
  DROP COLUMN IF EXISTS newsletter_campaign_start_date,
  DROP COLUMN IF EXISTS newsletter_campaign_end_date,
  DROP COLUMN IF EXISTS newsletter_campaign,
  DROP COLUMN IF EXISTS newsletter_campaign_planned_publications_array,
  DROP COLUMN IF EXISTS newsletter_campaign_planned_publication_dates_array;

COMMIT;
