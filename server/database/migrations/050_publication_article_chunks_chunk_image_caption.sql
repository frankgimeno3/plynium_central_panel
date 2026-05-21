-- 050_publication_article_chunks_chunk_image_caption.sql
-- Optional caption for image chunks (only_image / text_image / image_text).

BEGIN;

ALTER TABLE public.publication_article_chunks
  ADD COLUMN IF NOT EXISTS chunk_image_caption TEXT NOT NULL DEFAULT ''::text;

COMMENT ON COLUMN public.publication_article_chunks.chunk_image_caption IS
  'Plain-text image caption (pie de foto). Used only for image chunk formats.';

COMMIT;
