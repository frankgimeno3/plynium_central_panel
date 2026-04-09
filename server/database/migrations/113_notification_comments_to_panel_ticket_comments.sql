-- 113_notification_comments_to_panel_ticket_comments.sql
-- Renombra notification_comments -> panel_ticket_comments y columnas al esquema panel_ticket_comment_*.

ALTER TABLE IF EXISTS public.notification_comments
  DROP CONSTRAINT IF EXISTS notification_comments_panel_ticket_id_fkey;
ALTER TABLE IF EXISTS public.panel_ticket_comments
  DROP CONSTRAINT IF EXISTS panel_ticket_comments_panel_ticket_id_fkey;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notification_comments'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_comments'
  ) THEN
    ALTER TABLE public.notification_comments RENAME TO panel_ticket_comments;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'panel_ticket_comments' AND c.conname = 'notification_comments_pkey'
  ) THEN
    ALTER TABLE public.panel_ticket_comments RENAME CONSTRAINT notification_comments_pkey TO panel_ticket_comments_pkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_comments' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.panel_ticket_comments RENAME COLUMN id TO panel_ticket_comment_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_comments' AND column_name = 'date'
  ) THEN
    ALTER TABLE public.panel_ticket_comments RENAME COLUMN date TO panel_ticket_comment_date;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_ticket_comments' AND column_name = 'content'
  ) THEN
    ALTER TABLE public.panel_ticket_comments RENAME COLUMN content TO panel_ticket_comment_content;
  END IF;
END $$;

ALTER TABLE public.panel_ticket_comments DROP COLUMN IF EXISTS created_at;

ALTER TABLE public.panel_ticket_comments ADD COLUMN IF NOT EXISTS agent_id VARCHAR(255) NULL
  REFERENCES public.agents_db (agent_id) ON DELETE SET NULL;

DROP INDEX IF EXISTS public.notification_comments_panel_ticket_id_idx;
DROP INDEX IF EXISTS public.notification_comments_date_idx;
CREATE INDEX IF NOT EXISTS panel_ticket_comments_panel_ticket_id_idx ON public.panel_ticket_comments (panel_ticket_id);
CREATE INDEX IF NOT EXISTS panel_ticket_comments_panel_ticket_comment_date_idx ON public.panel_ticket_comments (panel_ticket_comment_date);
CREATE INDEX IF NOT EXISTS panel_ticket_comments_agent_id_idx ON public.panel_ticket_comments (agent_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'S' AND c.relname = 'notification_comments_id_seq'
  ) THEN
    ALTER SEQUENCE public.notification_comments_id_seq RENAME TO panel_ticket_comments_panel_ticket_comment_id_seq;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'panel_ticket_comments'
      AND c.conname = 'panel_ticket_comments_panel_ticket_id_fkey'
  ) THEN
    ALTER TABLE public.panel_ticket_comments
      ADD CONSTRAINT panel_ticket_comments_panel_ticket_id_fkey
      FOREIGN KEY (panel_ticket_id) REFERENCES public.panel_tickets (panel_ticket_id) ON DELETE CASCADE;
  END IF;
END $$;
