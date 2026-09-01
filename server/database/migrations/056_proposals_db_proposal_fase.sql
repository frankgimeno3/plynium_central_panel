-- Wizard step for in-progress proposals: "1".."4" or "created" when finished via create flow.

BEGIN;

ALTER TABLE public.proposals_db
  ADD COLUMN IF NOT EXISTS proposal_fase VARCHAR(32) NOT NULL DEFAULT '1';

UPDATE public.proposals_db
SET proposal_fase = '1'
WHERE proposal_fase IS NULL OR TRIM(proposal_fase) = '';

COMMIT;
