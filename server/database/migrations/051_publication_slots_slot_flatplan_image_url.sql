-- 051_publication_slots_slot_flatplan_image_url.sql
-- Low-res article page capture for flatplan tiles and slot detail preview.

BEGIN;

ALTER TABLE public.publication_slots_db
  ADD COLUMN IF NOT EXISTS slot_flatplan_image_url VARCHAR(512) NULL;

COMMENT ON COLUMN public.publication_slots_db.slot_flatplan_image_url IS
  'CDN URL of auto-captured article page preview (Article Builder editor reload).';

COMMIT;
