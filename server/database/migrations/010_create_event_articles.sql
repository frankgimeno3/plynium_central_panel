-- 010_create_event_articles.sql
-- Tabla puente event_articles. Backfill desde articles.event_id. Idempotente.

CREATE TABLE IF NOT EXISTS event_articles (
    event_id TEXT NOT NULL REFERENCES events(id_fair) ON DELETE CASCADE,
    article_id TEXT NOT NULL REFERENCES articles(id_article) ON DELETE CASCADE,
    position INT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (event_id, article_id)
);

CREATE INDEX IF NOT EXISTS event_articles_event_id_position_idx
    ON event_articles (event_id, position);

COMMENT ON TABLE event_articles IS 'Puente artículo-eventos: un artículo puede estar en varios eventos.';

INSERT INTO event_articles (event_id, article_id)
SELECT DISTINCT
    NULLIF(trim(a.event_id), ''),
    a.id_article
FROM articles a
WHERE a.event_id IS NOT NULL
  AND NULLIF(trim(a.event_id), '') IS NOT NULL
  AND EXISTS (SELECT 1 FROM events e WHERE e.id_fair = NULLIF(trim(a.event_id), ''))
ON CONFLICT (event_id, article_id) DO NOTHING;
