-- 006_id_consistency_audit.sql
-- Objetivo: SOLO LECTURA. No modifica datos ni esquema.
-- Ejecutar en pgAdmin para revisar tipos de PK/FK y detectar inconsistencias.
-- Estándar deseado: IDs string (TEXT) en entidades principales; UUID solo en article_publications.id.

-- ========== 1) Tipos de columnas clave (PK y columnas de referencia) ==========
SELECT
    c.table_schema,
    c.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND (
    (c.table_name, c.column_name) IN (
        ('users', 'id_user'),
        ('articles', 'id_article'),
        ('companies', 'company_id'),
        ('products', 'product_id'),
        ('events', 'id_fair'),
        ('publications', 'id_publication'),
        ('banners', 'id'),
        ('portals', 'id'),
        ('article_publications', 'id'),
        ('article_publications', 'article_id'),
        ('comments', 'id_article'),
        ('comments', 'article_publication_id'),
        ('contents', 'content_id'),
        ('contents', 'article_id'),
        ('company_portals', 'company_id'),
        ('product_portals', 'product_id'),
        ('event_portals', 'event_id'),
        ('publication_portals', 'publication_id'),
        ('event_articles', 'event_id'),
        ('event_articles', 'article_id'),
        ('banners', 'portal_id')
    )
  )
ORDER BY c.table_name, c.column_name;

-- ========== 2) FKs: comprobar que tipo de columna FK = tipo de PK referenciada ==========
SELECT
    tc.table_schema AS fk_table_schema,
    tc.table_name AS fk_table,
    kcu.column_name AS fk_column,
    ccu.table_name AS ref_table,
    ccu.column_name AS ref_column,
    ac_fk.data_type AS fk_data_type,
    ac_ref.data_type AS ref_data_type,
    CASE WHEN ac_fk.data_type IS DISTINCT FROM ac_ref.data_type THEN 'MISMATCH' ELSE 'OK' END AS type_match
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.constraint_schema
JOIN information_schema.columns ac_fk
    ON ac_fk.table_schema = kcu.table_schema AND ac_fk.table_name = kcu.table_name AND ac_fk.column_name = kcu.column_name
JOIN information_schema.columns ac_ref
    ON ac_ref.table_schema = ccu.table_schema AND ac_ref.table_name = ccu.table_name AND ac_ref.column_name = ccu.column_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ========== 3) Columnas que referencian lógicamente pero sin FK (candidatas a añadir FK o corregir tipo) ==========
-- company_portals.company_id vs companies.company_id
SELECT 'company_portals.company_id' AS col, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_portals' AND column_name = 'company_id'
UNION ALL
SELECT 'companies.company_id', data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'company_id';

-- product_portals.product_id vs products.product_id
SELECT 'product_portals.product_id' AS col, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_portals' AND column_name = 'product_id'
UNION ALL
SELECT 'products.product_id', data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'product_id';

-- contents.article_id vs articles.id_article
SELECT 'contents.article_id' AS col, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contents' AND column_name = 'article_id'
UNION ALL
SELECT 'articles.id_article', data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'id_article';

-- ========== 4) Comentario en comments: columna de timestamp para ordenación ==========
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'comments'
  AND column_name IN ('created_at', 'updated_at', 'id_timestamp', 'timestamp', 'date')
ORDER BY column_name;

-- ========== 5) Resumen: tablas con posibles UUID donde se espera TEXT ==========
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'uuid'
ORDER BY table_name, column_name;
