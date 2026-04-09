-- 083_newsletters_to_newsletters_db.sql
-- Rename newsletters -> newsletters_db; canonical newsletter_* columns; portal_id; UUID[] lists.

CREATE OR REPLACE FUNCTION public.set_newsletters_db_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.newsletter_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  r RECORD;
  merged UUID[];
  uuid_text TEXT;
  has_list_id BOOLEAN;
  has_sent_json BOOLEAN;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'newsletters_db'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters_db' AND column_name = 'newsletter_id'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'newsletters'
  ) THEN
    RETURN;
  END IF;

  -- This migration may rename `updated_at` -> `newsletter_updated_at`.
  -- If an old generic trigger still calls `public.set_updated_at()` (NEW.updated_at = now()),
  -- any UPDATE on `public.newsletters` will fail after the rename.
  -- Drop those triggers up-front so the data backfills below can run safely.
  FOR r IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_namespace pn ON pn.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'newsletters'
      AND NOT t.tgisinternal
      AND pn.nspname = 'public'
      AND p.proname = 'set_updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.newsletters', r.tgname);
  END LOOP;

  ALTER TABLE public.newsletter_content_blocks
    DROP CONSTRAINT IF EXISTS newsletter_content_blocks_id_newsletter_fkey;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'id_campaign'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'newsletter_campaign_id'
  ) THEN
    ALTER TABLE public.newsletters RENAME COLUMN id_campaign TO newsletter_campaign_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'id_newsletter'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'newsletter_id'
  ) THEN
    ALTER TABLE public.newsletters RENAME COLUMN id_newsletter TO newsletter_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'estimated_publish_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'newsletter_estimated_publication_date'
  ) THEN
    ALTER TABLE public.newsletters RENAME COLUMN estimated_publish_date TO newsletter_estimated_publication_date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'newsletter_real_publication_date'
  ) THEN
    ALTER TABLE public.newsletters ADD COLUMN newsletter_real_publication_date DATE NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'topic'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'newsletter_topic'
  ) THEN
    ALTER TABLE public.newsletters RENAME COLUMN topic TO newsletter_topic;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'status'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'newsletter_status'
  ) THEN
    ALTER TABLE public.newsletters RENAME COLUMN status TO newsletter_status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'newsletter_created_at'
  ) THEN
    ALTER TABLE public.newsletters RENAME COLUMN created_at TO newsletter_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'newsletter_updated_at'
  ) THEN
    ALTER TABLE public.newsletters RENAME COLUMN updated_at TO newsletter_updated_at;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'portal_id'
  ) THEN
    ALTER TABLE public.newsletters ADD COLUMN portal_id INTEGER NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'portal_code'
  ) THEN
    UPDATE public.newsletters n
    SET portal_id = p.portal_id
    FROM public.portals_id p
    WHERE n.portal_id IS NULL
      AND (
        p.portal_name_key = n.portal_code
        OR p.portal_name = n.portal_code
        OR CAST(p.portal_id AS TEXT) = n.portal_code
      );

    UPDATE public.newsletters n
    SET portal_id = sub.first_portal
    FROM (
      SELECT portal_id AS first_portal FROM public.portals_id ORDER BY portal_id ASC LIMIT 1
    ) sub
    WHERE n.portal_id IS NULL;

    ALTER TABLE public.newsletters DROP COLUMN portal_code;
  END IF;

  BEGIN
    ALTER TABLE public.newsletters
      ADD CONSTRAINT newsletters_portal_id_fkey
      FOREIGN KEY (portal_id) REFERENCES public.portals_id(portal_id) ON DELETE RESTRICT;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'newsletter_user_list_id_array'
  ) THEN
    ALTER TABLE public.newsletters ADD COLUMN newsletter_user_list_id_array UUID[] NULL;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'user_newsletter_list_id'
  ) INTO has_list_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'sent_to_lists'
  ) INTO has_sent_json;

  IF has_list_id AND has_sent_json THEN
    FOR r IN SELECT newsletter_id, user_newsletter_list_id, sent_to_lists FROM public.newsletters
    LOOP
      merged := ARRAY[]::UUID[];
      IF r.user_newsletter_list_id IS NOT NULL
         AND r.user_newsletter_list_id::TEXT ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        merged := array_append(merged, r.user_newsletter_list_id::UUID);
      END IF;
      IF r.sent_to_lists IS NOT NULL AND jsonb_typeof(r.sent_to_lists) = 'array' THEN
        FOR uuid_text IN SELECT jsonb_array_elements_text(COALESCE(r.sent_to_lists, '[]'::jsonb))
        LOOP
          IF uuid_text IS NOT NULL
             AND uuid_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
             AND NOT (uuid_text::UUID = ANY (merged)) THEN
            merged := array_append(merged, uuid_text::UUID);
          END IF;
        END LOOP;
      END IF;
      IF coalesce(array_length(merged, 1), 0) = 0 THEN
        UPDATE public.newsletters SET newsletter_user_list_id_array = NULL WHERE newsletter_id = r.newsletter_id;
      ELSE
        UPDATE public.newsletters SET newsletter_user_list_id_array = merged WHERE newsletter_id = r.newsletter_id;
      END IF;
    END LOOP;
  ELSIF has_list_id THEN
    FOR r IN SELECT newsletter_id, user_newsletter_list_id FROM public.newsletters
    LOOP
      IF r.user_newsletter_list_id IS NOT NULL
         AND r.user_newsletter_list_id::TEXT ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        UPDATE public.newsletters
        SET newsletter_user_list_id_array = ARRAY[r.user_newsletter_list_id::UUID]
        WHERE newsletter_id = r.newsletter_id;
      ELSE
        UPDATE public.newsletters SET newsletter_user_list_id_array = NULL WHERE newsletter_id = r.newsletter_id;
      END IF;
    END LOOP;
  ELSIF has_sent_json THEN
    FOR r IN SELECT newsletter_id, sent_to_lists FROM public.newsletters
    LOOP
      merged := ARRAY[]::UUID[];
      IF r.sent_to_lists IS NOT NULL AND jsonb_typeof(r.sent_to_lists) = 'array' THEN
        FOR uuid_text IN SELECT jsonb_array_elements_text(COALESCE(r.sent_to_lists, '[]'::jsonb))
        LOOP
          IF uuid_text IS NOT NULL
             AND uuid_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
             AND NOT (uuid_text::UUID = ANY (merged)) THEN
            merged := array_append(merged, uuid_text::UUID);
          END IF;
        END LOOP;
      END IF;
      IF coalesce(array_length(merged, 1), 0) = 0 THEN
        UPDATE public.newsletters SET newsletter_user_list_id_array = NULL WHERE newsletter_id = r.newsletter_id;
      ELSE
        UPDATE public.newsletters SET newsletter_user_list_id_array = merged WHERE newsletter_id = r.newsletter_id;
      END IF;
    END LOOP;
  END IF;

  ALTER TABLE public.newsletters DROP COLUMN IF EXISTS user_newsletter_list_id;
  ALTER TABLE public.newsletters DROP COLUMN IF EXISTS sent_to_lists;

  ALTER TABLE public.newsletters ALTER COLUMN portal_id SET NOT NULL;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'newsletters'
  ) THEN
    ALTER TABLE public.newsletters RENAME TO newsletters_db;
  END IF;

  BEGIN
    ALTER TABLE public.newsletter_content_blocks
      ADD CONSTRAINT newsletter_content_blocks_id_newsletter_fkey
      FOREIGN KEY (id_newsletter) REFERENCES public.newsletters_db(newsletter_id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  DROP TRIGGER IF EXISTS newsletters_db_updated_at ON public.newsletters_db;
  CREATE TRIGGER newsletters_db_updated_at
    BEFORE UPDATE ON public.newsletters_db
    FOR EACH ROW EXECUTE FUNCTION public.set_newsletters_db_updated_at();

  CREATE INDEX IF NOT EXISTS newsletters_db_campaign_idx ON public.newsletters_db (newsletter_campaign_id);
  CREATE INDEX IF NOT EXISTS newsletters_db_estimated_pub_idx ON public.newsletters_db (newsletter_estimated_publication_date);
END $$;
