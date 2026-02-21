-- 013_cleanup_legacy_columns_optional.sql
-- ============================================================
-- OPCIONAL: NO ejecutar hasta haber migrado la aplicación al
-- uso de las nuevas columnas/tablas y validado backfills.
-- Ejecutar manualmente cuando decidas eliminar columnas legacy.
-- ============================================================

-- Eliminar columnas de arrays y referencias legacy ya reemplazadas por tablas normalizadas.

-- Articles: arrays de contents y (si existe) comments
ALTER TABLE articles DROP COLUMN IF EXISTS contents_array;
-- ALTER TABLE articles DROP COLUMN IF EXISTS comments_array;  -- si existe

-- Article: columna de transición portal_id (opcional mantener si la app aún la usa)
-- ALTER TABLE articles DROP COLUMN IF EXISTS portal_id;

-- Comments: referencia antigua a article
ALTER TABLE comments DROP COLUMN IF EXISTS id_article;

-- Companies: arrays (productos/categorías por portal se gestionan vía company_portals y tablas de dominio)
ALTER TABLE companies DROP COLUMN IF EXISTS products_array;
ALTER TABLE companies DROP COLUMN IF EXISTS categories_array;

-- Articles: otros arrays legacy si existen
ALTER TABLE articles DROP COLUMN IF EXISTS article_tags_array;

-- Products: array de categorías si se reemplaza por tabla normalizada
-- ALTER TABLE products DROP COLUMN IF EXISTS product_categories_array;

-- Banners: unificar a redirect_url (tras migrar la app a usar redirect_url en lugar de banner_redirection)
-- ALTER TABLE banners DROP COLUMN IF EXISTS banner_redirection;
-- Si en el futuro la imagen se guarda en otro servicio, src podría renombrarse; no eliminar sin reemplazo.
-- ALTER TABLE banners DROP COLUMN IF EXISTS src;

-- Revisar otras tablas que tengan columnas array o FK legacy antes de ejecutar.
-- Ejemplo: si events/publications tienen columnas redundantes, añadir aquí.
