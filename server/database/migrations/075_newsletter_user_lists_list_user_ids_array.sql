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
