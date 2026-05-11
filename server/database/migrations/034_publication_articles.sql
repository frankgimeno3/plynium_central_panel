-- 034_publication_articles.sql
-- Adds the `publication_articles` table that links a magazine publication to
-- a source article (`articles_db.id_article`) selected from the publication's
-- portal. Each row tracks the magazine slots that the article occupies and
-- the desired page count entered in the article builder.
--
-- Columns:
--   publication_article_id      UUID PK (default gen_random_uuid()).
--   publication_id              FK to publications_db.publication_id.
--   article_id                  FK to articles_db.id_article (TEXT to align
--                               with article_contents.article_id).
--   publication_slots_id_array  Ordered list of publication_slots_db.publication_slot_id
--                               that belong to this magazine adaptation.
--                               Position N in the array corresponds to the
--                               Nth magazine page of the article.
--   desired_page_count          User-entered number of magazine pages the
--                               article should span. Default 1, must be >= 1.
--
-- A unique (publication_id, article_id) prevents picking the same source
-- article twice for the same publication.

BEGIN;

CREATE TABLE IF NOT EXISTS public.publication_articles (
    publication_article_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id VARCHAR(255) NOT NULL,
    article_id TEXT NOT NULL,
    publication_slots_id_array INTEGER[] NOT NULL DEFAULT '{}'::integer[],
    desired_page_count INTEGER NOT NULL DEFAULT 1,
    publication_article_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    publication_article_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT publication_articles_desired_page_count_chk
      CHECK (desired_page_count >= 1)
);

CREATE INDEX IF NOT EXISTS publication_articles_publication_id_idx
  ON public.publication_articles (publication_id);

CREATE INDEX IF NOT EXISTS publication_articles_article_id_idx
  ON public.publication_articles (article_id);

CREATE UNIQUE INDEX IF NOT EXISTS publication_articles_pub_article_uniq
  ON public.publication_articles (publication_id, article_id);

COMMIT;
