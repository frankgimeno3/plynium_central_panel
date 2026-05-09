-- 032_publications_db_cover_header_fields.sql
-- Adds editable variables that drive the cover preview masthead and red stamp.
--
-- Columns:
--   publication_header_domain: shown as the vertical domain in the black header.
--   red_box_header:            bold/large first line inside the angled red stamp.
--   red_box_body:              regular body text (capped to 25 words client-side).
--
-- All three default to empty strings so existing rows render an empty masthead
-- until they are filled in from the publication issue detail page.

ALTER TABLE public.publications_db
  ADD COLUMN IF NOT EXISTS publication_header_domain VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS red_box_header VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS red_box_body VARCHAR(2048) DEFAULT '';

-- Backfill any pre-existing NULLs (in case a prior column already existed).
UPDATE public.publications_db
SET publication_header_domain = ''
WHERE publication_header_domain IS NULL;

UPDATE public.publications_db
SET red_box_header = ''
WHERE red_box_header IS NULL;

UPDATE public.publications_db
SET red_box_body = ''
WHERE red_box_body IS NULL;
