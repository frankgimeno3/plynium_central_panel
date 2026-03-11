-- 011_update_contents_normalize.sql
-- Enlaza contents a articles (article_id, position). Backfill desde articles.contents_array.
-- Idempotente. Limpieza de contents_array en 021.

ALTER TABLE contents ADD COLUMN IF NOT EXISTS article_id TEXT NULL;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS position INTEGER NULL;

DO $$
DECLARE
    r RECORD;
    idx INT;
    cid TEXT;
    has_array_col BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'contents_array'
    ) INTO has_array_col;

    IF has_array_col THEN
        FOR r IN EXECUTE 'SELECT id_article, contents_array FROM articles WHERE contents_array IS NOT NULL AND array_length(contents_array, 1) > 0'
        LOOP
            idx := 0;
            FOREACH cid IN ARRAY r.contents_array
            LOOP
                UPDATE contents SET article_id = r.id_article, position = idx WHERE content_id = cid;
                idx := idx + 1;
            END LOOP;
        END LOOP;
    END IF;
END $$;

WITH first_article AS (SELECT id_article FROM articles ORDER BY id_article LIMIT 1),
numbered AS (
    SELECT content_id, row_number() OVER (ORDER BY content_id) AS rn
    FROM contents WHERE article_id IS NULL
),
base_pos AS (
    SELECT COALESCE(MAX(c.position), -1) + 1 AS next_pos
    FROM contents c, first_article fa
    WHERE c.article_id = fa.id_article
)
UPDATE contents c
SET article_id = fa.id_article,
    position = bp.next_pos + n.rn - 1
FROM first_article fa, base_pos bp, numbered n
WHERE c.content_id = n.content_id
  AND EXISTS (SELECT 1 FROM first_article);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM contents WHERE article_id IS NULL) THEN
        ALTER TABLE contents ALTER COLUMN article_id SET NOT NULL;
        ALTER TABLE contents ALTER COLUMN position SET NOT NULL;
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'contents_article_id_position_key'
        ) THEN
            ALTER TABLE contents ADD CONSTRAINT contents_article_id_position_key UNIQUE (article_id, position);
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS contents_article_id_position_idx ON contents (article_id, position);
