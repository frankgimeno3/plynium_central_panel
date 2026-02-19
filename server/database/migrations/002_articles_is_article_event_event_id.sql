-- Add is_article_event and event_id to articles table (run once)

ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_article_event BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS event_id VARCHAR(255) DEFAULT '';
