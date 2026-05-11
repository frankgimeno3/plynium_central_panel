-- 033_publications_db_special_edition_subtitle.sql
-- Adds the editable subtitle that is rendered, exclusively for the current
-- publication, right under the magazine subtitle on the cover preview when
-- the publication is flagged as a special edition.
--
-- Column:
--   special_edition_subtitle: short tagline (varchar 255). Defaults to '' so
--     existing rows render an empty value until they are filled in from the
--     publication issue detail page.

ALTER TABLE public.publications_db
  ADD COLUMN IF NOT EXISTS special_edition_subtitle VARCHAR(255) DEFAULT '';

UPDATE public.publications_db
SET special_edition_subtitle = ''
WHERE special_edition_subtitle IS NULL;
