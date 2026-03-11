-- 019_banners_multiportal_schema.sql
-- Banners por portal: portal_id, columnas de esquema (alt, redirect_url, starts_at, ends_at,
-- appearance_weight, position), índices y trigger. Idempotente.

ALTER TABLE banners ADD COLUMN IF NOT EXISTS portal_id INTEGER NULL REFERENCES portals(id) ON DELETE CASCADE;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS alt TEXT NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS redirect_url TEXT NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS appearance_weight VARCHAR(16) NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

UPDATE banners
SET portal_id = COALESCE(
    (SELECT get_default_portal_id()),
    (SELECT id FROM portals ORDER BY created_at ASC NULLS LAST, id ASC LIMIT 1)
)
WHERE portal_id IS NULL;

UPDATE banners SET redirect_url = banner_redirection
WHERE redirect_url IS NULL AND banner_redirection IS NOT NULL;

UPDATE banners SET appearance_weight = 'medium' WHERE appearance_weight IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM banners WHERE portal_id IS NULL) THEN
        ALTER TABLE banners ALTER COLUMN portal_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS banners_portal_page_route_idx ON banners (portal_id, page_type, route);
CREATE INDEX IF NOT EXISTS banners_portal_position_type_position_idx ON banners (portal_id, position_type, position);
CREATE INDEX IF NOT EXISTS banners_portal_starts_ends_idx
    ON banners (portal_id, starts_at, ends_at)
    WHERE starts_at IS NOT NULL OR ends_at IS NOT NULL;

DROP TRIGGER IF EXISTS banners_updated_at ON banners;
CREATE TRIGGER banners_updated_at
    BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE banners IS 'Banners por portal. Coherencia: (portal_id, page_type, route, position_type, position). Opcional: starts_at/ends_at para programación.';
