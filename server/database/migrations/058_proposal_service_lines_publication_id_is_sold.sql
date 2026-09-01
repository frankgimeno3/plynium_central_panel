-- 058_proposal_service_lines_publication_id_is_sold.sql
-- Links proposal lines to publications and tracks sold state after proposal acceptance.

BEGIN;

ALTER TABLE public.proposal_service_lines
  ADD COLUMN IF NOT EXISTS publication_id VARCHAR(64) NULL;

ALTER TABLE public.proposal_service_lines
  ADD COLUMN IF NOT EXISTS is_sold BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS proposal_service_lines_publication_id_idx
  ON public.proposal_service_lines (publication_id)
  WHERE publication_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS proposal_service_lines_publication_service_idx
  ON public.proposal_service_lines (publication_id, service_id)
  WHERE publication_id IS NOT NULL;

-- Backfill publication_id from embedded JSON or human-readable unit details.
UPDATE public.proposal_service_lines
SET publication_id = COALESCE(
  NULLIF(TRIM(substring(proposal_service_unit_details FROM '"id_planned_publication"\s*:\s*"([^"]+)"')), ''),
  NULLIF(TRIM(substring(proposal_service_unit_details FROM 'Publication id:\s*([^\s\n|]+)')), '')
)
WHERE publication_id IS NULL
  AND proposal_service_unit_details IS NOT NULL
  AND (
    proposal_service_unit_details ~ '"id_planned_publication"\s*:'
    OR proposal_service_unit_details ~ 'Publication id:'
  );

-- Lines on accepted proposals are sold.
UPDATE public.proposal_service_lines psl
SET is_sold = true
FROM public.proposals_db p
WHERE p.proposal_id = psl.proposal_id
  AND LOWER(TRIM(p.proposal_status)) = 'accepted'
  AND psl.is_sold = false;

COMMIT;
