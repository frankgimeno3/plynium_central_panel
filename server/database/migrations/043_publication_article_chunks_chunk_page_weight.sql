-- 043_publication_article_chunks_chunk_page_weight.sql
-- Adds `chunk_page_weight` (1–100) per chunk for magazine page layout density.
-- Defaults by format: title/subtitle/only_text = 15, only_image = 25, text_image/image_text = 20.

BEGIN;

ALTER TABLE public.publication_article_chunks
  ADD COLUMN IF NOT EXISTS chunk_page_weight smallint;

UPDATE public.publication_article_chunks
SET chunk_page_weight = CASE publication_article_chunk_format
  WHEN 'title' THEN 15
  WHEN 'subtitle' THEN 15
  WHEN 'only_image' THEN 25
  WHEN 'only_text' THEN 15
  WHEN 'text_image' THEN 20
  WHEN 'image_text' THEN 20
  ELSE 15
END
WHERE chunk_page_weight IS NULL;

ALTER TABLE public.publication_article_chunks
  ALTER COLUMN chunk_page_weight SET NOT NULL,
  ALTER COLUMN chunk_page_weight SET DEFAULT 15;

ALTER TABLE public.publication_article_chunks
  DROP CONSTRAINT IF EXISTS publication_article_chunks_page_weight_chk;

ALTER TABLE public.publication_article_chunks
  ADD CONSTRAINT publication_article_chunks_page_weight_chk
  CHECK (chunk_page_weight >= 1 AND chunk_page_weight <= 100);

COMMIT;
