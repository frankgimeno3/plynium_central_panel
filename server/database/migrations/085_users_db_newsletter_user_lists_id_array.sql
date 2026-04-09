-- 085_users_db_newsletter_user_lists_id_array.sql
-- users_db.newsletter_user_lists_id_array: UUID[] de newsletter_user_list_id (canónico tras 086 sin user_list_members).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users_db' AND column_name = 'newsletter_user_lists_id_array'
  ) THEN
    ALTER TABLE public.users_db
      ADD COLUMN newsletter_user_lists_id_array UUID[] NOT NULL DEFAULT '{}'::uuid[];
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_list_members' AND column_name = 'newsletter_user_list_id'
  ) THEN
    UPDATE public.users_db u
    SET newsletter_user_lists_id_array = m.arr
    FROM (
      SELECT ulm.user_id,
        ARRAY_AGG(ulm.newsletter_user_list_id ORDER BY ulm.newsletter_user_list_id) AS arr
      FROM public.user_list_members ulm
      GROUP BY ulm.user_id
    ) m
    WHERE u.user_id = m.user_id
      AND COALESCE(CARDINALITY(u.newsletter_user_lists_id_array), 0) = 0;
  END IF;
END $$;
