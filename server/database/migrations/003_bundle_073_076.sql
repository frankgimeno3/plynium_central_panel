-- 003_bundle_073_076.sql
-- Bundled from migrations 073 to 076 (original files preserved below).

-- ======================================================================
-- BEGIN 073_newsletter_campaign_portals.sql
-- ======================================================================

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

-- ======================================================================
-- END 073_newsletter_campaign_portals.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 074_seed_newsletter_user_lists_from_campaigns.sql
-- ======================================================================

-- 074_seed_newsletter_user_lists_from_campaigns.sql
-- 1) Rebuild newsletter_user_lists: one list per newsletter_campaigns row
-- 2) Add newsletter_campaigns.newsletter_user_lists_id_array with corresponding ids

BEGIN;

-- Ensure campaign column exists
ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS newsletter_user_lists_id_array UUID[] NOT NULL DEFAULT '{}'::uuid[];

-- Remove existing lists (requested) and clear references where applicable
TRUNCATE TABLE public.newsletter_user_lists;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users_db'
      AND column_name = 'newsletter_user_lists_id_array'
  ) THEN
    UPDATE public.users_db
    SET newsletter_user_lists_id_array = '{}'::uuid[]
    WHERE newsletter_user_lists_id_array IS NOT NULL
      AND cardinality(newsletter_user_lists_id_array) > 0;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'newsletters_db'
      AND column_name = 'newsletter_user_list_id_array'
  ) THEN
    UPDATE public.newsletters_db
    SET newsletter_user_list_id_array = NULL
    WHERE newsletter_user_list_id_array IS NOT NULL
      AND cardinality(newsletter_user_list_id_array) > 0;
  END IF;
END $$;

WITH mapping AS (
  SELECT
    c.newsletter_campaign_id,
    gen_random_uuid() AS list_id,
    c.newsletter_campaign_name AS list_name,
    NULLIF(c.content_theme, '') AS list_topic,
    ('Auto-generated for campaign ' || c.newsletter_campaign_id) AS list_description
  FROM public.newsletter_campaigns c
),
ins AS (
  INSERT INTO public.newsletter_user_lists (
    newsletter_user_list_id,
    newsletter_user_list_name,
    newsletter_user_list_topic,
    newsletter_user_list_description
  )
  SELECT
    m.list_id,
    m.list_name,
    m.list_topic,
    m.list_description
  FROM mapping m
)
UPDATE public.newsletter_campaigns c
SET newsletter_user_lists_id_array = ARRAY[m.list_id]::uuid[]
FROM mapping m
WHERE c.newsletter_campaign_id = m.newsletter_campaign_id;

COMMIT;

-- ======================================================================
-- END 074_seed_newsletter_user_lists_from_campaigns.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 075_newsletter_user_lists_list_user_ids_array.sql
-- ======================================================================

-- 075_newsletter_user_lists_list_user_ids_array.sql
-- Replace newsletter_user_list_portals_array_id with list_user_ids_array (UUIDs of users in the list).

BEGIN;

ALTER TABLE public.newsletter_user_lists
  ADD COLUMN IF NOT EXISTS list_user_ids_array UUID[] NOT NULL DEFAULT '{}'::uuid[];

-- Populate from users_db memberships (newsletter_user_lists_id_array), when available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users_db'
      AND column_name = 'newsletter_user_lists_id_array'
  ) THEN
    UPDATE public.newsletter_user_lists nul
    SET list_user_ids_array = COALESCE(sub.ids, '{}'::uuid[])
    FROM (
      SELECT
        lid::uuid AS list_id,
        array_agg(DISTINCT u.user_id) FILTER (WHERE u.user_id IS NOT NULL) AS ids
      FROM public.users_db u
      CROSS JOIN LATERAL unnest(COALESCE(u.newsletter_user_lists_id_array, '{}'::uuid[])) AS lid
      GROUP BY lid
    ) sub
    WHERE nul.newsletter_user_list_id = sub.list_id;
  END IF;
END $$;

ALTER TABLE public.newsletter_user_lists
  DROP COLUMN IF EXISTS newsletter_user_list_portals_array_id;

COMMIT;

-- ======================================================================
-- END 075_newsletter_user_lists_list_user_ids_array.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 076_seed_magazines_per_portal.sql
-- ======================================================================

-- 076_seed_magazines_per_portal.sql
-- Una revista por defecto en magazines_db para cada portal en portals_db, excepto plynium.
-- magazine_id estable por portal_id (idempotente con ON CONFLICT).

INSERT INTO public.magazines_db (
  magazine_id,
  magazine_name,
  magazine_description,
  magazine_starting_year,
  magazine_periodicity,
  magazine_subscriber_number
)
SELECT
  'magazine-portal-' || p.portal_id::text,
  left(btrim(p.portal_name::text) || ' Magazine', 255),
  left(
    'Primary publication magazine for portal ' || btrim(p.portal_name_key::text) || '.',
    10000
  ),
  extract(year from timezone('UTC', now()))::integer,
  'monthly',
  NULL
FROM public.portals_db p
WHERE lower(btrim(p.portal_name_key::text)) <> 'plynium'
ON CONFLICT (magazine_id) DO UPDATE SET
  magazine_name = EXCLUDED.magazine_name,
  magazine_description = EXCLUDED.magazine_description,
  magazine_starting_year = EXCLUDED.magazine_starting_year,
  magazine_periodicity = EXCLUDED.magazine_periodicity,
  magazine_subscriber_number = EXCLUDED.magazine_subscriber_number;

-- ======================================================================
-- END 076_seed_magazines_per_portal.sql
-- ======================================================================

