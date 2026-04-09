-- 084_user_lists_to_newsletter_user_lists.sql
-- user_lists -> newsletter_user_lists; canonical newsletter_user_list_* columns.

DO $$
DECLARE
  first_portal INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'newsletter_user_lists'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletter_user_lists' AND column_name = 'newsletter_user_list_id'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_lists'
  ) THEN
    RETURN;
  END IF;

  SELECT portal_id INTO first_portal FROM public.portals_id ORDER BY portal_id ASC LIMIT 1;

  IF to_regclass('public.user_list_members') IS NOT NULL THEN
    ALTER TABLE public.user_list_members
      DROP CONSTRAINT IF EXISTS user_list_members_list_id_fkey;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_lists' AND column_name = 'newsletter_user_list_description'
  ) THEN
    ALTER TABLE public.user_lists ADD COLUMN newsletter_user_list_description TEXT NULL DEFAULT ''::text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_lists' AND column_name = 'newsletter_user_list_portals_array_id'
  ) THEN
    ALTER TABLE public.user_lists ADD COLUMN newsletter_user_list_portals_array_id INTEGER[] NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_lists' AND column_name = 'portal'
  ) THEN
    UPDATE public.user_lists ul
    SET newsletter_user_list_portals_array_id = COALESCE(
      (
        SELECT ARRAY_AGG(x.portal_id)
        FROM (
          SELECT p.portal_id
          FROM public.portals_id p
          WHERE p.portal_name_key = ul.portal OR p.portal_name = ul.portal OR CAST(p.portal_id AS TEXT) = ul.portal
          ORDER BY p.portal_id
          LIMIT 1
        ) x
      ),
      ARRAY[]::INTEGER[]
    );

    IF first_portal IS NOT NULL THEN
      UPDATE public.user_lists
      SET newsletter_user_list_portals_array_id = ARRAY[first_portal]
      WHERE newsletter_user_list_portals_array_id IS NULL
         OR COALESCE(CARDINALITY(newsletter_user_list_portals_array_id), 0) = 0;
    END IF;

    ALTER TABLE public.user_lists DROP COLUMN portal;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts_db' AND column_name = 'contact_user_id_array'
  ) THEN
    UPDATE public.contacts_db c
    SET contact_user_id_array = COALESCE(sub.new_arr, '{}'::TEXT[])
    FROM (
      SELECT c2.contact_id,
        ARRAY(
          SELECT COALESCE(ul.id::TEXT, e.elem)
          FROM UNNEST(c2.contact_user_id_array) WITH ORDINALITY AS e(elem, ord)
          LEFT JOIN public.user_lists ul ON ul.list_code = e.elem OR ul.id::TEXT = e.elem
          ORDER BY e.ord
        ) AS new_arr
      FROM public.contacts_db c2
      WHERE c2.contact_user_id_array IS NOT NULL AND COALESCE(CARDINALITY(c2.contact_user_id_array), 0) > 0
    ) sub
    WHERE c.contact_id = sub.contact_id;
  END IF;

  ALTER TABLE public.user_lists DROP CONSTRAINT IF EXISTS user_lists_list_code_key;
  ALTER TABLE public.user_lists DROP COLUMN IF EXISTS list_code;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_lists' AND column_name = 'id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_lists' AND column_name = 'newsletter_user_list_id'
  ) THEN
    ALTER TABLE public.user_lists RENAME COLUMN id TO newsletter_user_list_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_lists' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.user_lists RENAME COLUMN name TO newsletter_user_list_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_lists' AND column_name = 'topic'
  ) THEN
    ALTER TABLE public.user_lists RENAME COLUMN topic TO newsletter_user_list_topic;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_lists' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.user_lists RENAME COLUMN created_at TO newsletter_user_list_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_lists' AND column_name = 'newsletter_user_list_description'
  ) THEN
    UPDATE public.user_lists SET newsletter_user_list_description = '' WHERE newsletter_user_list_description IS NULL;
  END IF;

  ALTER TABLE public.user_lists ALTER COLUMN newsletter_user_list_portals_array_id SET NOT NULL;
  ALTER TABLE public.user_lists ALTER COLUMN newsletter_user_list_portals_array_id SET DEFAULT '{}'::INTEGER[];

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_lists'
  ) THEN
    ALTER TABLE public.user_lists RENAME TO newsletter_user_lists;
  END IF;

  IF to_regclass('public.user_list_members') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_list_members' AND column_name = 'list_id'
    ) THEN
      ALTER TABLE public.user_list_members RENAME COLUMN list_id TO newsletter_user_list_id;
    END IF;

    BEGIN
      ALTER TABLE public.user_list_members
        ADD CONSTRAINT user_list_members_newsletter_user_list_id_fkey
        FOREIGN KEY (newsletter_user_list_id) REFERENCES public.newsletter_user_lists(newsletter_user_list_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
