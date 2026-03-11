-- 009_articles_event_columns.sql
-- Columnas is_article_event y event_id en articles. Idempotente.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_article_event BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS event_id VARCHAR(255) DEFAULT '';
