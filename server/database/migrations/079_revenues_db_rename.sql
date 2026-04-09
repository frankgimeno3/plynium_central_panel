-- 079_revenues_db_rename.sql
-- revenues_db: canonical revenue_* column names; expected vs real payment dates.

CREATE OR REPLACE FUNCTION public.set_revenues_db_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.revenue_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'revenues_db'
  ) THEN
    RETURN;
  END IF;

  BEGIN
    ALTER TABLE public.revenues_db DROP CONSTRAINT IF EXISTS revenues_db_id_customer_fkey;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_id'
  ) THEN
    ALTER TABLE public.revenues_db RENAME COLUMN id TO revenue_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'id_customer'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.revenues_db RENAME COLUMN id_customer TO customer_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'label'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_label'
  ) THEN
    ALTER TABLE public.revenues_db RENAME COLUMN label TO revenue_label;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'reference'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_reference'
  ) THEN
    ALTER TABLE public.revenues_db RENAME COLUMN reference TO revenue_reference;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'amount_eur'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_expected_amount_eur'
  ) THEN
    ALTER TABLE public.revenues_db RENAME COLUMN amount_eur TO revenue_expected_amount_eur;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_expected_payment_date'
  ) THEN
    ALTER TABLE public.revenues_db RENAME COLUMN revenue_date TO revenue_expected_payment_date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_real_payment_date'
  ) THEN
    ALTER TABLE public.revenues_db ADD COLUMN revenue_real_payment_date DATE NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_real_amount_eur'
  ) THEN
    ALTER TABLE public.revenues_db ADD COLUMN revenue_real_amount_eur NUMERIC(14,2) NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_created_at'
  ) THEN
    ALTER TABLE public.revenues_db RENAME COLUMN created_at TO revenue_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_updated_at'
  ) THEN
    ALTER TABLE public.revenues_db RENAME COLUMN updated_at TO revenue_updated_at;
  END IF;

  BEGIN
    ALTER TABLE public.revenues_db
      ADD CONSTRAINT revenues_db_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers_db(customer_id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  DROP TRIGGER IF EXISTS revenues_db_updated_at ON public.revenues_db;
  CREATE TRIGGER revenues_db_updated_at
    BEFORE UPDATE ON public.revenues_db
    FOR EACH ROW EXECUTE FUNCTION public.set_revenues_db_updated_at();

  CREATE INDEX IF NOT EXISTS revenues_db_customer_id_idx ON public.revenues_db (customer_id);
  CREATE INDEX IF NOT EXISTS revenues_db_revenue_expected_payment_date_idx ON public.revenues_db (revenue_expected_payment_date);
END $$;
