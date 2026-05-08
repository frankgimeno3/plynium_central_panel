-- 024_publication_preferential_slots_state.sql
-- Adds state column for deployments that ran 023 before state existed.

ALTER TABLE public.publication_preferential_slots
  ADD COLUMN IF NOT EXISTS state VARCHAR(32) NOT NULL DEFAULT 'available'::character varying;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'publication_preferential_slots_state_check'
  ) THEN
    ALTER TABLE public.publication_preferential_slots
      ADD CONSTRAINT publication_preferential_slots_state_check
      CHECK (state IN ('offered', 'bought', 'available', 'assigned'));
  END IF;
END $$;

COMMENT ON COLUMN public.publication_preferential_slots.state IS 'Lifecycle: offered, bought, available (default on create), assigned.';
