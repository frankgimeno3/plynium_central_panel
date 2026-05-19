-- 044_publication_article_chunks_text_only_split_to_only_text.sql
--
-- Backfill legacy body chunks stored as text_image / image_text when they carry
-- no embedded mediateca image (empty figure or no img src). Subpage editor and
-- preview expect only_text for plain body copy.
--
-- Rows that still have a real <img src="..."> keep their format so the full
-- article slot editor can render text+image layouts.
--
-- Preview (optional):
--   SELECT publication_article_chunk_format, COUNT(*)
--   FROM publication_article_chunks
--   GROUP BY 1 ORDER BY 1;

BEGIN;

-- Non-empty <img src="..."> (double or single quotes around src).
-- Dollar-quoting avoids breaking SQL string literals on regex quotes.

-- 1) plyn-mag-chunk split markup: decode data-pmc-text-b64 → only_text
WITH split_text_only AS (
  SELECT
    c.publication_article_chunk_id,
    (regexp_match(c.chunk_html, 'data-pmc-text-b64="([^"]*)"'))[1] AS text_b64
  FROM public.publication_article_chunks AS c
  WHERE c.publication_article_chunk_format IN ('text_image', 'image_text')
    AND c.chunk_html ~ 'data-pmc-text-b64="'
    AND c.chunk_html !~* $img$<img[^>]+\bsrc\s*=\s*["'][^"']+["']$img$
)
UPDATE public.publication_article_chunks AS c
SET
  publication_article_chunk_format = 'only_text',
  chunk_html = COALESCE(
    NULLIF(
      convert_from(decode(st.text_b64, 'base64'), 'UTF8'),
      ''
    ),
    ''
  ),
  chunk_page_weight = 15,
  publication_article_chunk_updated_at = now()
FROM split_text_only AS st
WHERE c.publication_article_chunk_id = st.publication_article_chunk_id
  AND st.text_b64 IS NOT NULL
  AND btrim(st.text_b64) <> '';

-- 2) Same rows but missing/invalid base64: drop format flag, keep stored HTML
UPDATE public.publication_article_chunks AS c
SET
  publication_article_chunk_format = 'only_text',
  chunk_page_weight = 15,
  publication_article_chunk_updated_at = now()
WHERE c.publication_article_chunk_format IN ('text_image', 'image_text')
  AND c.chunk_html ~ 'data-pmc-layout="'
  AND c.chunk_html !~* $img$<img[^>]+\bsrc\s*=\s*["'][^"']+["']$img$;

-- 3) Plain HTML chunks mis-tagged as text_image / image_text (no split wrapper, no image)
UPDATE public.publication_article_chunks AS c
SET
  publication_article_chunk_format = 'only_text',
  chunk_page_weight = 15,
  publication_article_chunk_updated_at = now()
WHERE c.publication_article_chunk_format IN ('text_image', 'image_text')
  AND c.chunk_html !~ 'data-pmc-layout="'
  AND c.chunk_html !~* $img$<img[^>]+\bsrc\s*=\s*["'][^"']+["']$img$;

COMMIT;
