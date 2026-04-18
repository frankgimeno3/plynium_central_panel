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
