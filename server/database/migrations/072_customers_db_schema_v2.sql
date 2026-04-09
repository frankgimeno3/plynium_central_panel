-- 072_customers_db_schema_v2.sql
-- customers_db: migrate to canonical customer_* columns.
-- customer_comments: new table for customer comments.

CREATE OR REPLACE FUNCTION public.set_customer_comments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.customer_comment_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customers_db'
  ) THEN
    RETURN;
  END IF;

  -- Add canonical columns if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_account_name') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_account_name VARCHAR(512) NOT NULL DEFAULT ''::character varying;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_tax_id') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_tax_id VARCHAR(255) NULL DEFAULT ''::character varying;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_country') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_country VARCHAR(255) NULL DEFAULT ''::character varying;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_full_address') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_full_address TEXT NULL DEFAULT ''::text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_main_phone') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_main_phone VARCHAR(255) NULL DEFAULT ''::character varying;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_main_email') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_main_email VARCHAR(255) NULL DEFAULT ''::character varying;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_website') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_website VARCHAR(255) NULL DEFAULT ''::character varying;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_industry') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_industry VARCHAR(255) NULL DEFAULT ''::character varying;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_agent_id') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_agent_id VARCHAR(255) NULL DEFAULT ''::character varying;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_status') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_status VARCHAR(255) NULL DEFAULT 'active'::character varying;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_tags') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_tags TEXT[] NULL DEFAULT '{}'::text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_related_accounts') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_related_accounts TEXT[] NULL DEFAULT '{}'::text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_company_id_array') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_company_id_array TEXT[] NULL DEFAULT '{}'::text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_product_id_array') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_product_id_array TEXT[] NULL DEFAULT '{}'::text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_created_at') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_updated_at') THEN
    ALTER TABLE public.customers_db ADD COLUMN customer_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  -- Rename id_customer -> customer_id if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='id_customer')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='customer_id') THEN
    ALTER TABLE public.customers_db RENAME COLUMN id_customer TO customer_id;
  END IF;

  -- Backfill from legacy columns when present
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='name') THEN
    UPDATE public.customers_db
      SET customer_account_name = COALESCE(NULLIF(customer_account_name, ''), COALESCE(name, ''));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='cif') THEN
    UPDATE public.customers_db
      SET customer_tax_id = COALESCE(NULLIF(customer_tax_id, ''), COALESCE(cif, ''));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='country') THEN
    UPDATE public.customers_db
      SET customer_country = COALESCE(NULLIF(customer_country, ''), COALESCE(country, ''));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='address') THEN
    UPDATE public.customers_db
      SET customer_full_address = COALESCE(NULLIF(customer_full_address, ''), COALESCE(address, ''));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='phone') THEN
    UPDATE public.customers_db
      SET customer_main_phone = COALESCE(NULLIF(customer_main_phone, ''), COALESCE(phone, ''));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='email') THEN
    UPDATE public.customers_db
      SET customer_main_email = COALESCE(NULLIF(customer_main_email, ''), COALESCE(email, ''));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='website') THEN
    UPDATE public.customers_db
      SET customer_website = COALESCE(NULLIF(customer_website, ''), COALESCE(website, ''));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='industry') THEN
    UPDATE public.customers_db
      SET customer_industry = COALESCE(NULLIF(customer_industry, ''), COALESCE(industry, ''));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='owner') THEN
    UPDATE public.customers_db
      SET customer_agent_id = COALESCE(NULLIF(customer_agent_id, ''), COALESCE(owner, ''));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='status') THEN
    UPDATE public.customers_db
      SET customer_status = COALESCE(NULLIF(customer_status, ''), COALESCE(status, 'active'));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='tags') THEN
    UPDATE public.customers_db
      SET customer_tags = COALESCE(tags, '{}'::text[]);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='related_accounts') THEN
    UPDATE public.customers_db
      SET customer_related_accounts = COALESCE(related_accounts, '{}'::text[]);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='created_at') THEN
    UPDATE public.customers_db
      SET customer_created_at = COALESCE(customer_created_at, created_at);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers_db' AND column_name='updated_at') THEN
    UPDATE public.customers_db
      SET customer_updated_at = COALESCE(customer_updated_at, updated_at);
  END IF;

  -- Primary key: do NOT drop/recreate customers_db_pkey. Renaming id_customer -> customer_id
  -- keeps the same PK and PostgreSQL updates dependent FKs (e.g. revenues_db_id_customer_fkey).
  -- Dropping the PK fails with 2BP01 when other tables reference it.

  -- Drop legacy columns (leave only canonical list)
  ALTER TABLE public.customers_db
    DROP COLUMN IF EXISTS name,
    DROP COLUMN IF EXISTS cif,
    DROP COLUMN IF EXISTS country,
    DROP COLUMN IF EXISTS address,
    DROP COLUMN IF EXISTS phone,
    DROP COLUMN IF EXISTS email,
    DROP COLUMN IF EXISTS website,
    DROP COLUMN IF EXISTS industry,
    DROP COLUMN IF EXISTS segment,
    DROP COLUMN IF EXISTS owner,
    DROP COLUMN IF EXISTS source,
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS revenue_eur,
    DROP COLUMN IF EXISTS next_activity,
    DROP COLUMN IF EXISTS contact,
    DROP COLUMN IF EXISTS contacts,
    DROP COLUMN IF EXISTS comments,
    DROP COLUMN IF EXISTS proposals,
    DROP COLUMN IF EXISTS contracts,
    DROP COLUMN IF EXISTS projects,
    DROP COLUMN IF EXISTS portal_products,
    DROP COLUMN IF EXISTS company_categories_array,
    DROP COLUMN IF EXISTS created_at,
    DROP COLUMN IF EXISTS updated_at;

  -- Rebuild indexes
  DROP INDEX IF EXISTS public.customers_db_name_idx;
  DROP INDEX IF EXISTS public.customers_db_country_idx;
  DROP INDEX IF EXISTS public.customers_db_status_idx;
  DROP INDEX IF EXISTS public.customers_db_owner_idx;

  CREATE INDEX IF NOT EXISTS customers_db_account_name_idx ON public.customers_db (customer_account_name);
  CREATE INDEX IF NOT EXISTS customers_db_country_idx ON public.customers_db (customer_country);
  CREATE INDEX IF NOT EXISTS customers_db_status_idx ON public.customers_db (customer_status);
  CREATE INDEX IF NOT EXISTS customers_db_agent_id_idx ON public.customers_db (customer_agent_id);

  -- Create customer_comments table
  CREATE TABLE IF NOT EXISTS public.customer_comments (
    customer_comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL REFERENCES public.customers_db(customer_id) ON DELETE CASCADE,
    agent_id VARCHAR(255) NULL REFERENCES public.agents_db(agent_id) ON DELETE SET NULL,
    customer_comment_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    customer_comment_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS customer_comments_customer_id_idx ON public.customer_comments (customer_id);
  CREATE INDEX IF NOT EXISTS customer_comments_agent_id_idx ON public.customer_comments (agent_id);

  DROP TRIGGER IF EXISTS customer_comments_updated_at ON public.customer_comments;
  CREATE TRIGGER customer_comments_updated_at
    BEFORE UPDATE ON public.customer_comments
    FOR EACH ROW EXECUTE FUNCTION public.set_customer_comments_updated_at();
END $$;

