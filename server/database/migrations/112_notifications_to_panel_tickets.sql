-- 112_notifications_to_panel_tickets.sql
-- Renombra public.notifications -> panel_tickets y columnas al esquema panel_ticket_*.
-- notification_comments / notification_company_content: notification_id -> panel_ticket_id.

ALTER TABLE IF EXISTS public.notification_comments
  DROP CONSTRAINT IF EXISTS notification_comments_notification_id_fkey;
ALTER TABLE IF EXISTS public.notification_comments
  DROP CONSTRAINT IF EXISTS notification_comments_panel_ticket_id_fkey;

ALTER TABLE IF EXISTS public.notification_company_content
  DROP CONSTRAINT IF EXISTS notification_company_content_notification_id_fkey;
ALTER TABLE IF EXISTS public.notification_company_content
  DROP CONSTRAINT IF EXISTS notification_company_content_panel_ticket_id_fkey;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'panel_tickets'
  ) THEN
    ALTER TABLE public.notifications RENAME TO panel_tickets;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'panel_tickets' AND c.conname = 'notifications_pkey'
  ) THEN
    ALTER TABLE public.panel_tickets RENAME CONSTRAINT notifications_pkey TO panel_tickets_pkey;
  END IF;
END $$;

DROP INDEX IF EXISTS public.notifications_notification_type_idx;
DROP INDEX IF EXISTS public.notifications_state_idx;
DROP INDEX IF EXISTS public.notifications_date_idx;
DROP INDEX IF EXISTS public.notifications_notification_category_idx;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_tickets' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.panel_tickets RENAME COLUMN id TO panel_ticket_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_tickets' AND column_name = 'notification_type'
  ) THEN
    ALTER TABLE public.panel_tickets RENAME COLUMN notification_type TO panel_ticket_type;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_tickets' AND column_name = 'notification_category'
  ) THEN
    ALTER TABLE public.panel_tickets RENAME COLUMN notification_category TO panel_ticket_category;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_tickets' AND column_name = 'state'
  ) THEN
    ALTER TABLE public.panel_tickets RENAME COLUMN state TO panel_ticket_state;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_tickets' AND column_name = 'date'
  ) THEN
    ALTER TABLE public.panel_tickets RENAME COLUMN date TO panel_ticket_date;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_tickets' AND column_name = 'brief_description'
  ) THEN
    ALTER TABLE public.panel_tickets RENAME COLUMN brief_description TO panel_ticket_brief_description;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_tickets' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.panel_tickets RENAME COLUMN description TO panel_ticket_full_description;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_tickets' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.panel_tickets RENAME COLUMN created_at TO panel_ticket_created_at;
  END IF;
END $$;

-- user_id -> panel_ticket_related_to_user_id_array (TEXT[]; UUIDs como texto)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_tickets' AND column_name = 'user_id'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_tickets' AND column_name = 'panel_ticket_related_to_user_id_array'
  ) THEN
    ALTER TABLE public.panel_tickets ADD COLUMN panel_ticket_related_to_user_id_array TEXT[] NOT NULL DEFAULT '{}'::text[];
    UPDATE public.panel_tickets
    SET panel_ticket_related_to_user_id_array = CASE
      WHEN NULLIF(TRIM(user_id), '') IS NOT NULL THEN ARRAY[NULLIF(TRIM(user_id), '')]::text[]
      ELSE '{}'::text[]
    END;
    ALTER TABLE public.panel_tickets DROP COLUMN user_id;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_tickets' AND column_name = 'user_id'
  ) THEN
    UPDATE public.panel_tickets
    SET panel_ticket_related_to_user_id_array = CASE
      WHEN NULLIF(TRIM(user_id), '') IS NOT NULL
        AND COALESCE(panel_ticket_related_to_user_id_array, '{}') = '{}'::text[]
      THEN ARRAY[NULLIF(TRIM(user_id), '')]::text[]
      ELSE panel_ticket_related_to_user_id_array
    END;
    ALTER TABLE public.panel_tickets DROP COLUMN user_id;
  END IF;
END $$;

ALTER TABLE public.panel_tickets ADD COLUMN IF NOT EXISTS panel_ticket_related_to_user_id_array TEXT[] NOT NULL DEFAULT '{}'::text[];

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_tickets' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.panel_tickets DROP COLUMN updated_at;
  END IF;
END $$;

ALTER TABLE public.panel_tickets ADD COLUMN IF NOT EXISTS panel_ticket_updates_array JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.panel_tickets DROP COLUMN IF EXISTS sender_email;
ALTER TABLE public.panel_tickets DROP COLUMN IF EXISTS sender_company;
ALTER TABLE public.panel_tickets DROP COLUMN IF EXISTS sender_contact_phone;
ALTER TABLE public.panel_tickets DROP COLUMN IF EXISTS country;

CREATE INDEX IF NOT EXISTS panel_tickets_panel_ticket_type_idx ON public.panel_tickets (panel_ticket_type);
CREATE INDEX IF NOT EXISTS panel_tickets_panel_ticket_state_idx ON public.panel_tickets (panel_ticket_state);
CREATE INDEX IF NOT EXISTS panel_tickets_panel_ticket_date_idx ON public.panel_tickets (panel_ticket_date);
CREATE INDEX IF NOT EXISTS panel_tickets_panel_ticket_category_idx ON public.panel_tickets (panel_ticket_category);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_comments' AND column_name = 'notification_id'
  ) THEN
    ALTER TABLE public.notification_comments RENAME COLUMN notification_id TO panel_ticket_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_company_content' AND column_name = 'notification_id'
  ) THEN
    ALTER TABLE public.notification_company_content RENAME COLUMN notification_id TO panel_ticket_id;
  END IF;
END $$;

DROP INDEX IF EXISTS public.notification_comments_notification_id_idx;
CREATE INDEX IF NOT EXISTS notification_comments_panel_ticket_id_idx ON public.notification_comments (panel_ticket_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'notification_comments'
      AND c.conname = 'notification_comments_panel_ticket_id_fkey'
  ) THEN
    ALTER TABLE public.notification_comments
      ADD CONSTRAINT notification_comments_panel_ticket_id_fkey
      FOREIGN KEY (panel_ticket_id) REFERENCES public.panel_tickets (panel_ticket_id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'notification_company_content'
      AND c.conname = 'notification_company_content_panel_ticket_id_fkey'
  ) THEN
    ALTER TABLE public.notification_company_content
      ADD CONSTRAINT notification_company_content_panel_ticket_id_fkey
      FOREIGN KEY (panel_ticket_id) REFERENCES public.panel_tickets (panel_ticket_id) ON DELETE CASCADE;
  END IF;
END $$;
