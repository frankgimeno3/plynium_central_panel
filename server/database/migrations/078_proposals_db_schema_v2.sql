-- 078_proposals_db_schema_v2.sql
-- proposals_db: rename columns to proposal_* / customer_id / etc.; JSON service_lines & payments -> relational tables.
-- New tables: proposal_service_lines, proposal_payments.

CREATE OR REPLACE FUNCTION public.set_proposals_db_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.proposal_updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'proposals_db'
  ) THEN
    RETURN;
  END IF;

  -- Child tables: FK target matches current proposals_db PK column name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proposals_db' AND column_name = 'id_proposal'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.proposal_service_lines (
      proposal_service_line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      proposal_id VARCHAR(255) NOT NULL REFERENCES public.proposals_db(id_proposal) ON DELETE CASCADE,
      service_id VARCHAR(255) NOT NULL DEFAULT ''::character varying,
      proposal_service_custom_name VARCHAR(512) NOT NULL DEFAULT ''::character varying,
      proposal_service_discount NUMERIC(14, 2) NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS public.proposal_payments (
      proposal_payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      proposal_id VARCHAR(255) NOT NULL REFERENCES public.proposals_db(id_proposal) ON DELETE CASCADE,
      proposal_payment_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
      proposal_payment_date DATE NULL,
      proposal_payment_number VARCHAR(64) NOT NULL DEFAULT ''::character varying
    );
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proposals_db' AND column_name = 'proposal_id'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.proposal_service_lines (
      proposal_service_line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      proposal_id VARCHAR(255) NOT NULL REFERENCES public.proposals_db(proposal_id) ON DELETE CASCADE,
      service_id VARCHAR(255) NOT NULL DEFAULT ''::character varying,
      proposal_service_custom_name VARCHAR(512) NOT NULL DEFAULT ''::character varying,
      proposal_service_discount NUMERIC(14, 2) NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS public.proposal_payments (
      proposal_payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      proposal_id VARCHAR(255) NOT NULL REFERENCES public.proposals_db(proposal_id) ON DELETE CASCADE,
      proposal_payment_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
      proposal_payment_date DATE NULL,
      proposal_payment_number VARCHAR(64) NOT NULL DEFAULT ''::character varying
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'proposal_service_lines'
  ) THEN
    CREATE INDEX IF NOT EXISTS proposal_service_lines_proposal_id_idx ON public.proposal_service_lines (proposal_id);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'proposal_payments'
  ) THEN
    CREATE INDEX IF NOT EXISTS proposal_payments_proposal_id_idx ON public.proposal_payments (proposal_id);
  END IF;

  -- One-time JSON -> relational (only if legacy JSON columns still exist)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proposals_db' AND column_name = 'service_lines'
  ) THEN
    INSERT INTO public.proposal_service_lines (
      proposal_service_line_id, proposal_id, service_id, proposal_service_custom_name, proposal_service_discount
    )
    SELECT gen_random_uuid(),
           p.id_proposal,
           COALESCE(NULLIF(TRIM(elem->>'service_id'), ''), NULLIF(TRIM(elem->>'id_service'), ''), NULLIF(TRIM(elem->>'id'), ''), ''),
           COALESCE(NULLIF(TRIM(elem->>'proposal_service_custom_name'), ''), NULLIF(TRIM(elem->>'custom_name'), ''), NULLIF(TRIM(elem->>'name'), ''), NULLIF(TRIM(elem->>'display_name'), ''), ''),
           COALESCE(NULLIF(elem->>'proposal_service_discount', '')::numeric, NULLIF(elem->>'discount', '')::numeric, NULLIF(elem->>'discount_pct', '')::numeric, 0)
    FROM public.proposals_db p,
         LATERAL jsonb_array_elements(COALESCE(p.service_lines, '[]'::jsonb)) AS elem
    WHERE jsonb_array_length(COALESCE(p.service_lines, '[]'::jsonb)) > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.proposal_service_lines x WHERE x.proposal_id = p.id_proposal LIMIT 1
      );

    INSERT INTO public.proposal_payments (
      proposal_payment_id, proposal_id, proposal_payment_amount, proposal_payment_date, proposal_payment_number
    )
    SELECT gen_random_uuid(),
           p.id_proposal,
           COALESCE(NULLIF(elem->>'proposal_payment_amount', '')::numeric, NULLIF(elem->>'amount', '')::numeric, NULLIF(elem->>'amount_eur', '')::numeric, 0),
           COALESCE(
             NULLIF(elem->>'proposal_payment_date', '')::date,
             NULLIF(elem->>'date', '')::date,
             NULLIF(elem->>'payment_date', '')::date
           ),
           COALESCE(NULLIF(TRIM(elem->>'proposal_payment_number'), ''), NULLIF(TRIM(elem->>'number'), ''), NULLIF(TRIM(elem->>'payment_number'), ''), '')
    FROM public.proposals_db p,
         LATERAL jsonb_array_elements(COALESCE(p.payments, '[]'::jsonb)) AS elem
    WHERE jsonb_array_length(COALESCE(p.payments, '[]'::jsonb)) > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.proposal_payments x WHERE x.proposal_id = p.id_proposal LIMIT 1
      );

    ALTER TABLE public.proposals_db DROP COLUMN IF EXISTS service_lines;
    ALTER TABLE public.proposals_db DROP COLUMN IF EXISTS payments;
  END IF;

  -- Exchange: scalar -> TEXT[] (JSON object strings)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proposals_db' AND column_name = 'exchange_plynium_transfer_date'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'proposals_db' AND column_name = 'exchange_plynium_transfers_array'
    ) THEN
      ALTER TABLE public.proposals_db ADD COLUMN exchange_plynium_transfers_array TEXT[] NOT NULL DEFAULT '{}'::text[];
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'proposals_db' AND column_name = 'exchange_counterpart_transfers_array'
    ) THEN
      ALTER TABLE public.proposals_db ADD COLUMN exchange_counterpart_transfers_array TEXT[] NOT NULL DEFAULT '{}'::text[];
    END IF;

    UPDATE public.proposals_db p
    SET
      exchange_plynium_transfers_array = CASE
        WHEN p.exchange_plynium_transfer_date IS NOT NULL THEN
          ARRAY[json_build_object(
            'date', p.exchange_plynium_transfer_date,
            'amount', COALESCE(p.exchange_transferred_amount, 0)
          )::text]
        ELSE COALESCE(p.exchange_plynium_transfers_array, '{}'::text[])
      END,
      exchange_counterpart_transfers_array = CASE
        WHEN p.exchange_counterpart_date IS NOT NULL THEN
          ARRAY[json_build_object('date', p.exchange_counterpart_date)::text]
        ELSE COALESCE(p.exchange_counterpart_transfers_array, '{}'::text[])
      END;

    ALTER TABLE public.proposals_db
      DROP COLUMN IF EXISTS exchange_plynium_transfer_date,
      DROP COLUMN IF EXISTS exchange_counterpart_date,
      DROP COLUMN IF EXISTS exchange_transferred_amount,
      DROP COLUMN IF EXISTS exchange_to_be_received_html;
  END IF;

  -- Column renames on proposals_db
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='id_proposal')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='proposal_id') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN id_proposal TO proposal_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='id_customer')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='customer_id') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN id_customer TO customer_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='id_contact')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='contact_id') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN id_contact TO contact_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='additional_contact_ids')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='additional_contact_ids_array') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN additional_contact_ids TO additional_contact_ids_array;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='agent')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='agent_id') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN agent TO agent_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='status')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='proposal_status') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN status TO proposal_status;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='title')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='proposal_tittle') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN title TO proposal_tittle;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='amount_eur')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='proposal_ammount_eur') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN amount_eur TO proposal_ammount_eur;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='date_created')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='proposal_creation_date') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN date_created TO proposal_creation_date;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='expiration_date')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='proposal_expiration_date') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN expiration_date TO proposal_expiration_date;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='general_discount_pct')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='proposal_general_discount') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN general_discount_pct TO proposal_general_discount;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='is_exchange')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='is_proposal_exchange') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN is_exchange TO is_proposal_exchange;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='created_at')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='proposal_created_at') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN created_at TO proposal_created_at;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='updated_at')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='proposals_db' AND column_name='proposal_updated_at') THEN
    ALTER TABLE public.proposals_db RENAME COLUMN updated_at TO proposal_updated_at;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proposals_db' AND column_name = 'exchange_plynium_transfers_array'
  ) THEN
    ALTER TABLE public.proposals_db ADD COLUMN exchange_plynium_transfers_array TEXT[] NOT NULL DEFAULT '{}'::text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proposals_db' AND column_name = 'exchange_counterpart_transfers_array'
  ) THEN
    ALTER TABLE public.proposals_db ADD COLUMN exchange_counterpart_transfers_array TEXT[] NOT NULL DEFAULT '{}'::text[];
  END IF;

  DROP INDEX IF EXISTS public.proposals_db_id_customer_idx;
  DROP INDEX IF EXISTS public.proposals_db_status_idx;
  DROP INDEX IF EXISTS public.proposals_db_agent_idx;
  DROP INDEX IF EXISTS public.proposals_db_date_created_idx;
  CREATE INDEX IF NOT EXISTS proposals_db_customer_id_idx ON public.proposals_db (customer_id);
  CREATE INDEX IF NOT EXISTS proposals_db_proposal_status_idx ON public.proposals_db (proposal_status);
  CREATE INDEX IF NOT EXISTS proposals_db_agent_id_idx ON public.proposals_db (agent_id);
  CREATE INDEX IF NOT EXISTS proposals_db_proposal_creation_date_idx ON public.proposals_db (proposal_creation_date);

  DROP TRIGGER IF EXISTS proposals_db_updated_at ON public.proposals_db;
  CREATE TRIGGER proposals_db_updated_at
    BEFORE UPDATE ON public.proposals_db
    FOR EACH ROW EXECUTE FUNCTION public.set_proposals_db_updated_at();
END $$;
