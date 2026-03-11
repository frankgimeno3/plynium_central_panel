-- 018_create_publication_portals.sql
-- Tabla puente publication-portal. Backfill. Idempotente.

CREATE TABLE IF NOT EXISTS publication_portals (
    publication_id TEXT NOT NULL,
    portal_id INTEGER NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    redirect_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (publication_id, portal_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS publication_portals_portal_slug_uidx ON publication_portals (portal_id, slug);

DROP TRIGGER IF EXISTS publication_portals_updated_at ON publication_portals;
CREATE TRIGGER publication_portals_updated_at
    BEFORE UPDATE ON publication_portals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO publication_portals (publication_id, portal_id, slug, redirect_url, status)
SELECT
    p.id_publication,
    (SELECT get_default_portal_id()),
    p.id_publication,
    p.redirection_link,
    'active'
FROM publications p
ON CONFLICT (publication_id, portal_id) DO NOTHING;
