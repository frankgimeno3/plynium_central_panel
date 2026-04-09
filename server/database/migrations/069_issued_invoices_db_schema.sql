-- 069_issued_invoices_db_schema.sql
-- issued_invoices_db: columnas invoice_*, contract_id, customer_id, customer_company, agent_id.
-- Fusiona id_contract + contract_code -> contract_id; elimina contract_code.
-- Idempotente: si ya existe contract_id, no hace nada.

CREATE OR REPLACE FUNCTION public.set_issued_invoices_updated_at()
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
    WHERE table_schema = 'public' AND table_name = 'issued_invoices_db'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'issued_invoices_db' AND column_name = 'contract_id'
  ) THEN
    DROP TRIGGER IF EXISTS issued_invoices_db_updated_at ON public.issued_invoices_db;
    CREATE TRIGGER issued_invoices_db_updated_at
      BEFORE UPDATE ON public.issued_invoices_db
      FOR EACH ROW EXECUTE FUNCTION public.set_issued_invoices_updated_at();
    RETURN;
  END IF;

  -- Renames (legacy -> canon)
  ALTER TABLE public.issued_invoices_db RENAME COLUMN id_contract TO contract_id;
  ALTER TABLE public.issued_invoices_db RENAME COLUMN client_id TO customer_id;
  ALTER TABLE public.issued_invoices_db RENAME COLUMN client_name TO customer_company;
  ALTER TABLE public.issued_invoices_db RENAME COLUMN agent TO agent_id;
  ALTER TABLE public.issued_invoices_db RENAME COLUMN amount_eur TO invoice_amount_eur;
  ALTER TABLE public.issued_invoices_db RENAME COLUMN issue_date TO invoice_issue_date;
  ALTER TABLE public.issued_invoices_db RENAME COLUMN created_at TO invoice_created_at;
  ALTER TABLE public.issued_invoices_db RENAME COLUMN updated_at TO invoice_updated_at;

  -- Merge contract_code into contract_id when contract_id empty
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'issued_invoices_db' AND column_name = 'contract_code'
  ) THEN
    UPDATE public.issued_invoices_db
    SET contract_id = COALESCE(NULLIF(TRIM(contract_id), ''), NULLIF(TRIM(contract_code), ''))
    WHERE contract_id IS NULL OR TRIM(contract_id) = '';
    ALTER TABLE public.issued_invoices_db DROP COLUMN contract_code;
  END IF;

  DROP INDEX IF EXISTS public.issued_invoices_db_id_contract_idx;
  DROP INDEX IF EXISTS public.issued_invoices_db_client_id_idx;
  CREATE INDEX IF NOT EXISTS issued_invoices_db_contract_id_idx ON public.issued_invoices_db (contract_id);
  CREATE INDEX IF NOT EXISTS issued_invoices_db_customer_id_idx ON public.issued_invoices_db (customer_id);

  DROP TRIGGER IF EXISTS issued_invoices_db_updated_at ON public.issued_invoices_db;
  CREATE TRIGGER issued_invoices_db_updated_at
    BEFORE UPDATE ON public.issued_invoices_db
    FOR EACH ROW EXECUTE FUNCTION public.set_issued_invoices_updated_at();
END $$;
