-- 068_articles_db_topic_ids_array.sql
-- Temas de contenido asociados al artículo (IDs de public.topics_db).

BEGIN;

ALTER TABLE public.articles_db
  ADD COLUMN IF NOT EXISTS topic_ids_array INTEGER[] NOT NULL DEFAULT ARRAY[]::integer[];

COMMIT;
