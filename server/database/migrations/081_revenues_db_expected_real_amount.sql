-- 081_revenues_db_expected_real_amount.sql
-- revenue_amount_eur -> revenue_expected_amount_eur; add revenue_real_amount_eur (actual collected amount).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'revenues_db'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_amount_eur'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_expected_amount_eur'
  ) THEN
    ALTER TABLE public.revenues_db RENAME COLUMN revenue_amount_eur TO revenue_expected_amount_eur;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues_db' AND column_name = 'revenue_real_amount_eur'
  ) THEN
    ALTER TABLE public.revenues_db
      ADD COLUMN revenue_real_amount_eur NUMERIC(14,2) NULL;
  END IF;
END $$;
