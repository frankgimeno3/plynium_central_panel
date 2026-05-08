-- 025_publication_preferential_slots_service_group.sql
-- Links each preferential row to the tariff/service group (cover, inside cover, or premium page).

ALTER TABLE public.publication_preferential_slots
  ADD COLUMN IF NOT EXISTS service_group_id UUID NULL;

UPDATE public.publication_preferential_slots
SET service_group_id = 'ca229970-2a1d-4787-8d07-051e4ce43a78'::uuid
WHERE position_in_magazine = 'Cover page';

UPDATE public.publication_preferential_slots
SET service_group_id = '71d8f1bf-4c7f-486b-8ebb-acef6aa6b5b8'::uuid
WHERE position_in_magazine = 'Inside Cover';

UPDATE public.publication_preferential_slots
SET service_group_id = 'ce71b075-d775-487a-9ca7-001e30ee896e'::uuid
WHERE position_in_magazine LIKE 'Preferential page %';

-- Any legacy/unknown labels default to premium page tariff
UPDATE public.publication_preferential_slots
SET service_group_id = 'ce71b075-d775-487a-9ca7-001e30ee896e'::uuid
WHERE service_group_id IS NULL;

ALTER TABLE public.publication_preferential_slots
  ALTER COLUMN service_group_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'publication_preferential_slots_service_group_id_fkey'
  ) THEN
    ALTER TABLE public.publication_preferential_slots
      ADD CONSTRAINT publication_preferential_slots_service_group_id_fkey
      FOREIGN KEY (service_group_id) REFERENCES public.service_groups (service_group_id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS publication_preferential_slots_service_group_id_idx
  ON public.publication_preferential_slots (service_group_id);

COMMENT ON COLUMN public.publication_preferential_slots.service_group_id IS
  'service_groups tariff group: Magazine Cover Page, Magazine Inside Cover, or Magazine Premium Page.';
