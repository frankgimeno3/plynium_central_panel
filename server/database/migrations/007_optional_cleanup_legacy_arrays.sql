-- 007_optional_cleanup_legacy_arrays.sql
-- Objetivo: OPCIONAL. No ejecutar hasta haber migrado toda la lógica de negocio que dependa de estas columnas.
-- Elimina columnas legacy (arrays y enlaces viejos) una vez que event_articles, contents normalizados y comments
-- estén en uso y el código ya no lea contents_array, comments_array ni event_id en artículos.
-- DESTRUCTIVO: borra columnas y datos. Ejecutar solo cuando estés seguro.

-- Cuándo ejecutar:
-- - Después de 001..006 y de haber actualizado la aplicación para no usar contents_array ni comments_array.
-- - Cuando la lista de contenidos por artículo se obtenga desde la tabla contents (article_id + position).
-- - Cuando los comentarios se obtengan por article_publication_id.
-- - articles.event_id: cuando la relación artículo-eventos se use solo desde event_articles.

-- 1) Articles: arrays de contents y comments (legacy)
-- ALTER TABLE articles DROP COLUMN IF EXISTS contents_array;
-- ALTER TABLE articles DROP COLUMN IF EXISTS comments_array;

-- 2) Articles: enlace antiguo a un solo evento (ahora en event_articles)
-- ALTER TABLE articles DROP COLUMN IF EXISTS event_id;

-- 3) Comments: enlace antiguo solo a artículo (ahora article_publication_id)
-- ALTER TABLE comments DROP COLUMN IF EXISTS id_article;

-- 4) Companies: arrays legacy (productos/categorías por portal vía company_portals y tablas de dominio)
-- ALTER TABLE companies DROP COLUMN IF EXISTS products_array;
-- ALTER TABLE companies DROP COLUMN IF EXISTS categories_array;

-- Descomenta las líneas anteriores cuando quieras ejecutar la limpieza.
