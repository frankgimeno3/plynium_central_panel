-- 010_create_event_portals.sql
-- Objetivo: Tabla puente event-portal (slug y status por portal). event_id = events.id_fair. Backfill.
-- Idempotente.

CREATE TABLE IF NOT EXISTS event_portals (
    event_id TEXT NOT NULL,
    portal_id INTEGER NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (event_id, portal_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS event_portals_portal_slug_uidx ON event_portals (portal_id, slug);

DROP TRIGGER IF EXISTS event_portals_updated_at ON event_portals;
CREATE TRIGGER event_portals_updated_at
    BEFORE UPDATE ON event_portals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Backfill: una fila por cada event (id_fair) en el portal por defecto
INSERT INTO event_portals (event_id, portal_id, slug, status)
SELECT
    e.id_fair,
    (SELECT get_default_portal_id()),
    COALESCE(
        NULLIF(trim(regexp_replace(lower(regexp_replace(e.event_name, '[^a-zA-Z0-9\s\-]', '', 'g')), '\s+', '-', 'g')), ''),
        e.id_fair
    ),
    'active'
FROM events e
ON CONFLICT (event_id, portal_id) DO NOTHING;

-- Resolver slugs duplicados
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT ep.event_id, ep.portal_id, ep.slug
        FROM event_portals ep
        WHERE EXISTS (
            SELECT 1 FROM event_portals ep2
            WHERE ep2.portal_id = ep.portal_id AND ep2.slug = ep.slug AND ep2.event_id <> ep.event_id
        )
    ) LOOP
        UPDATE event_portals SET slug = r.slug || '-' || r.event_id
        WHERE event_id = r.event_id AND portal_id = r.portal_id;
    END LOOP;
END $$;
