-- 103_drop_flatplans_and_publication_slots.sql
-- Remove flatplans and publication_slots; offered_preferential_pages no longer links to slots.

ALTER TABLE IF EXISTS public.offered_preferential_pages
  DROP CONSTRAINT IF EXISTS offered_preferential_pages_publication_slot_id_fkey;

DROP INDEX IF EXISTS public.offered_preferential_pages_publication_slot_id_idx;

ALTER TABLE IF EXISTS public.offered_preferential_pages
  DROP COLUMN IF EXISTS publication_slot_id;

DROP TABLE IF EXISTS public.publication_slots CASCADE;
DROP TABLE IF EXISTS public.publication_slots_db CASCADE;
DROP TABLE IF EXISTS public.flatplans CASCADE;
