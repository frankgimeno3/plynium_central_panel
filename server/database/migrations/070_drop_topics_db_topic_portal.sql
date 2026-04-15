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

