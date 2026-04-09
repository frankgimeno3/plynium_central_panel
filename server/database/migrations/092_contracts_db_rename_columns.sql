-- 092_contracts_db_rename_columns.sql
-- Normalize contracts_db column names to canonical contract_* schema.

CREATE OR REPLACE FUNCTION public.set_contracts_db_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.contract_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contracts_db'
  ) THEN
    CREATE TABLE public.contracts_db (
      contract_id VARCHAR(255) PRIMARY KEY,
      proposal_id VARCHAR(255) NOT NULL,
      customer_id VARCHAR(255) NOT NULL,
      agent_id VARCHAR(255) NULL DEFAULT ''::character varying,
      contract_process_state VARCHAR(255) NOT NULL,
      contract_payment_state VARCHAR(255) NOT NULL,
      contract_title VARCHAR(255) NOT NULL,
      contract_amount_eur NUMERIC(14,2) NULL DEFAULT 0,
      contract_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      contract_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;

  -- Renames from legacy schema.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='id_contract'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_id'
  ) THEN
    ALTER TABLE public.contracts_db RENAME COLUMN id_contract TO contract_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='id_proposal'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='proposal_id'
  ) THEN
    ALTER TABLE public.contracts_db RENAME COLUMN id_proposal TO proposal_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='id_customer'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='customer_id'
  ) THEN
    ALTER TABLE public.contracts_db RENAME COLUMN id_customer TO customer_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='agent'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='agent_id'
  ) THEN
    ALTER TABLE public.contracts_db RENAME COLUMN agent TO agent_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='process_state'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_process_state'
  ) THEN
    ALTER TABLE public.contracts_db RENAME COLUMN process_state TO contract_process_state;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='payment_state'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_payment_state'
  ) THEN
    ALTER TABLE public.contracts_db RENAME COLUMN payment_state TO contract_payment_state;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='title'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_title'
  ) THEN
    ALTER TABLE public.contracts_db RENAME COLUMN title TO contract_title;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='amount_eur'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_amount_eur'
  ) THEN
    ALTER TABLE public.contracts_db RENAME COLUMN amount_eur TO contract_amount_eur;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_created_at'
  ) THEN
    ALTER TABLE public.contracts_db RENAME COLUMN created_at TO contract_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_updated_at'
  ) THEN
    ALTER TABLE public.contracts_db RENAME COLUMN updated_at TO contract_updated_at;
  END IF;

  -- Ensure required canonical columns exist.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='proposal_id'
  ) THEN
    ALTER TABLE public.contracts_db ADD COLUMN proposal_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='customer_id'
  ) THEN
    ALTER TABLE public.contracts_db ADD COLUMN customer_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='agent_id'
  ) THEN
    ALTER TABLE public.contracts_db ADD COLUMN agent_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_process_state'
  ) THEN
    ALTER TABLE public.contracts_db ADD COLUMN contract_process_state VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_payment_state'
  ) THEN
    ALTER TABLE public.contracts_db ADD COLUMN contract_payment_state VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_title'
  ) THEN
    ALTER TABLE public.contracts_db ADD COLUMN contract_title VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_amount_eur'
  ) THEN
    ALTER TABLE public.contracts_db ADD COLUMN contract_amount_eur NUMERIC(14,2) NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_created_at'
  ) THEN
    ALTER TABLE public.contracts_db ADD COLUMN contract_created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contracts_db' AND column_name='contract_updated_at'
  ) THEN
    ALTER TABLE public.contracts_db ADD COLUMN contract_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  -- Drop legacy indexes and create canonical ones.
  DROP INDEX IF EXISTS public.contracts_db_id_customer_idx;
  DROP INDEX IF EXISTS public.contracts_db_id_proposal_idx;
  DROP INDEX IF EXISTS public.contracts_db_process_state_idx;
  DROP INDEX IF EXISTS public.contracts_db_payment_state_idx;
  DROP INDEX IF EXISTS public.contracts_db_agent_idx;

  CREATE INDEX IF NOT EXISTS contracts_db_customer_id_idx ON public.contracts_db (customer_id);
  CREATE INDEX IF NOT EXISTS contracts_db_proposal_id_idx ON public.contracts_db (proposal_id);
  CREATE INDEX IF NOT EXISTS contracts_db_contract_process_state_idx ON public.contracts_db (contract_process_state);
  CREATE INDEX IF NOT EXISTS contracts_db_contract_payment_state_idx ON public.contracts_db (contract_payment_state);
  CREATE INDEX IF NOT EXISTS contracts_db_agent_id_idx ON public.contracts_db (agent_id);

  -- Keep contract_updated_at current on UPDATE.
  DROP TRIGGER IF EXISTS contracts_db_updated_at ON public.contracts_db;
  CREATE TRIGGER contracts_db_updated_at
    BEFORE UPDATE ON public.contracts_db
    FOR EACH ROW EXECUTE FUNCTION public.set_contracts_db_updated_at();

  -- Drop leftover legacy columns.
  ALTER TABLE public.contracts_db DROP COLUMN IF EXISTS id_contract;
  ALTER TABLE public.contracts_db DROP COLUMN IF EXISTS id_proposal;
  ALTER TABLE public.contracts_db DROP COLUMN IF EXISTS id_customer;
  ALTER TABLE public.contracts_db DROP COLUMN IF EXISTS agent;
  ALTER TABLE public.contracts_db DROP COLUMN IF EXISTS process_state;
  ALTER TABLE public.contracts_db DROP COLUMN IF EXISTS payment_state;
  ALTER TABLE public.contracts_db DROP COLUMN IF EXISTS title;
  ALTER TABLE public.contracts_db DROP COLUMN IF EXISTS amount_eur;
  ALTER TABLE public.contracts_db DROP COLUMN IF EXISTS created_at;
  ALTER TABLE public.contracts_db DROP COLUMN IF EXISTS updated_at;
END $$;

