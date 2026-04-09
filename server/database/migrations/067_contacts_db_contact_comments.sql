-- 067_contacts_db_contact_comments.sql
-- contacts_db: renombra columnas a canon (contact_*), elimina comments JSONB y crea contact_comments.
-- Backfill:
-- - comments JSONB[] -> contact_comments (agent_id NULL)
-- - user_list_array + id_user -> contact_user_id_array (TEXT[])
-- Idempotente: si ya existe contact_id en contacts_db, no hace nada (solo asegura contact_comments + trigger).

CREATE OR REPLACE FUNCTION public.set_contact_comments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.contact_comment_updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.contact_comments (
  contact_comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id VARCHAR(255) NOT NULL,
  agent_id VARCHAR(255) NULL,
  contact_comment_content TEXT NOT NULL DEFAULT ''::text,
  contact_comment_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_comment_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_comments_contact_id_idx ON public.contact_comments (contact_id);
CREATE INDEX IF NOT EXISTS contact_comments_agent_id_idx ON public.contact_comments (agent_id);
DROP TRIGGER IF EXISTS contact_comments_updated_at ON public.contact_comments;
CREATE TRIGGER contact_comments_updated_at
  BEFORE UPDATE ON public.contact_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_contact_comments_updated_at();

DO $$
DECLARE
  has_contact_id boolean;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contacts_db'
  ) THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts_db' AND column_name = 'contact_id'
  ) INTO has_contact_id;

  IF has_contact_id THEN
    -- Ensure FK constraints after migration (best-effort).
    BEGIN
      ALTER TABLE public.contact_comments
        ADD CONSTRAINT contact_comments_contact_id_fkey
        FOREIGN KEY (contact_id) REFERENCES public.contacts_db(contact_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER TABLE public.contact_comments
        ADD CONSTRAINT contact_comments_agent_id_fkey
        FOREIGN KEY (agent_id) REFERENCES public.agents_db(agent_id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    RETURN;
  END IF;

  -- Backfill comments JSONB into contact_comments (if column exists).
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contacts_db' AND column_name='comments'
  ) THEN
    INSERT INTO public.contact_comments (contact_id, agent_id, contact_comment_content, contact_comment_created_at, contact_comment_updated_at)
    SELECT
      c.id_contact,
      NULL,
      COALESCE(elem->>'text', '')::text,
      CASE
        WHEN (elem ? 'date') AND (elem->>'date') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
          THEN (elem->>'date')::date::timestamptz
        ELSE now()
      END,
      CASE
        WHEN (elem ? 'date') AND (elem->>'date') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
          THEN (elem->>'date')::date::timestamptz
        ELSE now()
      END
    FROM public.contacts_db c
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(c.comments, '[]'::jsonb)) elem
    WHERE COALESCE(elem->>'text','') <> '';
  END IF;

  -- Rename base columns
  ALTER TABLE public.contacts_db RENAME COLUMN id_contact TO contact_id;
  ALTER TABLE public.contacts_db RENAME COLUMN name TO contact_name;
  ALTER TABLE public.contacts_db ADD COLUMN IF NOT EXISTS contact_surnames VARCHAR(255) NULL DEFAULT ''::character varying;
  ALTER TABLE public.contacts_db RENAME COLUMN role TO contact_role;
  ALTER TABLE public.contacts_db RENAME COLUMN email TO contact_email;
  ALTER TABLE public.contacts_db RENAME COLUMN phone TO contact_phone;
  ALTER TABLE public.contacts_db RENAME COLUMN id_customer TO customer_id;
  ALTER TABLE public.contacts_db RENAME COLUMN company_name TO customer_company_name;
  ALTER TABLE public.contacts_db RENAME COLUMN linkedin_profile TO contact_linkedin_url;
  ALTER TABLE public.contacts_db RENAME COLUMN based_in_country TO contact_based_in_country;

  -- user_list_array becomes canonical array; merge id_user into it; then drop id_user legacy column.
  ALTER TABLE public.contacts_db RENAME COLUMN user_list_array TO contact_user_id_array;

  UPDATE public.contacts_db
  SET contact_user_id_array = (
    SELECT COALESCE(array_agg(DISTINCT v) FILTER (WHERE v IS NOT NULL AND v <> ''), '{}'::text[])
    FROM unnest(
      COALESCE(contact_user_id_array, '{}'::text[])
      || CASE WHEN COALESCE(id_user,'') <> '' THEN ARRAY[id_user]::text[] ELSE '{}'::text[] END
    ) AS v
  );

  ALTER TABLE public.contacts_db DROP COLUMN IF EXISTS id_user;

  -- Rename timestamps
  ALTER TABLE public.contacts_db RENAME COLUMN created_at TO contact_created_at;
  ALTER TABLE public.contacts_db RENAME COLUMN updated_at TO contact_updated_at;

  -- Drop JSONB comments
  ALTER TABLE public.contacts_db DROP COLUMN IF EXISTS comments;

  -- Indexes
  DROP INDEX IF EXISTS public.contacts_db_name_idx;
  DROP INDEX IF EXISTS public.contacts_db_id_customer_idx;
  DROP INDEX IF EXISTS public.contacts_db_email_idx;
  DROP INDEX IF EXISTS public.contacts_db_company_name_idx;

  CREATE INDEX IF NOT EXISTS contacts_db_contact_name_idx ON public.contacts_db (contact_name);
  CREATE INDEX IF NOT EXISTS contacts_db_customer_id_idx ON public.contacts_db (customer_id);
  CREATE INDEX IF NOT EXISTS contacts_db_contact_email_idx ON public.contacts_db (contact_email);
  CREATE INDEX IF NOT EXISTS contacts_db_customer_company_name_idx ON public.contacts_db (customer_company_name);

  -- FK constraints for contact_comments now that contact_id exists.
  BEGIN
    ALTER TABLE public.contact_comments
      ADD CONSTRAINT contact_comments_contact_id_fkey
      FOREIGN KEY (contact_id) REFERENCES public.contacts_db(contact_id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER TABLE public.contact_comments
      ADD CONSTRAINT contact_comments_agent_id_fkey
      FOREIGN KEY (agent_id) REFERENCES public.agents_db(agent_id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

