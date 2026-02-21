-- 004_update_contents_normalize.sql
-- Objetivo: Enlazar contents a articles con position; dejar de depender de articles.contents_array.
-- Backfill desde articles.contents_array. NO se borra contents_array en esta pasada (limpieza posterior).

-- 1) Añadir columnas si no existen
ALTER TABLE contents ADD COLUMN IF NOT EXISTS article_id TEXT NULL;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS position INTEGER NULL;

-- 2) Backfill: por cada artículo, asignar article_id y position según orden en contents_array
--    Solo si la columna articles.contents_array existe (puede estar ya eliminada).
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

-- 3) Contents no referenciados en ningún contents_array: asignar al primer artículo con position única
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

-- Si aún hay NULL (tabla articles vacía), no podemos SET NOT NULL; solo aplicamos constraints si no hay NULLs
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

-- NO se elimina articles.contents_array (limpieza en 013_cleanup_legacy_columns_optional.sql)
