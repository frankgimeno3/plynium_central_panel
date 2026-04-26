-- 002_bundle_069_072.sql
-- Bundled from migrations 069 to 072 (original files preserved below).

-- ======================================================================
-- BEGIN 069_topic_portals_bridge.sql
-- ======================================================================

-- 069_topic_portals_bridge.sql
-- Permite asociar un topic a múltiples portales.

BEGIN;

CREATE TABLE IF NOT EXISTS public.topic_portals (
  topic_id INTEGER NOT NULL REFERENCES public.topics_db(topic_id) ON DELETE CASCADE,
  portal_id INTEGER NOT NULL REFERENCES public.portals_db(portal_id) ON DELETE CASCADE,
  topic_portal_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (topic_id, portal_id)
);

CREATE INDEX IF NOT EXISTS topic_portals_topic_id_idx ON public.topic_portals (topic_id);
CREATE INDEX IF NOT EXISTS topic_portals_portal_id_idx ON public.topic_portals (portal_id);

-- Backfill: crear relación para el portal "principal" existente en topics_db
INSERT INTO public.topic_portals (topic_id, portal_id)
SELECT t.topic_id, t.topic_portal
FROM public.topics_db t
WHERE NOT EXISTS (
  SELECT 1 FROM public.topic_portals tp
  WHERE tp.topic_id = t.topic_id AND tp.portal_id = t.topic_portal
);

COMMIT;

-- ======================================================================
-- END 069_topic_portals_bridge.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 070_drop_topics_db_topic_portal.sql
-- ======================================================================

-- 070_drop_topics_db_topic_portal.sql
-- topics_db deja de tener un portal "principal"; usar topic_portals (tabla puente).

BEGIN;

-- Quitar índices/constraints que dependan de topic_portal (si existen)
DROP INDEX IF EXISTS public.topics_db_topic_portal_idx;
DROP INDEX IF EXISTS public.topics_db_portal_name_uidx;

ALTER TABLE public.topics_db
  DROP CONSTRAINT IF EXISTS topics_db_topic_portal_fkey;

-- Remover columna legacy
ALTER TABLE public.topics_db
  DROP COLUMN IF EXISTS topic_portal;

COMMIT;

-- ======================================================================
-- END 070_drop_topics_db_topic_portal.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 071_newsletter_campaign_type.sql
-- ======================================================================

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

-- ======================================================================
-- END 071_newsletter_campaign_type.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 072_seed_newsletter_campaigns.sql
-- ======================================================================

-- 072_seed_newsletter_campaigns.sql
-- Crea campañas newsletter por portal y por topic_portal.

BEGIN;

-- Una campaña mensual principal por portal.
INSERT INTO public.newsletter_campaigns (
  newsletter_campaign_id,
  newsletter_campaign_name,
  newsletter_campaign_description,
  portal_id,
  newsletter_type,
  content_theme,
  newsletter_campaign_publication_frequency,
  newsletter_campaign_status,
  newsletter_campaign_created_at,
  newsletter_campaign_updated_at
)
SELECT
  'newsletter-campaign-main-portal-' || p.portal_id::text AS newsletter_campaign_id,
  p.portal_name || ' Monthly Newsletter' AS newsletter_campaign_name,
  'Main monthly newsletter campaign for portal ' || p.portal_name_key AS newsletter_campaign_description,
  p.portal_id,
  'main' AS newsletter_type,
  ''::character varying AS content_theme,
  'monthly' AS newsletter_campaign_publication_frequency,
  'draft' AS newsletter_campaign_status,
  now(),
  now()
FROM public.portals_db p
ON CONFLICT (newsletter_campaign_id) DO UPDATE
SET newsletter_campaign_name = EXCLUDED.newsletter_campaign_name,
    newsletter_campaign_description = EXCLUDED.newsletter_campaign_description,
    portal_id = EXCLUDED.portal_id,
    newsletter_type = EXCLUDED.newsletter_type,
    content_theme = EXCLUDED.content_theme,
    newsletter_campaign_publication_frequency = EXCLUDED.newsletter_campaign_publication_frequency,
    newsletter_campaign_status = EXCLUDED.newsletter_campaign_status,
    newsletter_campaign_updated_at = now();

-- Una campaña específica por topic-portal, usando topics_db para obtener el contenido.
INSERT INTO public.newsletter_campaigns (
  newsletter_campaign_id,
  newsletter_campaign_name,
  newsletter_campaign_description,
  portal_id,
  newsletter_type,
  content_theme,
  newsletter_campaign_publication_frequency,
  newsletter_campaign_status,
  newsletter_campaign_created_at,
  newsletter_campaign_updated_at
)
SELECT
  'newsletter-campaign-specific-portal-' || tp.portal_id::text || '-topic-' || t.topic_id::text AS newsletter_campaign_id,
  p.portal_name || ' - ' || t.topic_name AS newsletter_campaign_name,
  coalesce(nullif(t.topic_description, ''), 'Specific newsletter campaign for topic ' || t.topic_name) AS newsletter_campaign_description,
  tp.portal_id,
  'specific' AS newsletter_type,
  t.topic_name AS content_theme,
  'monthly' AS newsletter_campaign_publication_frequency,
  'draft' AS newsletter_campaign_status,
  now(),
  now()
FROM public.topic_portals tp
INNER JOIN public.topics_db t
  ON t.topic_id = tp.topic_id
INNER JOIN public.portals_db p
  ON p.portal_id = tp.portal_id
ON CONFLICT (newsletter_campaign_id) DO UPDATE
SET newsletter_campaign_name = EXCLUDED.newsletter_campaign_name,
    newsletter_campaign_description = EXCLUDED.newsletter_campaign_description,
    portal_id = EXCLUDED.portal_id,
    newsletter_type = EXCLUDED.newsletter_type,
    content_theme = EXCLUDED.content_theme,
    newsletter_campaign_publication_frequency = EXCLUDED.newsletter_campaign_publication_frequency,
    newsletter_campaign_status = EXCLUDED.newsletter_campaign_status,
    newsletter_campaign_updated_at = now();

COMMIT;

-- ======================================================================
-- END 072_seed_newsletter_campaigns.sql
-- ======================================================================

