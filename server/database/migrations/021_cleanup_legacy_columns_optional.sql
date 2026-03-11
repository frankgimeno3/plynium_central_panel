-- 021_cleanup_legacy_columns_optional.sql
-- OPCIONAL: ejecutar solo cuando la app ya use las nuevas columnas/tablas.
-- Descomenta las líneas que quieras aplicar.

-- Articles: arrays y columna evento legacy
-- ALTER TABLE articles DROP COLUMN IF EXISTS contents_array;
-- ALTER TABLE articles DROP COLUMN IF EXISTS comments_array;
-- ALTER TABLE articles DROP COLUMN IF EXISTS event_id;
-- ALTER TABLE articles DROP COLUMN IF EXISTS portal_id;
-- ALTER TABLE articles DROP COLUMN IF EXISTS article_tags_array;

-- Comments: referencia antigua a article
-- ALTER TABLE comments DROP COLUMN IF EXISTS id_article;

-- Companies: arrays legacy
-- ALTER TABLE companies DROP COLUMN IF EXISTS products_array;
-- ALTER TABLE companies DROP COLUMN IF EXISTS categories_array;

-- Banners / Products: descomentar si aplica
-- ALTER TABLE banners DROP COLUMN IF EXISTS banner_redirection;
-- ALTER TABLE products DROP COLUMN IF EXISTS product_categories_array;
