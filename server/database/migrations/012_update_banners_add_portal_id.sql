-- 012_update_banners_add_portal_id.sql
-- Objetivo: banners asociados a un portal. ADD COLUMN portal_id, backfill, luego NOT NULL e índices.
-- Idempotente. NO se cambian nombres de columnas existentes.

ALTER TABLE banners ADD COLUMN IF NOT EXISTS portal_id INTEGER NULL REFERENCES portals(id) ON DELETE CASCADE;

UPDATE banners
SET portal_id = COALESCE(
    (SELECT get_default_portal_id()),
    (SELECT id FROM portals ORDER BY created_at ASC NULLS LAST, id ASC LIMIT 1)
)
WHERE portal_id IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM banners WHERE portal_id IS NULL) THEN
        ALTER TABLE banners ALTER COLUMN portal_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS banners_portal_page_route_idx ON banners (portal_id, page_type, route);
CREATE INDEX IF NOT EXISTS banners_portal_position_type_position_idx ON banners (portal_id, position_type, position);
