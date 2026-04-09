-- 102_offered_preferential_pages_columns.sql
-- Canonical columns on public.offered_preferential_pages (UUID PK, publication/slot/proposal links).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'offered_preferential_pages' AND column_name = 'offered_page_id'
  ) THEN
    RETURN;
  END IF;

  ALTER TABLE public.offered_preferential_pages DROP CONSTRAINT IF EXISTS offered_preferential_pages_flatplan_id_fkey;
  ALTER TABLE public.offered_preferential_pages DROP CONSTRAINT IF EXISTS offered_preferential_pages_pkey;

  ALTER TABLE public.offered_preferential_pages ADD COLUMN offered_page_id UUID;
  UPDATE public.offered_preferential_pages SET offered_page_id = gen_random_uuid() WHERE offered_page_id IS NULL;
  ALTER TABLE public.offered_preferential_pages ALTER COLUMN offered_page_id SET NOT NULL;
  ALTER TABLE public.offered_preferential_pages DROP COLUMN IF EXISTS id;
  ALTER TABLE public.offered_preferential_pages ADD PRIMARY KEY (offered_page_id);

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'offered_preferential_pages' AND column_name = 'page_type'
  ) THEN
    ALTER TABLE public.offered_preferential_pages RENAME COLUMN page_type TO offered_page_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'offered_preferential_pages' AND column_name = 'slot_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'offered_preferential_pages' AND column_name = 'offered_slot_key'
  ) THEN
    ALTER TABLE public.offered_preferential_pages RENAME COLUMN slot_key TO offered_slot_key;
  END IF;

  ALTER TABLE public.offered_preferential_pages ADD COLUMN IF NOT EXISTS publication_id VARCHAR(255) NULL;
  ALTER TABLE public.offered_preferential_pages ADD COLUMN IF NOT EXISTS publication_slot_id INTEGER NULL;
  ALTER TABLE public.offered_preferential_pages ADD COLUMN IF NOT EXISTS agent_id VARCHAR(255) NULL;
  ALTER TABLE public.offered_preferential_pages ADD COLUMN IF NOT EXISTS customer_id VARCHAR(255) NULL;
  ALTER TABLE public.offered_preferential_pages ADD COLUMN IF NOT EXISTS proposal_id VARCHAR(255) NULL;
  ALTER TABLE public.offered_preferential_pages ADD COLUMN IF NOT EXISTS offered_page_proposal_date DATE NULL;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'offered_preferential_pages' AND column_name = 'offered_page_type'
  ) THEN
    ALTER TABLE public.offered_preferential_pages ADD COLUMN offered_page_type VARCHAR(255) NOT NULL DEFAULT ''::character varying;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'offered_preferential_pages' AND column_name = 'offered_slot_key'
  ) THEN
    ALTER TABLE public.offered_preferential_pages ADD COLUMN offered_slot_key VARCHAR(255) NOT NULL DEFAULT ''::character varying;
  END IF;

  ALTER TABLE public.offered_preferential_pages DROP COLUMN IF EXISTS flatplan_id;
  ALTER TABLE public.offered_preferential_pages DROP COLUMN IF EXISTS created_at;
  ALTER TABLE public.offered_preferential_pages DROP COLUMN IF EXISTS planned_publication_id;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'offered_preferential_pages'
      AND c.conname = 'offered_preferential_pages_publication_id_fkey'
  ) THEN
    ALTER TABLE public.offered_preferential_pages
      ADD CONSTRAINT offered_preferential_pages_publication_id_fkey
      FOREIGN KEY (publication_id) REFERENCES public.publications_db (id_publication) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'offered_preferential_pages'
      AND c.conname = 'offered_preferential_pages_publication_slot_id_fkey'
  ) THEN
    ALTER TABLE public.offered_preferential_pages
      ADD CONSTRAINT offered_preferential_pages_publication_slot_id_fkey
      FOREIGN KEY (publication_slot_id) REFERENCES public.publication_slots (id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'offered_preferential_pages'
      AND c.conname = 'offered_preferential_pages_proposal_id_fkey'
  ) THEN
    ALTER TABLE public.offered_preferential_pages
      ADD CONSTRAINT offered_preferential_pages_proposal_id_fkey
      FOREIGN KEY (proposal_id) REFERENCES public.proposals_db (proposal_id) ON DELETE SET NULL;
  END IF;

  CREATE INDEX IF NOT EXISTS offered_preferential_pages_publication_id_idx ON public.offered_preferential_pages (publication_id);
  CREATE INDEX IF NOT EXISTS offered_preferential_pages_publication_slot_id_idx ON public.offered_preferential_pages (publication_slot_id);
  CREATE INDEX IF NOT EXISTS offered_preferential_pages_proposal_id_idx ON public.offered_preferential_pages (proposal_id);
END $$;
