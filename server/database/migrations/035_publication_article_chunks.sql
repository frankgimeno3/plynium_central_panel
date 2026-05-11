-- 035_publication_article_chunks.sql
-- Adds the `publication_article_chunks` table that holds the per-paragraph
-- (or per-image) editable building blocks of an article being adapted to a
-- magazine publication. Each chunk lives inside a single magazine page (a
-- `publication_slot_content` row) and may originate from an article_contents
-- row in the source portal article (or be created from scratch in the
-- magazine builder).
--
-- The shape of `publication_slot_content.slot_content_object_array` becomes:
--   [{ position: <int>, publication_article_chunk_id: <uuid|null>,
--      advert_media_src: <string|null> }, ...]
--   - For slot_content_format = 'article'   -> publication_article_chunk_id
--                                              points at one of these chunks
--                                              (advert_media_src is null).
--   - For slot_content_format = 'advert'    -> a single object with
--                                              advert_media_src set to the
--                                              media library URL and
--                                              publication_article_chunk_id
--                                              null.
--
-- Columns:
--   publication_article_chunk_id        UUID PK (default gen_random_uuid()).
--   publication_article_id              FK to publication_articles. Lets us
--                                       list every chunk that belongs to a
--                                       given article in the publication
--                                       without traversing slot_content.
--   publication_id                      Denormalised for fast filtering.
--   publication_slot_content_id         FK to publication_slot_content.
--                                       Nullable so chunks can exist before
--                                       being assigned to a magazine page.
--   publication_article_chunk_format    One of: title, subtitle, only_text,
--                                       only_image, text_image, image_text.
--   chunk_html                          Editable HTML body for the chunk.
--   chunk_position                      Ordering inside the slot_content (or
--                                       the article when not yet assigned).
--   original_article_content_id         FK to article_contents.article_content_id
--                                       for chunks imported from the source
--                                       portal article. Null for chunks
--                                       created from scratch in the builder.

BEGIN;

CREATE TABLE IF NOT EXISTS public.publication_article_chunks (
    publication_article_chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_article_id UUID NOT NULL,
    publication_id VARCHAR(255) NOT NULL,
    publication_slot_content_id INTEGER NULL,
    publication_article_chunk_format VARCHAR(64) NOT NULL DEFAULT 'only_text',
    chunk_html TEXT NOT NULL DEFAULT '',
    chunk_position INTEGER NOT NULL DEFAULT 0,
    original_article_content_id VARCHAR(255) NULL,
    publication_article_chunk_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    publication_article_chunk_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT publication_article_chunks_format_chk
      CHECK (publication_article_chunk_format IN (
        'title', 'subtitle', 'only_text', 'only_image', 'text_image', 'image_text'
      ))
);

CREATE INDEX IF NOT EXISTS publication_article_chunks_pub_article_idx
  ON public.publication_article_chunks (publication_article_id);

CREATE INDEX IF NOT EXISTS publication_article_chunks_pub_id_idx
  ON public.publication_article_chunks (publication_id);

CREATE INDEX IF NOT EXISTS publication_article_chunks_slot_content_id_idx
  ON public.publication_article_chunks (publication_slot_content_id);

CREATE INDEX IF NOT EXISTS publication_article_chunks_position_idx
  ON public.publication_article_chunks (publication_slot_content_id, chunk_position);

COMMIT;
