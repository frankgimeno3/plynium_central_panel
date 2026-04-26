-- 005_bundle_081_084.sql
-- Bundled from migrations 081 to 084 (original files preserved below).

-- ======================================================================
-- BEGIN 081_newsletter_user_lists_newsletter_list_type.sql
-- ======================================================================

-- 081_newsletter_user_lists_newsletter_list_type.sql
-- Stores main vs specific on the list row (campaign lateral remains a fallback for older rows).

BEGIN;

ALTER TABLE public.newsletter_user_lists
  ADD COLUMN IF NOT EXISTS newsletter_list_type VARCHAR(32) NOT NULL DEFAULT 'specific';

-- Backfill from linked campaigns where possible
UPDATE public.newsletter_user_lists nul
SET newsletter_list_type = src.newsletter_type
FROM (
  SELECT DISTINCT ON (nul_inner.newsletter_user_list_id)
    nul_inner.newsletter_user_list_id,
    c.newsletter_type
  FROM public.newsletter_user_lists nul_inner
  INNER JOIN public.newsletter_campaigns c
    ON c.newsletter_user_lists_id_array @> ARRAY[nul_inner.newsletter_user_list_id]::uuid[]
  ORDER BY nul_inner.newsletter_user_list_id, c.newsletter_campaign_id ASC
) src
WHERE nul.newsletter_user_list_id = src.newsletter_user_list_id
  AND src.newsletter_type IN ('main', 'specific');

ALTER TABLE public.newsletter_user_lists
  DROP CONSTRAINT IF EXISTS newsletter_user_lists_newsletter_list_type_check;

ALTER TABLE public.newsletter_user_lists
  ADD CONSTRAINT newsletter_user_lists_newsletter_list_type_check
  CHECK (newsletter_list_type IN ('main', 'specific'));

COMMIT;

-- ======================================================================
-- END 081_newsletter_user_lists_newsletter_list_type.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 082_users_db_drop_newsletter_user_lists_id_array.sql
-- ======================================================================

-- 082_users_db_drop_newsletter_user_lists_id_array.sql
-- 1) Newsletter membership: backfill users_db.newsletter_user_lists_id_array into user_list_subscriptions (080),
--    then drop that column. Requires public.user_list_subscriptions (run 080 first).
-- 2) Drops users_db.user_preferences and users_db.user_employee_relations_array (no data migration).

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_list_subscriptions'
  ) THEN
    RAISE EXCEPTION 'user_list_subscriptions missing: apply 080_user_list_subscriptions.sql before 082';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users_db' AND column_name = 'newsletter_user_lists_id_array'
  ) THEN
    INSERT INTO public.user_list_subscriptions (user_id, newsletter_user_list_id)
    SELECT DISTINCT u.user_id, lid
    FROM public.users_db u
    CROSS JOIN LATERAL unnest(COALESCE(u.newsletter_user_lists_id_array, '{}'::uuid[])) AS lid
    INNER JOIN public.newsletter_user_lists n ON n.newsletter_user_list_id = lid
    WHERE cardinality(COALESCE(u.newsletter_user_lists_id_array, '{}'::uuid[])) > 0
    ON CONFLICT (user_id, newsletter_user_list_id) DO NOTHING;

    ALTER TABLE public.users_db DROP COLUMN newsletter_user_lists_id_array;
  END IF;

  ALTER TABLE public.users_db DROP COLUMN IF EXISTS user_preferences;
  ALTER TABLE public.users_db DROP COLUMN IF EXISTS user_employee_relations_array;
END $$;

COMMIT;

-- ======================================================================
-- END 082_users_db_drop_newsletter_user_lists_id_array.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 083_users_db_user_hasslogged_array.sql
-- ======================================================================

-- 083_users_db_user_hasslogged_array.sql
-- Tracks portal_id values for which the user has already received the first-login feed bootstrap
-- (neutral user_feed_preferences for all topic_portals topics of that portal).

BEGIN;

ALTER TABLE public.users_db
  ADD COLUMN IF NOT EXISTS user_hasslogged_array INTEGER[] NOT NULL DEFAULT '{}'::integer[];

COMMIT;

-- ======================================================================
-- END 083_users_db_user_hasslogged_array.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 084_user_notifications_portal_id.sql
-- ======================================================================

-- 084_user_notifications_portal_id.sql
-- Links notifications to a portal (e.g. welcome/tutorial on first portal login).

BEGIN;

ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS portal_id INTEGER NULL
  REFERENCES public.portals_db (portal_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_notifications_portal_id_idx ON public.user_notifications (portal_id);

COMMIT;

-- ======================================================================
-- END 084_user_notifications_portal_id.sql
-- ======================================================================

