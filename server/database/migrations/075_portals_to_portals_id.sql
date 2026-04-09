-- 075_portals_to_portals_id.sql
-- Renames public.portals -> public.portals_id; columns portal_id, portal_name, portal_name_key, etc.
-- Drops/recreates FKs from bridge tables; updates get_default_portal_id().

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all FKs that reference public.portals(id)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'portals'
  ) THEN
    FOR r IN (
      SELECT c.conname::text AS cname,
             n.nspname AS sch,
             rel.relname AS tbl
      FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE c.contype = 'f'
        AND c.confrelid = 'public.portals'::regclass
    ) LOOP
      EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', r.sch, r.tbl, r.cname);
    END LOOP;

    DROP INDEX IF EXISTS public.portals_key;
    DROP INDEX IF EXISTS public.portals_domain;

    ALTER TABLE public.portals RENAME TO portals_id;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'portal_id'
    ) THEN
      ALTER TABLE public.portals_id RENAME COLUMN id TO portal_id;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'key'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'portal_name_key'
    ) THEN
      ALTER TABLE public.portals_id RENAME COLUMN key TO portal_name_key;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'name'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'portal_name'
    ) THEN
      ALTER TABLE public.portals_id RENAME COLUMN name TO portal_name;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'domain'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'portal_domain'
    ) THEN
      ALTER TABLE public.portals_id RENAME COLUMN domain TO portal_domain;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'default_locale'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'portal_default_locale'
    ) THEN
      ALTER TABLE public.portals_id RENAME COLUMN default_locale TO portal_default_locale;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'theme'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'portal_theme'
    ) THEN
      ALTER TABLE public.portals_id RENAME COLUMN theme TO portal_theme;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'created_at'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'portal_created_at'
    ) THEN
      ALTER TABLE public.portals_id RENAME COLUMN created_at TO portal_created_at;
    END IF;

    CREATE INDEX IF NOT EXISTS portals_id_portal_name_key_idx ON public.portals_id (portal_name_key);
    CREATE INDEX IF NOT EXISTS portals_id_portal_domain_idx ON public.portals_id (portal_domain);
  END IF;

  -- Partial state: table already portals_id but columns not renamed
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'portals_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'portal_id'
    ) THEN
      ALTER TABLE public.portals_id RENAME COLUMN id TO portal_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='portals_id' AND column_name='key')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='portals_id' AND column_name='portal_name_key') THEN
      ALTER TABLE public.portals_id RENAME COLUMN key TO portal_name_key;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='portals_id' AND column_name='name')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='portals_id' AND column_name='portal_name') THEN
      ALTER TABLE public.portals_id RENAME COLUMN name TO portal_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='portals_id' AND column_name='domain')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='portals_id' AND column_name='portal_domain') THEN
      ALTER TABLE public.portals_id RENAME COLUMN domain TO portal_domain;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='portals_id' AND column_name='default_locale')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='portals_id' AND column_name='portal_default_locale') THEN
      ALTER TABLE public.portals_id RENAME COLUMN default_locale TO portal_default_locale;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='portals_id' AND column_name='theme')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='portals_id' AND column_name='portal_theme') THEN
      ALTER TABLE public.portals_id RENAME COLUMN theme TO portal_theme;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='portals_id' AND column_name='created_at')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='portals_id' AND column_name='portal_created_at') THEN
      ALTER TABLE public.portals_id RENAME COLUMN created_at TO portal_created_at;
    END IF;
    CREATE INDEX IF NOT EXISTS portals_id_portal_name_key_idx ON public.portals_id (portal_name_key);
    CREATE INDEX IF NOT EXISTS portals_id_portal_domain_idx ON public.portals_id (portal_domain);
  END IF;

  -- Recreate FKs after portal_id column exists (idempotent)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'portals_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portals_id' AND column_name = 'portal_id'
  ) THEN
    BEGIN
      ALTER TABLE public.company_portals
        ADD CONSTRAINT company_portals_portal_id_fkey
        FOREIGN KEY (portal_id) REFERENCES public.portals_id(portal_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.product_portals
        ADD CONSTRAINT product_portals_portal_id_fkey
        FOREIGN KEY (portal_id) REFERENCES public.portals_id(portal_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.company_categories_portal
        ADD CONSTRAINT company_categories_portal_portal_id_fkey
        FOREIGN KEY (portal_id) REFERENCES public.portals_id(portal_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.portal_banners
        ADD CONSTRAINT portal_banners_portal_id_fkey
        FOREIGN KEY (portal_id) REFERENCES public.portals_id(portal_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.article_portals
        ADD CONSTRAINT article_portals_article_portal_ref_id_fkey
        FOREIGN KEY (article_portal_ref_id) REFERENCES public.portals_id(portal_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.event_portals
        ADD CONSTRAINT event_portals_portal_id_fkey
        FOREIGN KEY (portal_id) REFERENCES public.portals_id(portal_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'publication_portals'
    ) THEN
      BEGIN
        ALTER TABLE public.publication_portals
          ADD CONSTRAINT publication_portals_portal_id_fkey
          FOREIGN KEY (portal_id) REFERENCES public.portals_id(portal_id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_default_portal_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT portal_id FROM public.portals_id ORDER BY portal_created_at ASC NULLS LAST, portal_id ASC LIMIT 1;
$$;
