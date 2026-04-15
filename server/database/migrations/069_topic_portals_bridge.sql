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

