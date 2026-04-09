-- 080_revenues_db_add_customer_name.sql
-- Restores/adds denormalized customer display name (e.g. after 079 dropped it).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'revenues_db'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE public.revenues_db
      ADD COLUMN customer_name VARCHAR(255) NULL DEFAULT ''::character varying;
  END IF;
END $$;
