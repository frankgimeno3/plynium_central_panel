-- 008_create_company_portals.sql
-- Objetivo: Tabla puente company-portal (slug y status por portal). Backfill con portal por defecto.
-- Idempotente.

CREATE TABLE IF NOT EXISTS company_portals (
    company_id TEXT NOT NULL,
    portal_id INTEGER NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (company_id, portal_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS company_portals_portal_slug_uidx ON company_portals (portal_id, slug);

DROP TRIGGER IF EXISTS company_portals_updated_at ON company_portals;
CREATE TRIGGER company_portals_updated_at
    BEFORE UPDATE ON company_portals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Backfill: una fila por cada company en el portal por defecto
INSERT INTO company_portals (company_id, portal_id, slug, status)
SELECT
    c.company_id,
    (SELECT get_default_portal_id()),
    COALESCE(
        NULLIF(trim(regexp_replace(lower(regexp_replace(c.commercial_name, '[^a-zA-Z0-9\s\-]', '', 'g')), '\s+', '-', 'g')), ''),
        c.company_id
    ),
    'active'
FROM companies c
ON CONFLICT (company_id, portal_id) DO NOTHING;

-- Resolver slugs duplicados en el mismo portal (fallback a company_id)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT cp.company_id, cp.portal_id, cp.slug
        FROM company_portals cp
        WHERE EXISTS (
            SELECT 1 FROM company_portals cp2
            WHERE cp2.portal_id = cp.portal_id AND cp2.slug = cp.slug AND cp2.company_id <> cp.company_id
        )
    ) LOOP
        UPDATE company_portals SET slug = r.slug || '-' || r.company_id
        WHERE company_id = r.company_id AND portal_id = r.portal_id;
    END LOOP;
END $$;
