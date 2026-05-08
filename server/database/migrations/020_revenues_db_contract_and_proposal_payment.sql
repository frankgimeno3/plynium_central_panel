-- 020_revenues_db_contract_and_proposal_payment.sql
-- Links forecasted revenues to the contract and originating proposal payment (panel / RDS schema style).
-- Note: PostgreSQL does not support inserting a column at a specific position; logically these sit with reference.

BEGIN;

ALTER TABLE public.revenues_db
  ADD COLUMN IF NOT EXISTS contract_id VARCHAR(64) NULL;

ALTER TABLE public.revenues_db
  ADD COLUMN IF NOT EXISTS proposal_payment_id UUID NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'revenues_db_contract_id_fkey'
  ) THEN
    ALTER TABLE public.revenues_db
      ADD CONSTRAINT revenues_db_contract_id_fkey
      FOREIGN KEY (contract_id) REFERENCES public.contracts_db(contract_id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'revenues_db_proposal_payment_id_fkey'
  ) THEN
    ALTER TABLE public.revenues_db
      ADD CONSTRAINT revenues_db_proposal_payment_id_fkey
      FOREIGN KEY (proposal_payment_id) REFERENCES public.proposal_payments(proposal_payment_id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS revenues_db_contract_id_idx ON public.revenues_db (contract_id);
CREATE INDEX IF NOT EXISTS revenues_db_proposal_payment_id_idx ON public.revenues_db (proposal_payment_id);

COMMIT;
