-- 022_orders_db_revenues_order_id_link.sql
-- Rename revenues_db.reference -> order_id (panel RDS), sync with orders.order_id via orders_db.revenue_id.
BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'reference'
  ) THEN
    ALTER TABLE public.revenues_db RENAME COLUMN reference TO order_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_reference'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE public.revenues_db RENAME COLUMN revenue_reference TO order_id;
  END IF;
END $$;

ALTER TABLE public.revenues_db
  ADD COLUMN IF NOT EXISTS revenue_payment_status VARCHAR(64) NOT NULL DEFAULT 'pending';

ALTER TABLE public.revenues_db
  ADD COLUMN IF NOT EXISTS revenue_real_payment_date DATE NULL;

ALTER TABLE public.orders_db
  ALTER COLUMN invoice_id DROP NOT NULL;

ALTER TABLE public.orders_db
  ADD COLUMN IF NOT EXISTS revenue_id VARCHAR(255) NULL;

ALTER TABLE public.orders_db
  ADD COLUMN IF NOT EXISTS order_collection_date DATE NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_db_revenue_id_fkey') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'id'
    ) THEN
      ALTER TABLE public.orders_db
        ADD CONSTRAINT orders_db_revenue_id_fkey
        FOREIGN KEY (revenue_id) REFERENCES public.revenues_db(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS orders_db_revenue_id_idx ON public.orders_db (revenue_id);

CREATE UNIQUE INDEX IF NOT EXISTS revenues_db_order_id_unique_idx
  ON public.revenues_db (order_id)
  WHERE order_id IS NOT NULL AND btrim(order_id::text) <> '';

COMMIT;
