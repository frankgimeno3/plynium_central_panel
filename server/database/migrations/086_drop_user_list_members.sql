-- 086_drop_user_list_members.sql
-- Copia membresías a users_db.newsletter_user_lists_id_array y elimina user_list_members.

DO $$
BEGIN
  IF to_regclass('public.user_list_members') IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users_db' AND column_name = 'newsletter_user_lists_id_array'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_list_members' AND column_name = 'newsletter_user_list_id'
    ) THEN
      UPDATE public.users_db u
      SET newsletter_user_lists_id_array = m.arr
      FROM (
        SELECT user_id, ARRAY_AGG(newsletter_user_list_id ORDER BY newsletter_user_list_id) AS arr
        FROM public.user_list_members
        GROUP BY user_id
      ) m
      WHERE u.user_id = m.user_id;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_list_members' AND column_name = 'list_id'
    ) THEN
      UPDATE public.users_db u
      SET newsletter_user_lists_id_array = m.arr
      FROM (
        SELECT user_id, ARRAY_AGG(list_id ORDER BY list_id) AS arr
        FROM public.user_list_members
        GROUP BY user_id
      ) m
      WHERE u.user_id = m.user_id;
    END IF;
  END IF;

  DROP TABLE public.user_list_members CASCADE;
END $$;
