-- 019_proposal_service_lines_publication_and_details.sql
-- Adds optional columns used by the panel/RDS for richer proposal line snapshots.

BEGIN;

ALTER TABLE public.proposal_service_lines
  ADD COLUMN IF NOT EXISTS proposal_service_publication_date DATE NULL;

ALTER TABLE public.proposal_service_lines
  ADD COLUMN IF NOT EXISTS proposal_service_unit_details TEXT NULL;

COMMIT;
