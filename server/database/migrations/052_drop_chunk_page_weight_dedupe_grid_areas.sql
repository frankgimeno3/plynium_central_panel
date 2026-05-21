-- 052_drop_chunk_page_weight_dedupe_grid_areas.sql
-- 1) Remove duplicate only_text chunks that share the same slot + primary grid area (e.g. two rows on c4).
-- 2) Drop obsolete chunk_page_weight column.
-- 3) Enforce at most one only_text chunk per (article, slot, primary area) going forward.

BEGIN;

-- Keep the row with the most text; tie-break by latest update then highest position.
WITH ranked AS (
  SELECT
    publication_article_chunk_id,
    ROW_NUMBER() OVER (
      PARTITION BY
        publication_article_id,
        publication_slot_id,
        lower(btrim(chunk_area_array->>0))
      ORDER BY
        length(btrim(COALESCE(chunk_html, ''))) DESC,
        publication_article_chunk_updated_at DESC NULLS LAST,
        chunk_position DESC,
        publication_article_chunk_id
    ) AS rn
  FROM public.publication_article_chunks
  WHERE publication_article_chunk_format = 'only_text'
    AND publication_slot_id IS NOT NULL
    AND jsonb_array_length(COALESCE(chunk_area_array, '[]'::jsonb)) > 0
    AND btrim(COALESCE(chunk_area_array->>0, '')) <> ''
)
DELETE FROM public.publication_article_chunks c
USING ranked r
WHERE c.publication_article_chunk_id = r.publication_article_chunk_id
  AND r.rn > 1;

ALTER TABLE public.publication_article_chunks
  DROP CONSTRAINT IF EXISTS publication_article_chunks_page_weight_chk;

ALTER TABLE public.publication_article_chunks
  DROP COLUMN IF EXISTS chunk_page_weight;

DROP INDEX IF EXISTS publication_article_chunks_slot_primary_area_only_text_uniq;

CREATE UNIQUE INDEX publication_article_chunks_slot_primary_area_only_text_uniq
  ON public.publication_article_chunks (
    publication_article_id,
    publication_slot_id,
    lower(btrim(chunk_area_array->>0))
  )
  WHERE publication_article_chunk_format = 'only_text'
    AND publication_slot_id IS NOT NULL
    AND jsonb_array_length(COALESCE(chunk_area_array, '[]'::jsonb)) > 0
    AND btrim(COALESCE(chunk_area_array->>0, '')) <> '';

COMMIT;
