-- 082_payments_db_rename_columns.sql
-- payments_db: canonical payment_* columns; expected vs real amount/date; provider_id FK.

CREATE OR REPLACE FUNCTION public.set_payments_db_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.payment_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments_db'
  ) THEN
    RETURN;
  END IF;

  BEGIN
    ALTER TABLE public.payments_db DROP CONSTRAINT IF EXISTS payments_db_id_provider_fkey;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE public.payments_db DROP CONSTRAINT IF EXISTS payments_db_provider_id_fkey;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE public.payments_db RENAME COLUMN id TO payment_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'id_provider'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE public.payments_db RENAME COLUMN id_provider TO provider_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'provider_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'payment_provider_name'
  ) THEN
    ALTER TABLE public.payments_db RENAME COLUMN provider_name TO payment_provider_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'label'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'payment_label'
  ) THEN
    ALTER TABLE public.payments_db RENAME COLUMN label TO payment_label;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'reference'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE public.payments_db RENAME COLUMN reference TO payment_reference;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'amount_eur'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'payment_expected_amount_eur'
  ) THEN
    ALTER TABLE public.payments_db RENAME COLUMN amount_eur TO payment_expected_amount_eur;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'payment_real_amount_eur'
  ) THEN
    ALTER TABLE public.payments_db ADD COLUMN payment_real_amount_eur NUMERIC(14,2) NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'payment_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'payment_expected_date'
  ) THEN
    ALTER TABLE public.payments_db RENAME COLUMN payment_date TO payment_expected_date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'payment_real_date'
  ) THEN
    ALTER TABLE public.payments_db ADD COLUMN payment_real_date DATE NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'payment_created_at'
  ) THEN
    ALTER TABLE public.payments_db RENAME COLUMN created_at TO payment_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'payment_updated_at'
  ) THEN
    ALTER TABLE public.payments_db RENAME COLUMN updated_at TO payment_updated_at;
  END IF;

  BEGIN
    ALTER TABLE public.payments_db
      ADD CONSTRAINT payments_db_provider_id_fkey
      FOREIGN KEY (provider_id) REFERENCES public.providers_db(provider_id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  DROP TRIGGER IF EXISTS payments_db_updated_at ON public.payments_db;
  CREATE TRIGGER payments_db_updated_at
    BEFORE UPDATE ON public.payments_db
    FOR EACH ROW EXECUTE FUNCTION public.set_payments_db_updated_at();

  CREATE INDEX IF NOT EXISTS payments_db_provider_id_idx ON public.payments_db (provider_id);
  CREATE INDEX IF NOT EXISTS payments_db_payment_expected_date_idx ON public.payments_db (payment_expected_date);
END $$;
