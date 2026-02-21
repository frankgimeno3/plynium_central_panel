-- 014_banners_align_schema.sql
-- Objetivo: Alinear la tabla banners con el esquema coherente multi-portal.
-- Coherencia: portal_id + page_type + route + position_type + position definen
-- el contexto de visualización; starts_at/ends_at permiten programación; alt y redirect_url unifican nombres.
-- NO se eliminan columnas legacy (banner_redirection, src) en esta pasada.

-- Columnas nuevas alineadas al esquema de referencia
ALTER TABLE banners ADD COLUMN IF NOT EXISTS alt TEXT NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS redirect_url TEXT NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ NULL;

-- Backfill redirect_url desde legacy banner_redirection (mantenemos banner_redirection para no romper código)
UPDATE banners
SET redirect_url = banner_redirection
WHERE redirect_url IS NULL AND banner_redirection IS NOT NULL;

-- Índice compuesto para consultas coherentes: listar banners por portal + página + ruta + tipo de posición y orden
CREATE INDEX IF NOT EXISTS banners_portal_page_route_idx
    ON banners (portal_id, page_type, route);
CREATE INDEX IF NOT EXISTS banners_portal_position_type_position_idx
    ON banners (portal_id, position_type, position);

-- Índice para banners activos por ventana temporal (feed por portal/fecha)
CREATE INDEX IF NOT EXISTS banners_portal_starts_ends_idx
    ON banners (portal_id, starts_at, ends_at)
    WHERE starts_at IS NOT NULL OR ends_at IS NOT NULL;

-- Trigger updated_at (coherencia con el resto de tablas)
DROP TRIGGER IF EXISTS banners_updated_at ON banners;
CREATE TRIGGER banners_updated_at
    BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE banners IS 'Banners por portal. Coherencia: (portal_id, page_type, route, position_type, position). Opcional: starts_at/ends_at para programación.';
