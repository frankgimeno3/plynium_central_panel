-- 073_newsletter_campaign_portals.sql
-- Tabla puente para asociar una newsletter_campaign a múltiples portales.

BEGIN;

CREATE TABLE IF NOT EXISTS public.newsletter_campaign_portals (
  newsletter_campaign_id VARCHAR(255) NOT NULL REFERENCES public.newsletter_campaigns(newsletter_campaign_id) ON DELETE CASCADE,
  portal_id INTEGER NOT NULL REFERENCES public.portals_db(portal_id) ON DELETE CASCADE,
  newsletter_campaign_portal_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (newsletter_campaign_id, portal_id)
);

CREATE INDEX IF NOT EXISTS newsletter_campaign_portals_campaign_idx
  ON public.newsletter_campaign_portals (newsletter_campaign_id);
CREATE INDEX IF NOT EXISTS newsletter_campaign_portals_portal_idx
  ON public.newsletter_campaign_portals (portal_id);

-- Backfill: asegurar que el portal "principal" de la campaña existe en la tabla puente
INSERT INTO public.newsletter_campaign_portals (newsletter_campaign_id, portal_id)
SELECT c.newsletter_campaign_id, c.portal_id
FROM public.newsletter_campaigns c
WHERE c.portal_id IS NOT NULL
ON CONFLICT (newsletter_campaign_id, portal_id) DO NOTHING;

COMMIT;

