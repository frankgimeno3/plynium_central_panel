-- Adds an optional publication-cover subtitle to magazine titles.
-- Example: "PLANO E INDUSTRIAS AFINES" for Glassinformer/Vidrio-style covers.

ALTER TABLE IF EXISTS public.magazines_db
  ADD COLUMN IF NOT EXISTS magazine_subtitle VARCHAR(512) DEFAULT '';

UPDATE public.magazines_db
SET magazine_subtitle = ''
WHERE magazine_subtitle IS NULL;
