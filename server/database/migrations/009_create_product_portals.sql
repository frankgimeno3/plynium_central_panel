-- 009_create_product_portals.sql
-- Objetivo: Tabla puente product-portal (slug y status por portal). Backfill con portal por defecto.
-- Idempotente.

CREATE TABLE IF NOT EXISTS product_portals (
    product_id TEXT NOT NULL,
    portal_id INTEGER NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (product_id, portal_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_portals_portal_slug_uidx ON product_portals (portal_id, slug);

DROP TRIGGER IF EXISTS product_portals_updated_at ON product_portals;
CREATE TRIGGER product_portals_updated_at
    BEFORE UPDATE ON product_portals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Backfill: una fila por cada product en el portal por defecto
INSERT INTO product_portals (product_id, portal_id, slug, status)
SELECT
    p.product_id,
    (SELECT get_default_portal_id()),
    COALESCE(
        NULLIF(trim(regexp_replace(lower(regexp_replace(p.product_name, '[^a-zA-Z0-9\s\-]', '', 'g')), '\s+', '-', 'g')), ''),
        p.product_id
    ),
    'active'
FROM products p
ON CONFLICT (product_id, portal_id) DO NOTHING;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT pp.product_id, pp.portal_id, pp.slug
        FROM product_portals pp
        WHERE EXISTS (
            SELECT 1 FROM product_portals pp2
            WHERE pp2.portal_id = pp.portal_id AND pp2.slug = pp.slug AND pp2.product_id <> pp.product_id
        )
    ) LOOP
        UPDATE product_portals SET slug = r.slug || '-' || r.product_id
        WHERE product_id = r.product_id AND portal_id = r.portal_id;
    END LOOP;
END $$;
