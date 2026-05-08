-- 026_publication_preferential_slots_proposal_contract.sql
-- Competing proposals, soft assignment, and sale via contract.

ALTER TABLE public.publication_preferential_slots
  ADD COLUMN IF NOT EXISTS proposal_id_array TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.publication_preferential_slots
  ADD COLUMN IF NOT EXISTS assigned_customer_id VARCHAR(255) NULL;

ALTER TABLE public.publication_preferential_slots
  ADD COLUMN IF NOT EXISTS contract_id VARCHAR(64) NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'publication_preferential_slots_contract_id_fkey'
  ) THEN
    ALTER TABLE public.publication_preferential_slots
      ADD CONSTRAINT publication_preferential_slots_contract_id_fkey
      FOREIGN KEY (contract_id) REFERENCES public.contracts_db (contract_id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS publication_preferential_slots_contract_id_idx
  ON public.publication_preferential_slots (contract_id)
  WHERE contract_id IS NOT NULL;

COMMENT ON COLUMN public.publication_preferential_slots.proposal_id_array IS
  'Proposal ids currently competing for this placement (offer stage).';

COMMENT ON COLUMN public.publication_preferential_slots.assigned_customer_id IS
  'Customer id holding a soft reservation, or literal summary / advertiser_index when reserved editorially.';

COMMENT ON COLUMN public.publication_preferential_slots.contract_id IS
  'Contract created when this placement was bought (sold).';
