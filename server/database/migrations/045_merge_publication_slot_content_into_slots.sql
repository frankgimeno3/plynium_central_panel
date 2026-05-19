-- 045_merge_publication_slot_content_into_slots.sql
-- Consolidates publication_slot_content into publication_slots_db.
-- Chunks reference publication_slot_id directly. Adverts use slot_media_url;
-- articles use slot_article_id + publication_article_chunks.

BEGIN;

-- Layout per magazine page (was _meta in slot_content_object_array for article rows).
ALTER TABLE public.publication_slots_db
  ADD COLUMN IF NOT EXISTS magazine_page_layout VARCHAR(32) NOT NULL DEFAULT '2_col_article';

-- Chunk → slot (1:1 with the magazine page slot).
ALTER TABLE public.publication_article_chunks
  ADD COLUMN IF NOT EXISTS publication_slot_id INTEGER NULL;

UPDATE public.publication_article_chunks c
SET publication_slot_id = sc.publication_slot_id
FROM public.publication_slot_content sc
WHERE c.publication_slot_content_id = sc.publication_slot_content_id
  AND c.publication_slot_id IS NULL;

-- Advert media URL from slot_content object_array (advert_media_src or legacy url).
UPDATE public.publication_slots_db s
SET slot_media_url = COALESCE(
  NULLIF(TRIM(s.slot_media_url), ''),
  (
    SELECT COALESCE(
      NULLIF(TRIM(elem->>'advert_media_src'), ''),
      NULLIF(TRIM(elem->>'url'), '')
    )
    FROM public.publication_slot_content sc,
         LATERAL jsonb_array_elements(
           CASE WHEN jsonb_typeof(sc.slot_content_object_array) = 'array'
                THEN sc.slot_content_object_array ELSE '[]'::jsonb END
         ) AS elem
    WHERE sc.publication_slot_id = s.publication_slot_id
      AND LOWER(TRIM(sc.slot_content_format)) = 'advert'
    ORDER BY sc.publication_slot_position ASC
    LIMIT 1
  )
)
WHERE s.slot_media_url IS NULL OR TRIM(s.slot_media_url) = '';

-- Article id on slot from slot_content or existing slot_article_id.
UPDATE public.publication_slots_db s
SET slot_article_id = COALESCE(
  NULLIF(TRIM(s.slot_article_id), ''),
  (
    SELECT NULLIF(TRIM(sc.article_id), '')
    FROM public.publication_slot_content sc
    WHERE sc.publication_slot_id = s.publication_slot_id
      AND LOWER(TRIM(sc.slot_content_format)) = 'article'
      AND sc.article_id IS NOT NULL
      AND TRIM(sc.article_id) <> ''
    ORDER BY sc.publication_slot_position ASC
    LIMIT 1
  )
)
WHERE s.slot_article_id IS NULL OR TRIM(s.slot_article_id) = '';

-- Magazine layout from article-format slot_content meta.
UPDATE public.publication_slots_db s
SET magazine_page_layout = CASE
  WHEN meta.layout IN ('2_col_article', '3_col_article') THEN meta.layout
  ELSE s.magazine_page_layout
END
FROM (
  SELECT
    sc.publication_slot_id,
    (
      SELECT elem->>'magazine_page_layout'
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(sc.slot_content_object_array) = 'array'
             THEN sc.slot_content_object_array ELSE '[]'::jsonb END
      ) AS elem
      WHERE elem->>'_meta' = 'true' OR (elem ? '_meta' AND (elem->'_meta')::text = 'true')
      LIMIT 1
    ) AS layout
  FROM public.publication_slot_content sc
  WHERE LOWER(TRIM(sc.slot_content_format)) = 'article'
) meta
WHERE meta.publication_slot_id = s.publication_slot_id
  AND meta.layout IS NOT NULL
  AND TRIM(meta.layout) <> '';

-- Align slot_content_type with slot_content_format where useful.
UPDATE public.publication_slots_db s
SET slot_content_type = LOWER(TRIM(sc.slot_content_format))
FROM public.publication_slot_content sc
WHERE sc.publication_slot_id = s.publication_slot_id
  AND LOWER(TRIM(sc.slot_content_format)) IN ('advert', 'article', 'summary', 'index')
  AND (s.slot_content_type IS NULL OR TRIM(s.slot_content_type) = '' OR s.slot_content_type = 'padding');

DROP INDEX IF EXISTS public.publication_article_chunks_slot_content_id_idx;
DROP INDEX IF EXISTS public.publication_article_chunks_position_idx;

ALTER TABLE public.publication_article_chunks
  DROP COLUMN IF EXISTS publication_slot_content_id;

CREATE INDEX IF NOT EXISTS publication_article_chunks_slot_id_idx
  ON public.publication_article_chunks (publication_slot_id);

CREATE INDEX IF NOT EXISTS publication_article_chunks_slot_position_idx
  ON public.publication_article_chunks (publication_slot_id, chunk_position);

DROP TABLE IF EXISTS public.publication_slot_content CASCADE;

COMMIT;
