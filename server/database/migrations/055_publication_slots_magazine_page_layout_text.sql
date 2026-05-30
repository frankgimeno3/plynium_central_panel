-- 055_publication_slots_magazine_page_layout_text.sql
-- Index slots store advertiser-index HTML in `magazine_page_layout`; article slots keep layout enums.

BEGIN;

ALTER TABLE public.publication_slots_db
  ALTER COLUMN magazine_page_layout TYPE TEXT USING magazine_page_layout::TEXT;

COMMIT;
