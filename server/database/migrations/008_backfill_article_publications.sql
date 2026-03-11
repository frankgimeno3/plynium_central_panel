-- 008_backfill_article_publications.sql
-- Añade portal_id a articles (transición), backfill y una fila en article_publications por artículo.
-- Idempotente.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'portal_id'
    ) THEN
        ALTER TABLE articles ADD COLUMN portal_id INTEGER NULL REFERENCES portals(id) ON DELETE SET NULL;
    END IF;
END $$;

INSERT INTO portals (key, name, domain, default_locale, theme)
SELECT 'glassinformer', 'Glassinformer', 'glassinformer.com', 'en', ''
WHERE NOT EXISTS (SELECT 1 FROM portals LIMIT 1);

UPDATE articles
SET portal_id = (SELECT get_default_portal_id())
WHERE portal_id IS NULL;

INSERT INTO article_publications (
    article_id,
    portal_id,
    slug,
    status,
    published_at,
    visibility,
    highlight_position,
    commenting_enabled
)
WITH default_portal AS (
    SELECT get_default_portal_id() AS pid
)
SELECT
    a.id_article,
    COALESCE(a.portal_id, dp.pid),
    COALESCE(
        NULLIF(trim(
            regexp_replace(
                lower(regexp_replace(a.article_title, '[^a-zA-Z0-9\s\-]', '', 'g')),
                '\s+', '-', 'g'
            )
        ), ''),
        a.id_article
    ),
    CASE WHEN a.date IS NOT NULL THEN 'published' ELSE 'draft' END,
    a.date,
    'public',
    NULLIF(trim(a.highlited_position), ''),
    TRUE
FROM articles a
CROSS JOIN default_portal dp
WHERE dp.pid IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM article_publications ap
    WHERE ap.article_id = a.id_article
      AND ap.portal_id = COALESCE(a.portal_id, dp.pid)
  );

DO $$
DECLARE
    r RECORD;
    new_slug TEXT;
BEGIN
    FOR r IN (
        SELECT ap.id, ap.portal_id, ap.slug, ap.article_id
        FROM article_publications ap
        WHERE EXISTS (
            SELECT 1 FROM article_publications ap2
            WHERE ap2.portal_id = ap.portal_id AND ap2.slug = ap.slug AND ap2.id <> ap.id
        )
    ) LOOP
        new_slug := r.slug || '-' || r.article_id;
        UPDATE article_publications SET slug = new_slug WHERE id = r.id;
    END LOOP;
END $$;
