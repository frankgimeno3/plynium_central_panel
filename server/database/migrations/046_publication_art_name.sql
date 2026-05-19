-- 046_publication_art_name.sql
-- Short label shown on flatplan article tiles (Article Builder → Flatplan preview).

BEGIN;

ALTER TABLE public.publication_articles
  ADD COLUMN IF NOT EXISTS publication_art_name VARCHAR(255);

COMMIT;
