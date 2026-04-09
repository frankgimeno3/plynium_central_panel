-- 071_providers_db_rename_columns.sql
-- Rename providers_db columns to canonical provider_* naming.
-- Also updates dependent foreign keys and indexes.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'providers_db'
  ) THEN
    RETURN;
  END IF;

  -- Column renames (only when old name exists and new name does not)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'id_provider'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE public.providers_db RENAME COLUMN id_provider TO provider_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'provider_company_name'
  ) THEN
    ALTER TABLE public.providers_db RENAME COLUMN name TO provider_company_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'contact_email'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'provider_contact_email'
  ) THEN
    ALTER TABLE public.providers_db RENAME COLUMN contact_email TO provider_contact_email;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'contact_phone'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'provider_contact_phone'
  ) THEN
    ALTER TABLE public.providers_db RENAME COLUMN contact_phone TO provider_contact_phone;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'address'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'provider_full_address'
  ) THEN
    ALTER TABLE public.providers_db RENAME COLUMN address TO provider_full_address;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'tax_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'provider_tax_id'
  ) THEN
    ALTER TABLE public.providers_db RENAME COLUMN tax_id TO provider_tax_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'notes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'provider_notes'
  ) THEN
    ALTER TABLE public.providers_db RENAME COLUMN notes TO provider_notes;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'provider_created_at'
  ) THEN
    ALTER TABLE public.providers_db RENAME COLUMN created_at TO provider_created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_db' AND column_name = 'provider_updated_at'
  ) THEN
    ALTER TABLE public.providers_db RENAME COLUMN updated_at TO provider_updated_at;
  END IF;

  -- Update dependent foreign keys to reference providers_db(provider_id)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'provider_invoices_db'
  ) THEN
    BEGIN
      ALTER TABLE public.provider_invoices_db DROP CONSTRAINT IF EXISTS provider_invoices_db_provider_id_fkey;
    EXCEPTION WHEN undefined_object THEN
      NULL;
    END;

    BEGIN
      ALTER TABLE public.provider_invoices_db
        ADD CONSTRAINT provider_invoices_db_provider_id_fkey
        FOREIGN KEY (provider_id) REFERENCES public.providers_db(provider_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments_db'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'id_provider'
    ) THEN
      BEGIN
        ALTER TABLE public.payments_db DROP CONSTRAINT IF EXISTS payments_db_id_provider_fkey;
      EXCEPTION WHEN undefined_object THEN
        NULL;
      END;

      BEGIN
        ALTER TABLE public.payments_db
          ADD CONSTRAINT payments_db_id_provider_fkey
          FOREIGN KEY (id_provider) REFERENCES public.providers_db(provider_id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payments_db' AND column_name = 'provider_id'
    ) THEN
      BEGIN
        ALTER TABLE public.payments_db
          ADD CONSTRAINT payments_db_provider_id_fkey
          FOREIGN KEY (provider_id) REFERENCES public.providers_db(provider_id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END;
    END IF;
  END IF;

  -- Index rename/rebuild (keep it simple: drop old, create new)
  DROP INDEX IF EXISTS public.providers_db_name_idx;
  DROP INDEX IF EXISTS public.providers_db_company_name_idx;
  CREATE INDEX IF NOT EXISTS providers_db_company_name_idx ON public.providers_db (provider_company_name);
END $$;

