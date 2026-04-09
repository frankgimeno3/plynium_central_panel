-- 071_issued_invoices_invoice_payment_date.sql
-- Añade invoice_payment_date (nullable); backfill desde invoice_issue_date donde falte.
-- Idempotente: si la columna ya existe, no hace nada.

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
    WHERE table_schema = 'public' AND table_name = 'issued_invoices_db' AND column_name = 'invoice_payment_date'
  ) THEN
    RETURN;
  END IF;

  ALTER TABLE public.issued_invoices_db
    ADD COLUMN invoice_payment_date DATE NULL;

  UPDATE public.issued_invoices_db
  SET invoice_payment_date = invoice_issue_date::date
  WHERE invoice_payment_date IS NULL;

  CREATE INDEX IF NOT EXISTS issued_invoices_db_payment_date_idx ON public.issued_invoices_db (invoice_payment_date);
END $$;
