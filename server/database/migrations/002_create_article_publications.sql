-- 002_create_article_publications.sql
-- Objetivo: Tabla article_publications para publicaciones de artículos por portal.
-- Relación: un artículo puede estar publicado en varios portales (una fila por portal).
-- Idempotente: IF NOT EXISTS en tabla e índices.

CREATE TABLE IF NOT EXISTS article_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id TEXT NOT NULL,
    portal_id INTEGER NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ NULL,
    visibility TEXT NOT NULL DEFAULT 'public',
    canonical_url TEXT NULL,
    highlight_position TEXT NULL,
    commenting_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE article_publications IS 'One row per article per portal; replaces single-article view with per-portal slug/status.';
COMMENT ON COLUMN article_publications.article_id IS 'Logical FK to articles.id_article (no DB FK to allow type flexibility).';

CREATE UNIQUE INDEX IF NOT EXISTS article_publications_portal_slug_uidx
    ON article_publications (portal_id, slug);

CREATE INDEX IF NOT EXISTS article_publications_portal_status_published_idx
    ON article_publications (portal_id, status, published_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS article_publications_article_id_idx
    ON article_publications (article_id);

DROP TRIGGER IF EXISTS article_publications_updated_at ON article_publications;
CREATE TRIGGER article_publications_updated_at
    BEFORE UPDATE ON article_publications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
