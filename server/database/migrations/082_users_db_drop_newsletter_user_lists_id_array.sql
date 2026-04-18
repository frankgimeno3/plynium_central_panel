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
