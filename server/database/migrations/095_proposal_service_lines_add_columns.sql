-- 095_proposal_service_lines_add_columns.sql
-- Add proposal_service_publication_date and proposal_service_unit_details to proposal_service_lines.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='proposal_service_lines'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='proposal_service_lines' AND column_name='proposal_service_publication_date'
  ) THEN
    ALTER TABLE public.proposal_service_lines
      ADD COLUMN proposal_service_publication_date DATE NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='proposal_service_lines' AND column_name='proposal_service_unit_details'
  ) THEN
    ALTER TABLE public.proposal_service_lines
      ADD COLUMN proposal_service_unit_details TEXT NOT NULL DEFAULT ''::text;
  END IF;
END $$;

