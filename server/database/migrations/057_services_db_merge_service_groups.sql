-- 057_services_db_merge_service_groups.sql
-- Merges service_groups into services_db as general services.
-- Replaces services_db.service_group_id with related_to_other_services (self-FK).
-- Drops service_groups table.

BEGIN;

-- 1. New columns on services_db
ALTER TABLE public.services_db
    ADD COLUMN IF NOT EXISTS service_channel VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS specifity VARCHAR(64) NOT NULL DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS related_to_other_services VARCHAR(64) NULL;

COMMENT ON COLUMN public.services_db.service_channel IS 'Channel: dem, portal, or magazine.';
COMMENT ON COLUMN public.services_db.specifity IS 'general | specific-related';
COMMENT ON COLUMN public.services_db.related_to_other_services IS 'Parent general service_id when specifity is specific-related.';

-- 2. Insert each service_group as a general service (service_id = former group UUID)
INSERT INTO public.services_db (
    service_id,
    service_full_name,
    shown_name,
    service_group_id,
    service_portal,
    service_format,
    service_description,
    service_unit,
    service_unit_price,
    service_unit_specifications,
    service_channel,
    specifity,
    related_to_other_services
)
SELECT
    sg.service_group_id::text,
    sg.service_group_name,
    sg.shown_name,
    sg.service_group_id,
    0,
    '',
    sg.service_base_description,
    '',
    sg.tariff_price_eur,
    sg.service_specifications,
    sg.service_group_channel,
    'general',
    NULL
FROM public.service_groups sg
WHERE NOT EXISTS (
    SELECT 1 FROM public.services_db s WHERE s.service_id = sg.service_group_id::text
);

-- 3. Link existing catalog services to their former group (now a general service)
UPDATE public.services_db s
SET
    related_to_other_services = s.service_group_id::text,
    specifity = 'specific-related',
    service_channel = COALESCE(
        NULLIF(TRIM(s.service_channel), ''),
        (SELECT sg.service_group_channel FROM public.service_groups sg WHERE sg.service_group_id = s.service_group_id),
        ''
    )
WHERE s.service_group_id IS NOT NULL
  AND s.service_id NOT IN (SELECT service_group_id::text FROM public.service_groups);

-- 4. Drop FK from services_db.service_group_id → service_groups
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'services_db_service_group_id_fkey'
    ) THEN
        ALTER TABLE public.services_db DROP CONSTRAINT services_db_service_group_id_fkey;
    END IF;
END $$;

ALTER TABLE public.services_db DROP COLUMN IF EXISTS service_group_id;

-- 5. Self-referential FK for related_to_other_services
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'services_db_related_to_other_services_fkey'
    ) THEN
        ALTER TABLE public.services_db
            ADD CONSTRAINT services_db_related_to_other_services_fkey
            FOREIGN KEY (related_to_other_services)
            REFERENCES public.services_db (service_id)
            ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS services_db_related_to_other_services_idx
    ON public.services_db (related_to_other_services);

CREATE INDEX IF NOT EXISTS services_db_specifity_idx
    ON public.services_db (specifity);

CREATE INDEX IF NOT EXISTS services_db_service_channel_idx
    ON public.services_db (service_channel);

-- 6. Repoint publication_preferential_slots FK to services_db (UUID → VARCHAR service_id)
-- Drop legacy FK first (required before changing column type away from UUID).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'publication_preferential_slots_service_group_id_fkey'
    ) THEN
        ALTER TABLE public.publication_preferential_slots
            DROP CONSTRAINT publication_preferential_slots_service_group_id_fkey;
    END IF;
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'publication_preferential_slots_service_id_fkey'
    ) THEN
        ALTER TABLE public.publication_preferential_slots
            DROP CONSTRAINT publication_preferential_slots_service_id_fkey;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'publication_preferential_slots'
          AND c.column_name = 'service_group_id'
          AND c.udt_name = 'uuid'
    ) THEN
        ALTER TABLE public.publication_preferential_slots
            ALTER COLUMN service_group_id TYPE VARCHAR(64)
            USING service_group_id::text;
    END IF;
END $$;

-- Normalize values to services_db.service_id text form
UPDATE public.publication_preferential_slots pps
SET service_group_id = s.service_id
FROM public.services_db s
WHERE pps.service_group_id IS NOT NULL
  AND (
      pps.service_group_id = s.service_id
      OR pps.service_group_id::text = s.service_id
  );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'publication_preferential_slots_service_id_fkey'
    ) THEN
        ALTER TABLE public.publication_preferential_slots
            ADD CONSTRAINT publication_preferential_slots_service_id_fkey
            FOREIGN KEY (service_group_id)
            REFERENCES public.services_db (service_id)
            ON DELETE RESTRICT;
    END IF;
END $$;

COMMENT ON COLUMN public.publication_preferential_slots.service_group_id IS
    'General service_id (formerly service_groups.service_group_id): cover, inside cover, or premium page tariff.';

-- 7. Drop service_groups table
DROP TABLE IF EXISTS public.service_groups CASCADE;

COMMIT;
