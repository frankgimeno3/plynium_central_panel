-- 023_publication_preferential_slots.sql
-- Bridge table linking magazine publications to standard preferential slots (publication_slots_db).

CREATE TABLE IF NOT EXISTS public.publication_preferential_slots (
  preferential_slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  magazine_id VARCHAR(255) NOT NULL,
  publication_id VARCHAR(255) NOT NULL,
  position_in_magazine VARCHAR(255) NOT NULL,
  publication_slot_id INTEGER NOT NULL,
  service_group_id UUID NOT NULL,
  state VARCHAR(32) NOT NULL DEFAULT 'available'::character varying,
  proposal_id_array TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  assigned_customer_id VARCHAR(255) NULL,
  contract_id VARCHAR(64) NULL,
  CONSTRAINT publication_preferential_slots_state_check
    CHECK (state IN ('offered', 'bought', 'available', 'assigned')),
  CONSTRAINT publication_preferential_slots_magazine_id_fkey
    FOREIGN KEY (magazine_id) REFERENCES public.magazines_db (magazine_id) ON DELETE CASCADE,
  CONSTRAINT publication_preferential_slots_publication_id_fkey
    FOREIGN KEY (publication_id) REFERENCES public.publications_db (publication_id) ON DELETE CASCADE,
  CONSTRAINT publication_preferential_slots_publication_slot_id_fkey
    FOREIGN KEY (publication_slot_id) REFERENCES public.publication_slots_db (publication_slot_id) ON DELETE CASCADE,
  CONSTRAINT publication_preferential_slots_service_group_id_fkey
    FOREIGN KEY (service_group_id) REFERENCES public.service_groups (service_group_id) ON DELETE RESTRICT,
  CONSTRAINT publication_preferential_slots_contract_id_fkey
    FOREIGN KEY (contract_id) REFERENCES public.contracts_db (contract_id) ON DELETE SET NULL,
  CONSTRAINT publication_preferential_slots_pub_position_uidx UNIQUE (publication_id, position_in_magazine)
);

CREATE INDEX IF NOT EXISTS publication_preferential_slots_magazine_id_idx
  ON public.publication_preferential_slots (magazine_id);

CREATE INDEX IF NOT EXISTS publication_preferential_slots_publication_id_idx
  ON public.publication_preferential_slots (publication_id);

CREATE INDEX IF NOT EXISTS publication_preferential_slots_service_group_id_idx
  ON public.publication_preferential_slots (service_group_id);

COMMENT ON TABLE public.publication_preferential_slots IS 'Canonical preferential page slots per magazine publication (links to publication_slots_db rows).';

COMMENT ON COLUMN public.publication_preferential_slots.state IS 'Lifecycle: offered, bought, available (default on create), assigned.';

COMMENT ON COLUMN public.publication_preferential_slots.proposal_id_array IS 'Proposal ids competing for this placement (offer stage); cleared when sold (bought).';

COMMENT ON COLUMN public.publication_preferential_slots.assigned_customer_id IS 'Soft hold: customer_id, or literals summary / advertiser_index.';

COMMENT ON COLUMN public.publication_preferential_slots.contract_id IS 'Set when the placement is bought (sold) via accepting a proposal.';
