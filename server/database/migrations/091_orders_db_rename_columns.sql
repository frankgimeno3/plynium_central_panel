-- 091_orders_db_rename_columns.sql
-- Normalize orders_db column names to canonical order_* schema.

CREATE OR REPLACE FUNCTION public.set_orders_db_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.order_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders_db'
  ) THEN
    CREATE TABLE public.orders_db (
      order_id VARCHAR(255) PRIMARY KEY,
      invoice_id VARCHAR(255) NOT NULL,
      contract_id VARCHAR(255) NULL,
      customer_id VARCHAR(255) NULL,
      customer_company_name VARCHAR(255) NULL,
      agent_id VARCHAR(255) NULL,
      order_payment_status VARCHAR(255) NOT NULL,
      order_total_amount_eur NUMERIC(14,2) NOT NULL DEFAULT 0,
      order_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      order_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;

  -- Renames from legacy schema.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='order_code'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='order_id'
  ) THEN
    ALTER TABLE public.orders_db RENAME COLUMN order_code TO order_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='id_contract'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='contract_id'
  ) THEN
    ALTER TABLE public.orders_db RENAME COLUMN id_contract TO contract_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='client_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='customer_id'
  ) THEN
    ALTER TABLE public.orders_db RENAME COLUMN client_id TO customer_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='client_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='customer_company_name'
  ) THEN
    ALTER TABLE public.orders_db RENAME COLUMN client_name TO customer_company_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='agent'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='agent_id'
  ) THEN
    ALTER TABLE public.orders_db RENAME COLUMN agent TO agent_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='payment_status'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='order_payment_status'
  ) THEN
    ALTER TABLE public.orders_db RENAME COLUMN payment_status TO order_payment_status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='amount_eur'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='order_total_amount_eur'
  ) THEN
    ALTER TABLE public.orders_db RENAME COLUMN amount_eur TO order_total_amount_eur;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='order_created_at'
  ) THEN
    ALTER TABLE public.orders_db RENAME COLUMN created_at TO order_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='order_updated_at'
  ) THEN
    ALTER TABLE public.orders_db RENAME COLUMN updated_at TO order_updated_at;
  END IF;

  -- Ensure required canonical columns exist.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='invoice_id'
  ) THEN
    ALTER TABLE public.orders_db ADD COLUMN invoice_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='contract_id'
  ) THEN
    ALTER TABLE public.orders_db ADD COLUMN contract_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='customer_id'
  ) THEN
    ALTER TABLE public.orders_db ADD COLUMN customer_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='customer_company_name'
  ) THEN
    ALTER TABLE public.orders_db ADD COLUMN customer_company_name VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='agent_id'
  ) THEN
    ALTER TABLE public.orders_db ADD COLUMN agent_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='order_payment_status'
  ) THEN
    ALTER TABLE public.orders_db ADD COLUMN order_payment_status VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='order_total_amount_eur'
  ) THEN
    ALTER TABLE public.orders_db ADD COLUMN order_total_amount_eur NUMERIC(14,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='order_created_at'
  ) THEN
    ALTER TABLE public.orders_db ADD COLUMN order_created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders_db' AND column_name='order_updated_at'
  ) THEN
    ALTER TABLE public.orders_db ADD COLUMN order_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  -- Drop legacy indexes and create canonical ones.
  DROP INDEX IF EXISTS public.orders_db_invoice_id_idx;
  DROP INDEX IF EXISTS public.orders_db_id_contract_idx;
  DROP INDEX IF EXISTS public.orders_db_client_id_idx;
  DROP INDEX IF EXISTS public.orders_db_collection_date_idx;
  DROP INDEX IF EXISTS public.orders_db_payment_status_idx;

  CREATE INDEX IF NOT EXISTS orders_db_invoice_id_idx ON public.orders_db (invoice_id);
  CREATE INDEX IF NOT EXISTS orders_db_contract_id_idx ON public.orders_db (contract_id);
  CREATE INDEX IF NOT EXISTS orders_db_customer_id_idx ON public.orders_db (customer_id);
  CREATE INDEX IF NOT EXISTS orders_db_order_payment_status_idx ON public.orders_db (order_payment_status);

  -- Keep order_updated_at current on UPDATE.
  DROP TRIGGER IF EXISTS orders_db_updated_at ON public.orders_db;
  CREATE TRIGGER orders_db_updated_at
    BEFORE UPDATE ON public.orders_db
    FOR EACH ROW EXECUTE FUNCTION public.set_orders_db_updated_at();

  -- Drop leftover legacy columns not present in canonical schema.
  ALTER TABLE public.orders_db DROP COLUMN IF EXISTS contract_code;
  ALTER TABLE public.orders_db DROP COLUMN IF EXISTS id_contact;
  ALTER TABLE public.orders_db DROP COLUMN IF EXISTS collection_date;

  ALTER TABLE public.orders_db DROP COLUMN IF EXISTS order_code;
  ALTER TABLE public.orders_db DROP COLUMN IF EXISTS id_contract;
  ALTER TABLE public.orders_db DROP COLUMN IF EXISTS client_id;
  ALTER TABLE public.orders_db DROP COLUMN IF EXISTS client_name;
  ALTER TABLE public.orders_db DROP COLUMN IF EXISTS agent;
  ALTER TABLE public.orders_db DROP COLUMN IF EXISTS payment_status;
  ALTER TABLE public.orders_db DROP COLUMN IF EXISTS amount_eur;
  ALTER TABLE public.orders_db DROP COLUMN IF EXISTS created_at;
  ALTER TABLE public.orders_db DROP COLUMN IF EXISTS updated_at;
END $$;

