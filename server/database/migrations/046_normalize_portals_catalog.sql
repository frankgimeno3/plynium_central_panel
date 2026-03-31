-- 046_normalize_portals_catalog.sql
-- Normaliza el catálogo canónico de portales y remapea referencias relacionadas.
-- Objetivo:
--   1) Asegurar que los portales canónicos existan en `portals`.
--   2) Unificar referencias legacy hacia esos portales en tablas con `portal_id`.
--   3) Normalizar referencias textuales en newsletters/campaigns/magazines.
-- Idempotente y conservadora: no elimina filas legacy de `portals`.

BEGIN;

CREATE TEMP TABLE tmp_canonical_portals (
    desired_id INTEGER NOT NULL UNIQUE,
    portal_key TEXT PRIMARY KEY,
    portal_name TEXT NOT NULL,
    portal_domain TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_canonical_portals (desired_id, portal_key, portal_name, portal_domain)
VALUES
    (0, 'plynium', 'Plynium', 'plynium.com'),
    (1, 'glassinformer', 'Glassinformer', 'glassinformer.com'),
    (2, 'fenestrator', 'Fenestrator', 'fenestrator.com'),
    (3, 'archinformer', 'Archinformer', 'archinformer.com'),
    (4, 'mepinformer', 'Mepinformer', 'mepinformer.com'),
    (5, 'infosmarthome', 'Infosmarthome', 'infosmarthome.com'),
    (6, 'timbinformer', 'Timbinformer', 'timbinformer.com'),
    (7, 'outinformer', 'Outinformer', 'outinformer.com'),
    (8, 'infoindoor', 'Infoindoor', 'infoindoor.com');

INSERT INTO portals (key, name, domain, default_locale, theme)
SELECT
    tcp.portal_key,
    tcp.portal_name,
    tcp.portal_domain,
    'en',
    ''
FROM tmp_canonical_portals tcp
ON CONFLICT (key) DO UPDATE
SET
    name = EXCLUDED.name,
    default_locale = 'en',
    domain = CASE
        WHEN COALESCE(portals.domain, '') = '' THEN EXCLUDED.domain
        ELSE portals.domain
    END;

UPDATE portals p
SET
    name = tcp.portal_name,
    default_locale = 'en',
    domain = CASE
        WHEN COALESCE(p.domain, '') = '' THEN tcp.portal_domain
        ELSE p.domain
    END
FROM tmp_canonical_portals tcp
WHERE lower(p.key) = tcp.portal_key;

CREATE TEMP TABLE tmp_portal_aliases (
    alias_norm TEXT PRIMARY KEY,
    canonical_key TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_portal_aliases (alias_norm, canonical_key)
VALUES
    ('plynium', 'plynium'),
    ('glassinformer', 'glassinformer'),
    ('fenestrator', 'fenestrator'),
    ('archinformer', 'archinformer'),
    ('mepinformer', 'mepinformer'),
    ('infosmarthome', 'infosmarthome'),
    ('timbinformer', 'timbinformer'),
    ('outinformer', 'outinformer'),
    ('infoindoor', 'infoindoor');

CREATE TEMP TABLE tmp_portal_id_map (
    source_portal_id INTEGER PRIMARY KEY,
    target_portal_id INTEGER NOT NULL,
    canonical_key TEXT NOT NULL,
    canonical_name TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_portal_id_map (source_portal_id, target_portal_id, canonical_key, canonical_name)
SELECT DISTINCT
    p.id AS source_portal_id,
    cp.id AS target_portal_id,
    tcp.portal_key AS canonical_key,
    tcp.portal_name AS canonical_name
FROM portals p
JOIN tmp_portal_aliases tpa
    ON regexp_replace(lower(COALESCE(p.key, '')), '[^a-z0-9]+', '', 'g') = tpa.alias_norm
    OR regexp_replace(lower(COALESCE(p.name, '')), '[^a-z0-9]+', '', 'g') = tpa.alias_norm
JOIN tmp_canonical_portals tcp
    ON tcp.portal_key = tpa.canonical_key
JOIN portals cp
    ON lower(cp.key) = tcp.portal_key;

-- ---------------------------------------------------------------------------
-- Tablas puente con portal_id
-- ---------------------------------------------------------------------------

INSERT INTO company_portals (company_id, portal_id, slug, status, created_at, updated_at)
SELECT
    cp.company_id,
    m.target_portal_id,
    cp.slug,
    cp.status,
    cp.created_at,
    cp.updated_at
FROM company_portals cp
JOIN tmp_portal_id_map m
    ON m.source_portal_id = cp.portal_id
LEFT JOIN company_portals cp2
    ON cp2.company_id = cp.company_id
   AND cp2.portal_id = m.target_portal_id
WHERE cp.portal_id <> m.target_portal_id
  AND cp2.company_id IS NULL;

DELETE FROM company_portals cp
USING tmp_portal_id_map m
WHERE cp.portal_id = m.source_portal_id
  AND cp.portal_id <> m.target_portal_id;

INSERT INTO product_portals (product_id, portal_id, slug, status, created_at, updated_at)
SELECT
    pp.product_id,
    m.target_portal_id,
    pp.slug,
    pp.status,
    pp.created_at,
    pp.updated_at
FROM product_portals pp
JOIN tmp_portal_id_map m
    ON m.source_portal_id = pp.portal_id
LEFT JOIN product_portals pp2
    ON pp2.product_id = pp.product_id
   AND pp2.portal_id = m.target_portal_id
WHERE pp.portal_id <> m.target_portal_id
  AND pp2.product_id IS NULL;

DELETE FROM product_portals pp
USING tmp_portal_id_map m
WHERE pp.portal_id = m.source_portal_id
  AND pp.portal_id <> m.target_portal_id;

INSERT INTO event_portals (event_id, portal_id, slug, status, created_at, updated_at)
SELECT
    ep.event_id,
    m.target_portal_id,
    ep.slug,
    ep.status,
    ep.created_at,
    ep.updated_at
FROM event_portals ep
JOIN tmp_portal_id_map m
    ON m.source_portal_id = ep.portal_id
LEFT JOIN event_portals ep2
    ON ep2.event_id = ep.event_id
   AND ep2.portal_id = m.target_portal_id
WHERE ep.portal_id <> m.target_portal_id
  AND ep2.event_id IS NULL;

DELETE FROM event_portals ep
USING tmp_portal_id_map m
WHERE ep.portal_id = m.source_portal_id
  AND ep.portal_id <> m.target_portal_id;

INSERT INTO publication_portals (publication_id, portal_id, slug, redirect_url, status, created_at, updated_at)
SELECT
    pp.publication_id,
    m.target_portal_id,
    pp.slug,
    pp.redirect_url,
    pp.status,
    pp.created_at,
    pp.updated_at
FROM publication_portals pp
JOIN tmp_portal_id_map m
    ON m.source_portal_id = pp.portal_id
LEFT JOIN publication_portals pp2
    ON pp2.publication_id = pp.publication_id
   AND pp2.portal_id = m.target_portal_id
WHERE pp.portal_id <> m.target_portal_id
  AND pp2.publication_id IS NULL;

DELETE FROM publication_portals pp
USING tmp_portal_id_map m
WHERE pp.portal_id = m.source_portal_id
  AND pp.portal_id <> m.target_portal_id;

UPDATE banners b
SET portal_id = m.target_portal_id
FROM tmp_portal_id_map m
WHERE b.portal_id = m.source_portal_id
  AND b.portal_id <> m.target_portal_id;

UPDATE articles a
SET portal_id = m.target_portal_id
FROM tmp_portal_id_map m
WHERE a.portal_id = m.source_portal_id
  AND a.portal_id <> m.target_portal_id;

-- ---------------------------------------------------------------------------
-- article_publications y comments
-- ---------------------------------------------------------------------------

UPDATE comments c
SET article_publication_id = ap_target.id
FROM article_publications ap_source
JOIN tmp_portal_id_map m
    ON m.source_portal_id = ap_source.portal_id
JOIN article_publications ap_target
    ON ap_target.article_id = ap_source.article_id
   AND ap_target.portal_id = m.target_portal_id
WHERE c.article_publication_id = ap_source.id
  AND ap_source.portal_id <> m.target_portal_id;

DELETE FROM article_publications ap
USING tmp_portal_id_map m, article_publications ap_target
WHERE ap.portal_id = m.source_portal_id
  AND ap.portal_id <> m.target_portal_id
  AND ap_target.article_id = ap.article_id
  AND ap_target.portal_id = m.target_portal_id;

UPDATE article_publications ap
SET portal_id = m.target_portal_id
FROM tmp_portal_id_map m
WHERE ap.portal_id = m.source_portal_id
  AND ap.portal_id <> m.target_portal_id;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT ap.id, ap.slug, ap.article_id
        FROM article_publications ap
        WHERE EXISTS (
            SELECT 1
            FROM article_publications ap2
            WHERE ap2.portal_id = ap.portal_id
              AND ap2.slug = ap.slug
              AND ap2.id <> ap.id
        )
    ) LOOP
        UPDATE article_publications
        SET slug = r.slug || '-' || r.article_id
        WHERE id = r.id;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Referencias textuales
-- ---------------------------------------------------------------------------

UPDATE newsletter_campaigns nc
SET portal_code = tcp.portal_key
FROM tmp_canonical_portals tcp
WHERE regexp_replace(lower(COALESCE(nc.portal_code, '')), '[^a-z0-9]+', '', 'g') = tcp.portal_key
  AND nc.portal_code <> tcp.portal_key;

UPDATE newsletters n
SET portal_code = tcp.portal_key
FROM tmp_canonical_portals tcp
WHERE regexp_replace(lower(COALESCE(n.portal_code, '')), '[^a-z0-9]+', '', 'g') = tcp.portal_key
  AND n.portal_code <> tcp.portal_key;

UPDATE magazines m
SET portal_name = tcp.portal_name
FROM tmp_canonical_portals tcp
WHERE regexp_replace(lower(COALESCE(m.portal_name, '')), '[^a-z0-9]+', '', 'g') = tcp.portal_key
  AND m.portal_name <> tcp.portal_name;

-- ---------------------------------------------------------------------------
-- Renumeración de IDs canónicos a 0..8
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE tmp_canonical_current_ids (
    desired_id INTEGER PRIMARY KEY,
    current_id INTEGER NOT NULL,
    portal_key TEXT NOT NULL,
    portal_name TEXT NOT NULL,
    portal_domain TEXT NOT NULL,
    default_locale TEXT NOT NULL,
    theme TEXT NOT NULL,
    created_at TIMESTAMPTZ
) ON COMMIT DROP;

INSERT INTO tmp_canonical_current_ids (
    desired_id,
    current_id,
    portal_key,
    portal_name,
    portal_domain,
    default_locale,
    theme,
    created_at
)
SELECT
    tcp.desired_id,
    p.id,
    tcp.portal_key,
    tcp.portal_name,
    tcp.portal_domain,
    COALESCE(NULLIF(p.default_locale, ''), 'en'),
    COALESCE(p.theme, ''),
    p.created_at
FROM tmp_canonical_portals tcp
JOIN portals p
    ON lower(p.key) = tcp.portal_key;

CREATE TEMP TABLE tmp_displaced_portals (
    source_id INTEGER PRIMARY KEY,
    temp_id INTEGER NOT NULL UNIQUE,
    portal_key TEXT NOT NULL,
    portal_name TEXT NOT NULL,
    portal_domain TEXT NOT NULL,
    default_locale TEXT NOT NULL,
    theme TEXT NOT NULL,
    created_at TIMESTAMPTZ
) ON COMMIT DROP;

INSERT INTO tmp_displaced_portals (
    source_id,
    temp_id,
    portal_key,
    portal_name,
    portal_domain,
    default_locale,
    theme,
    created_at
)
SELECT
    p.id AS source_id,
    (SELECT COALESCE(MAX(id), 0) FROM portals) + ROW_NUMBER() OVER (ORDER BY p.id) AS temp_id,
    p.key,
    p.name,
    p.domain,
    COALESCE(NULLIF(p.default_locale, ''), 'en'),
    COALESCE(p.theme, ''),
    p.created_at
FROM portals p
JOIN tmp_canonical_portals tcp
    ON p.id = tcp.desired_id
LEFT JOIN tmp_canonical_current_ids tcc
    ON tcc.current_id = p.id
WHERE tcc.current_id IS NULL;

INSERT INTO portals (id, key, name, domain, default_locale, theme, created_at)
SELECT
    tdp.temp_id,
    '__tmp_displaced_' || tdp.source_id,
    tdp.portal_name,
    tdp.portal_domain,
    tdp.default_locale,
    tdp.theme,
    COALESCE(tdp.created_at, NOW())
FROM tmp_displaced_portals tdp
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
    moved RECORD;
BEGIN
    FOR moved IN SELECT source_id, temp_id FROM tmp_displaced_portals LOOP
        UPDATE company_portals SET portal_id = moved.temp_id WHERE portal_id = moved.source_id;
        UPDATE product_portals SET portal_id = moved.temp_id WHERE portal_id = moved.source_id;
        UPDATE event_portals SET portal_id = moved.temp_id WHERE portal_id = moved.source_id;
        UPDATE publication_portals SET portal_id = moved.temp_id WHERE portal_id = moved.source_id;
        UPDATE banners SET portal_id = moved.temp_id WHERE portal_id = moved.source_id;
        UPDATE articles SET portal_id = moved.temp_id WHERE portal_id = moved.source_id;
        UPDATE article_publications SET portal_id = moved.temp_id WHERE portal_id = moved.source_id;

        DELETE FROM portals WHERE id = moved.source_id;

        UPDATE portals
        SET
            key = (SELECT portal_key FROM tmp_displaced_portals WHERE source_id = moved.source_id),
            name = (SELECT portal_name FROM tmp_displaced_portals WHERE source_id = moved.source_id),
            domain = (SELECT portal_domain FROM tmp_displaced_portals WHERE source_id = moved.source_id),
            default_locale = (SELECT default_locale FROM tmp_displaced_portals WHERE source_id = moved.source_id),
            theme = (SELECT theme FROM tmp_displaced_portals WHERE source_id = moved.source_id),
            created_at = COALESCE((SELECT created_at FROM tmp_displaced_portals WHERE source_id = moved.source_id), created_at)
        WHERE id = moved.temp_id;
    END LOOP;
END $$;

INSERT INTO portals (id, key, name, domain, default_locale, theme, created_at)
SELECT
    tcc.desired_id,
    '__tmp_canonical_' || tcc.desired_id,
    tcc.portal_name,
    tcc.portal_domain,
    tcc.default_locale,
    tcc.theme,
    COALESCE(tcc.created_at, NOW())
FROM tmp_canonical_current_ids tcc
WHERE tcc.current_id <> tcc.desired_id
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
    moved RECORD;
BEGIN
    FOR moved IN
        SELECT desired_id, current_id, portal_key, portal_name, portal_domain, default_locale, theme, created_at
        FROM tmp_canonical_current_ids
        WHERE current_id <> desired_id
    LOOP
        UPDATE company_portals SET portal_id = moved.desired_id WHERE portal_id = moved.current_id;
        UPDATE product_portals SET portal_id = moved.desired_id WHERE portal_id = moved.current_id;
        UPDATE event_portals SET portal_id = moved.desired_id WHERE portal_id = moved.current_id;
        UPDATE publication_portals SET portal_id = moved.desired_id WHERE portal_id = moved.current_id;
        UPDATE banners SET portal_id = moved.desired_id WHERE portal_id = moved.current_id;
        UPDATE articles SET portal_id = moved.desired_id WHERE portal_id = moved.current_id;
        UPDATE article_publications SET portal_id = moved.desired_id WHERE portal_id = moved.current_id;

        DELETE FROM portals WHERE id = moved.current_id;

        UPDATE portals
        SET
            key = moved.portal_key,
            name = moved.portal_name,
            domain = moved.portal_domain,
            default_locale = moved.default_locale,
            theme = moved.theme,
            created_at = COALESCE(moved.created_at, created_at)
        WHERE id = moved.desired_id;
    END LOOP;
END $$;

SELECT setval(
    pg_get_serial_sequence('portals', 'id'),
    COALESCE((SELECT MAX(id) FROM portals), 1),
    TRUE
);

COMMIT;

-- ---------------------------------------------------------------------------
-- Verificación rápida posterior a la migración
-- ---------------------------------------------------------------------------
SELECT id, key, name, domain, default_locale
FROM portals
WHERE lower(key) IN (
    'plynium',
    'glassinformer',
    'fenestrator',
    'archinformer',
    'mepinformer',
    'infosmarthome',
    'timbinformer',
    'outinformer',
    'infoindoor'
)
ORDER BY lower(key);
