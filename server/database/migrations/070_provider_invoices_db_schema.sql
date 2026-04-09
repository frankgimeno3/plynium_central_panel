-- 070_provider_invoices_db_schema.sql
-- provider_invoices_db: PK provider_invoice_id; provider_id; invoice_*; provider_company_name; elimina label.
-- Idempotente: si ya existe provider_invoice_id, solo asegura trigger.

CREATE OR REPLACE FUNCTION public.set_provider_invoices_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.invoice_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'provider_invoices_db'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_invoices_db' AND column_name = 'provider_invoice_id'
  ) THEN
    DROP TRIGGER IF EXISTS provider_invoices_db_updated_at ON public.provider_invoices_db;
    CREATE TRIGGER provider_invoices_db_updated_at
      BEFORE UPDATE ON public.provider_invoices_db
      FOR EACH ROW EXECUTE FUNCTION public.set_provider_invoices_updated_at();
    RETURN;
  END IF;

  -- Drop FK on id_provider (name may vary)
  BEGIN
    ALTER TABLE public.provider_invoices_db DROP CONSTRAINT IF EXISTS provider_invoices_db_id_provider_fkey;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  -- New columns before renames
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_invoices_db' AND column_name = 'invoice_issue_date'
  ) THEN
    ALTER TABLE public.provider_invoices_db ADD COLUMN invoice_issue_date DATE NOT NULL DEFAULT CURRENT_DATE;
    UPDATE public.provider_invoices_db SET invoice_issue_date = payment_date::date;
    ALTER TABLE public.provider_invoices_db ALTER COLUMN invoice_issue_date DROP DEFAULT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provider_invoices_db' AND column_name = 'invoice_provider_reference_number'
  ) THEN
    ALTER TABLE public.provider_invoices_db ADD COLUMN invoice_provider_reference_number VARCHAR(512) NOT NULL DEFAULT ''::character varying;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'provider_invoices_db' AND column_name = 'label'
    ) THEN
      UPDATE public.provider_invoices_db SET invoice_provider_reference_number = COALESCE(label, '');
    END IF;
  END IF;

  ALTER TABLE public.provider_invoices_db RENAME COLUMN id TO provider_invoice_id;
  ALTER TABLE public.provider_invoices_db RENAME COLUMN id_provider TO provider_id;
  ALTER TABLE public.provider_invoices_db RENAME COLUMN provider_name TO provider_company_name;
  ALTER TABLE public.provider_invoices_db RENAME COLUMN amount_eur TO invoice_amount_eur;
  ALTER TABLE public.provider_invoices_db RENAME COLUMN payment_date TO invoice_payment_date;
  ALTER TABLE public.provider_invoices_db RENAME COLUMN created_at TO invoice_created_at;
  ALTER TABLE public.provider_invoices_db RENAME COLUMN updated_at TO invoice_updated_at;

  -- Drop FK on provider_id if duplicate from partial rename
  BEGIN
    ALTER TABLE public.provider_invoices_db DROP CONSTRAINT IF EXISTS provider_invoices_db_provider_id_fkey;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE public.provider_invoices_db
      ADD CONSTRAINT provider_invoices_db_provider_id_fkey
      FOREIGN KEY (provider_id) REFERENCES public.providers_db(provider_id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  DROP INDEX IF EXISTS public.provider_invoices_db_provider_idx;
  DROP INDEX IF EXISTS public.provider_invoices_db_payment_date_idx;
  CREATE INDEX IF NOT EXISTS provider_invoices_db_provider_idx ON public.provider_invoices_db (provider_id);
  CREATE INDEX IF NOT EXISTS provider_invoices_db_payment_date_idx ON public.provider_invoices_db (invoice_payment_date);

  ALTER TABLE public.provider_invoices_db DROP COLUMN IF EXISTS label;

  DROP TRIGGER IF EXISTS provider_invoices_db_updated_at ON public.provider_invoices_db;
  CREATE TRIGGER provider_invoices_db_updated_at
    BEFORE UPDATE ON public.provider_invoices_db
    FOR EACH ROW EXECUTE FUNCTION public.set_provider_invoices_updated_at();
END $$;
