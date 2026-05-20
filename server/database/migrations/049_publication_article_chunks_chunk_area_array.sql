-- 049_publication_article_chunks_chunk_area_array.sql
-- Grid cells occupied by a chunk on a magazine page body (e.g. ["a1","a2","b1"]).
-- Columns are labelled a, b, c (a–b for 2-column layouts); rows are 1–4.

BEGIN;

ALTER TABLE public.publication_article_chunks
  ADD COLUMN IF NOT EXISTS chunk_area_array JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.publication_article_chunks.chunk_area_array IS
  'Lower-case area codes (a1–c4) this chunk occupies on the page body grid.';

COMMIT;
