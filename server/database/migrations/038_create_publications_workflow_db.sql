-- 038_create_publications_workflow_db.sql
-- Tablas para el flujo completo de publicaciones: planned_publications, flatplans, y publication_slots.
-- Complementa la tabla publications existente (publicaciones ya publicadas).
-- Idempotente.

-- ============================================================================
-- planned_publications: Publicaciones planificadas (antes de entrar en producción)
-- ============================================================================
CREATE TABLE IF NOT EXISTS planned_publications (
    id_planned_publication VARCHAR(64) PRIMARY KEY,
    id_magazine VARCHAR(64) NOT NULL REFERENCES magazines(id_magazine) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    issue_number INTEGER NOT NULL,
    edition_name VARCHAR(512) NOT NULL DEFAULT '',
    theme VARCHAR(512) DEFAULT '',
    publication_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (id_magazine, year, issue_number) REFERENCES magazine_issues(id_magazine, year, issue_number) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS planned_publications_magazine_idx ON planned_publications (id_magazine);
CREATE INDEX IF NOT EXISTS planned_publications_year_idx ON planned_publications (year);
CREATE INDEX IF NOT EXISTS planned_publications_publication_date_idx ON planned_publications (publication_date);

DROP TRIGGER IF EXISTS planned_publications_updated_at ON planned_publications;
CREATE TRIGGER planned_publications_updated_at
    BEFORE UPDATE ON planned_publications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE planned_publications IS 'Planned publications before entering production. Links to magazine_issues.';

-- ============================================================================
-- flatplans: Publicaciones en producción (maquetación)
-- ============================================================================
CREATE TABLE IF NOT EXISTS flatplans (
    id_flatplan VARCHAR(64) PRIMARY KEY,
    id_magazine VARCHAR(64) NOT NULL REFERENCES magazines(id_magazine) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    issue_number INTEGER NOT NULL,
    edition_name VARCHAR(512) NOT NULL DEFAULT '',
    theme VARCHAR(512) DEFAULT '',
    publication_date DATE,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (id_magazine, year, issue_number) REFERENCES magazine_issues(id_magazine, year, issue_number) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS flatplans_magazine_idx ON flatplans (id_magazine);
CREATE INDEX IF NOT EXISTS flatplans_year_idx ON flatplans (year);
CREATE INDEX IF NOT EXISTS flatplans_publication_date_idx ON flatplans (publication_date);

DROP TRIGGER IF EXISTS flatplans_updated_at ON flatplans;
CREATE TRIGGER flatplans_updated_at
    BEFORE UPDATE ON flatplans
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE flatplans IS 'Publications in production (flatplanning stage). Links to magazine_issues.';

-- ============================================================================
-- publication_slots: Slots para planned_publications y flatplans
-- (cover, inside_cover, end, y páginas numeradas 1, 2, 3, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS publication_slots (
    id SERIAL PRIMARY KEY,
    -- Solo uno de estos debe ser NOT NULL para indicar a qué pertenece el slot
    planned_publication_id VARCHAR(64) REFERENCES planned_publications(id_planned_publication) ON DELETE CASCADE,
    flatplan_id VARCHAR(64) REFERENCES flatplans(id_flatplan) ON DELETE CASCADE,
    
    slot_key VARCHAR(32) NOT NULL, -- 'cover', 'inside_cover', 'end', '1', '2', '3', etc.
    content_type VARCHAR(32) NOT NULL CHECK (content_type IN ('cover', 'inside_cover', 'end', 'article', 'advert')),
    state VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'content ok', 'available')),
    
    id_advertiser VARCHAR(64) DEFAULT NULL,
    id_project VARCHAR(64) DEFAULT NULL,
    image_src VARCHAR(512) DEFAULT NULL,
    article_id VARCHAR(64) DEFAULT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: un slot pertenece a planned_publication O flatplan, no ambos
    CONSTRAINT slot_belongs_to_one CHECK (
        (planned_publication_id IS NOT NULL AND flatplan_id IS NULL) OR
        (planned_publication_id IS NULL AND flatplan_id IS NOT NULL)
    ),
    -- Unique slot per parent
    CONSTRAINT unique_slot_per_planned UNIQUE (planned_publication_id, slot_key),
    CONSTRAINT unique_slot_per_flatplan UNIQUE (flatplan_id, slot_key)
);

CREATE INDEX IF NOT EXISTS publication_slots_planned_idx ON publication_slots (planned_publication_id) WHERE planned_publication_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS publication_slots_flatplan_idx ON publication_slots (flatplan_id) WHERE flatplan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS publication_slots_advertiser_idx ON publication_slots (id_advertiser) WHERE id_advertiser IS NOT NULL;

DROP TRIGGER IF EXISTS publication_slots_updated_at ON publication_slots;
CREATE TRIGGER publication_slots_updated_at
    BEFORE UPDATE ON publication_slots
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE publication_slots IS 'Content slots (pages) for planned publications and flatplans.';

-- ============================================================================
-- offered_preferential_pages: Páginas preferenciales ofrecidas
-- ============================================================================
CREATE TABLE IF NOT EXISTS offered_preferential_pages (
    id SERIAL PRIMARY KEY,
    planned_publication_id VARCHAR(64) REFERENCES planned_publications(id_planned_publication) ON DELETE CASCADE,
    flatplan_id VARCHAR(64) REFERENCES flatplans(id_flatplan) ON DELETE CASCADE,
    page_type VARCHAR(64) NOT NULL, -- 'Cover page', 'Preferential page', 'Double page', 'Single page', 'End page', etc.
    slot_key VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT offered_belongs_to_one CHECK (
        (planned_publication_id IS NOT NULL AND flatplan_id IS NULL) OR
        (planned_publication_id IS NULL AND flatplan_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS offered_pages_planned_idx ON offered_preferential_pages (planned_publication_id) WHERE planned_publication_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS offered_pages_flatplan_idx ON offered_preferential_pages (flatplan_id) WHERE flatplan_id IS NOT NULL;

COMMENT ON TABLE offered_preferential_pages IS 'Preferential page offerings for planned publications and flatplans.';

-- ============================================================================
-- single_available: Disponibilidad de página única
-- ============================================================================
CREATE TABLE IF NOT EXISTS publication_single_available (
    id SERIAL PRIMARY KEY,
    planned_publication_id VARCHAR(64) UNIQUE REFERENCES planned_publications(id_planned_publication) ON DELETE CASCADE,
    state VARCHAR(32) NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS publication_single_available_updated_at ON publication_single_available;
CREATE TRIGGER publication_single_available_updated_at
    BEFORE UPDATE ON publication_single_available
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Agregar columnas faltantes a publications (si no existen)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'publications' AND column_name = 'id_magazine') THEN
        ALTER TABLE publications ADD COLUMN id_magazine VARCHAR(64) REFERENCES magazines(id_magazine) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'publications' AND column_name = 'year') THEN
        ALTER TABLE publications ADD COLUMN year INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'publications' AND column_name = 'issue_number') THEN
        ALTER TABLE publications ADD COLUMN issue_number INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'publications' AND column_name = 'edition_name') THEN
        ALTER TABLE publications ADD COLUMN edition_name VARCHAR(512) DEFAULT '';
    END IF;
END $$;

-- ============================================================================
-- Seed inicial con datos del JSON
-- ============================================================================

-- Planned publications
INSERT INTO planned_publications (id_planned_publication, id_magazine, year, issue_number, edition_name, theme, publication_date)
VALUES
    ('pub-001', 'mag-001', 2025, 1, 'Glass Today March 2025', 'Innovation in architectural glass', '2025-05-15'),
    ('pub-002', 'mag-002', 2025, 1, 'Glass and Construction June 2025', 'Sustainable construction', '2025-06-30'),
    ('pub-003', 'mag-003', 2025, 1, 'Industrial Glass February 2025', 'Industrial processes', '2025-02-10')
ON CONFLICT (id_planned_publication) DO NOTHING;

-- Flatplans
INSERT INTO flatplans (id_flatplan, id_magazine, year, issue_number, edition_name, theme, publication_date)
VALUES
    ('fp-001', 'mag-001', 2025, 1, 'Glass Today March 2025', 'Innovation in architectural glass', '2025-05-15'),
    ('fp-002', 'mag-002', 2025, 1, 'Glass and Construction June 2025', 'Sustainable construction', '2025-06-30'),
    ('fp-003', 'mag-003', 2025, 1, 'Industrial Glass February 2025', 'Industrial processes', '2025-02-10')
ON CONFLICT (id_flatplan) DO NOTHING;

-- Slots para pub-001 (planned)
INSERT INTO publication_slots (planned_publication_id, slot_key, content_type, state, id_advertiser, id_project, image_src, article_id)
VALUES
    ('pub-001', 'cover', 'cover', 'content ok', 'cust-002', 'proj-004', '/pub001/cover.jpg', NULL),
    ('pub-001', 'inside_cover', 'inside_cover', 'pending', 'cust-004', 'proj-010', '/pub001/inside_cover.jpg', NULL),
    ('pub-001', 'end', 'end', 'pending', 'cust-002', 'proj-021', '/pub001/end.jpg', NULL),
    ('pub-001', '1', 'article', 'content ok', 'cust-001', 'proj-002', NULL, 'art-042'),
    ('pub-001', '2', 'advert', 'content ok', 'cust-002', 'proj-004', '/pub001/2-advert.jpg', NULL),
    ('pub-001', '3', 'article', 'pending', 'cust-003', 'proj-006', NULL, 'art-078'),
    ('pub-001', '4', 'advert', 'pending', 'cust-004', 'proj-010', '/pub001/4-advert.jpg', NULL),
    ('pub-001', '5', 'article', 'content ok', 'cust-001', 'proj-003', NULL, 'art-015'),
    ('pub-001', '6', 'advert', 'pending', 'cust-002', 'proj-005', '/pub001/6-advert.jpg', NULL),
    ('pub-001', '7', 'article', 'content ok', 'cust-003', 'proj-013', NULL, 'art-091'),
    ('pub-001', '8', 'advert', 'pending', 'cust-004', 'proj-011', '/pub001/8-advert.jpg', NULL),
    ('pub-001', '9', 'article', 'content ok', 'cust-001', 'proj-001', NULL, 'art-003'),
    ('pub-001', '10', 'advert', 'pending', 'cust-002', 'proj-021', '/pub001/10-advert.jpg', NULL)
ON CONFLICT (planned_publication_id, slot_key) DO NOTHING;

-- Slots para pub-002 (planned)
INSERT INTO publication_slots (planned_publication_id, slot_key, content_type, state, id_advertiser, id_project, image_src, article_id)
VALUES
    ('pub-002', 'cover', 'cover', 'pending', 'cust-001', 'proj-006', '/pub002/cover.jpg', NULL),
    ('pub-002', 'inside_cover', 'inside_cover', 'pending', 'cust-002', 'proj-016', '/pub002/inside_cover.jpg', NULL),
    ('pub-002', 'end', 'end', 'content ok', 'cust-001', 'proj-004', '/pub002/end.jpg', NULL),
    ('pub-002', '1', 'article', 'content ok', 'cust-002', 'proj-006', NULL, 'art-112'),
    ('pub-002', '2', 'advert', 'pending', 'cust-003', 'proj-013', '/pub002/2-advert.jpg', NULL),
    ('pub-002', '3', 'article', 'pending', 'cust-001', 'proj-002', NULL, 'art-045'),
    ('pub-002', '4', 'advert', 'content ok', 'cust-004', 'proj-016', '/pub002/4-advert.jpg', NULL),
    ('pub-002', '5', 'article', 'content ok', 'cust-002', 'proj-017', NULL, 'art-088'),
    ('pub-002', '6', 'advert', 'pending', 'cust-003', 'proj-014', '/pub002/6-advert.jpg', NULL),
    ('pub-002', '7', 'article', 'content ok', 'cust-001', 'proj-009', NULL, 'art-062'),
    ('pub-002', '8', 'advert', 'pending', 'cust-004', 'proj-022', '/pub002/8-advert.jpg', NULL),
    ('pub-002', '9', 'article', 'pending', 'cust-002', 'proj-018', NULL, 'art-095'),
    ('pub-002', '10', 'advert', 'content ok', 'cust-003', 'proj-015', '/pub002/10-advert.jpg', NULL)
ON CONFLICT (planned_publication_id, slot_key) DO NOTHING;

-- Slots para pub-003 (planned)
INSERT INTO publication_slots (planned_publication_id, slot_key, content_type, state, id_advertiser, id_project, image_src, article_id)
VALUES
    ('pub-003', 'cover', 'cover', 'content ok', 'cust-003', 'proj-013', '/pub003/cover.jpg', NULL),
    ('pub-003', 'inside_cover', 'inside_cover', 'pending', 'cust-004', 'proj-023', '/pub003/inside_cover.jpg', NULL),
    ('pub-003', 'end', 'end', 'pending', 'cust-003', 'proj-013', '/pub003/end.jpg', NULL),
    ('pub-003', '1', 'article', 'content ok', 'cust-004', 'proj-013', NULL, 'art-118'),
    ('pub-003', '2', 'advert', 'content ok', 'cust-001', 'proj-023', '/pub003/2-advert.jpg', NULL),
    ('pub-003', '3', 'article', 'pending', 'cust-002', 'proj-021', NULL, 'art-107'),
    ('pub-003', '4', 'advert', 'pending', 'cust-003', 'proj-013', '/pub003/4-advert.jpg', NULL),
    ('pub-003', '5', 'article', 'content ok', 'cust-004', 'proj-024', NULL, 'art-121'),
    ('pub-003', '6', 'advert', 'pending', 'cust-001', 'proj-017', '/pub003/6-advert.jpg', NULL),
    ('pub-003', '7', 'article', 'content ok', 'cust-002', 'proj-006', NULL, 'art-034'),
    ('pub-003', '8', 'advert', 'content ok', 'cust-003', 'proj-023', '/pub003/8-advert.jpg', NULL),
    ('pub-003', '9', 'article', 'pending', 'cust-004', 'proj-022', NULL, 'art-099'),
    ('pub-003', '10', 'advert', 'pending', 'cust-001', 'proj-005', '/pub003/10-advert.jpg', NULL)
ON CONFLICT (planned_publication_id, slot_key) DO NOTHING;

-- Slots para fp-001 (flatplan)
INSERT INTO publication_slots (flatplan_id, slot_key, content_type, state, id_advertiser, id_project, image_src, article_id)
VALUES
    ('fp-001', 'cover', 'cover', 'content ok', 'cust-002', 'proj-004', '/pub001/cover.jpg', NULL),
    ('fp-001', 'inside_cover', 'inside_cover', 'pending', 'cust-004', 'proj-010', '/pub001/inside_cover.jpg', NULL),
    ('fp-001', 'end', 'end', 'pending', 'cust-002', 'proj-021', '/pub001/end.jpg', NULL),
    ('fp-001', '1', 'article', 'content ok', 'cust-001', 'proj-002', NULL, 'art-042'),
    ('fp-001', '2', 'advert', 'content ok', 'cust-002', 'proj-004', '/pub001/2-advert.jpg', NULL),
    ('fp-001', '3', 'article', 'pending', 'cust-003', 'proj-006', NULL, 'art-078'),
    ('fp-001', '4', 'advert', 'pending', 'cust-004', 'proj-010', '/pub001/4-advert.jpg', NULL),
    ('fp-001', '5', 'article', 'content ok', 'cust-001', 'proj-003', NULL, 'art-015'),
    ('fp-001', '6', 'advert', 'pending', 'cust-002', 'proj-005', '/pub001/6-advert.jpg', NULL),
    ('fp-001', '7', 'article', 'content ok', 'cust-003', 'proj-013', NULL, 'art-091'),
    ('fp-001', '8', 'advert', 'pending', 'cust-004', 'proj-011', '/pub001/8-advert.jpg', NULL),
    ('fp-001', '9', 'article', 'content ok', 'cust-001', 'proj-001', NULL, 'art-003'),
    ('fp-001', '10', 'advert', 'pending', 'cust-002', 'proj-021', '/pub001/10-advert.jpg', NULL)
ON CONFLICT (flatplan_id, slot_key) DO NOTHING;

-- Slots para fp-002 (flatplan - menos páginas)
INSERT INTO publication_slots (flatplan_id, slot_key, content_type, state, id_advertiser, id_project, image_src, article_id)
VALUES
    ('fp-002', 'cover', 'cover', 'pending', 'cust-001', 'proj-006', '/pub002/cover.jpg', NULL),
    ('fp-002', 'inside_cover', 'inside_cover', 'pending', 'cust-002', 'proj-016', '/pub002/inside_cover.jpg', NULL),
    ('fp-002', 'end', 'end', 'content ok', 'cust-001', 'proj-004', '/pub002/end.jpg', NULL),
    ('fp-002', '1', 'article', 'content ok', 'cust-002', 'proj-006', NULL, 'art-112'),
    ('fp-002', '2', 'advert', 'pending', 'cust-003', 'proj-013', '/pub002/2-advert.jpg', NULL),
    ('fp-002', '3', 'article', 'pending', 'cust-001', 'proj-002', NULL, 'art-045'),
    ('fp-002', '4', 'advert', 'content ok', 'cust-004', 'proj-016', '/pub002/4-advert.jpg', NULL)
ON CONFLICT (flatplan_id, slot_key) DO NOTHING;

-- Slots para fp-003 (flatplan - menos páginas)
INSERT INTO publication_slots (flatplan_id, slot_key, content_type, state, id_advertiser, id_project, image_src, article_id)
VALUES
    ('fp-003', 'cover', 'cover', 'content ok', 'cust-003', 'proj-013', '/pub003/cover.jpg', NULL),
    ('fp-003', 'inside_cover', 'inside_cover', 'pending', 'cust-004', 'proj-023', '/pub003/inside_cover.jpg', NULL),
    ('fp-003', 'end', 'end', 'pending', 'cust-003', 'proj-013', '/pub003/end.jpg', NULL),
    ('fp-003', '1', 'article', 'content ok', 'cust-004', 'proj-013', NULL, 'art-118'),
    ('fp-003', '2', 'advert', 'content ok', 'cust-001', 'proj-023', '/pub003/2-advert.jpg', NULL)
ON CONFLICT (flatplan_id, slot_key) DO NOTHING;

-- Offered preferential pages para planned publications
INSERT INTO offered_preferential_pages (planned_publication_id, page_type, slot_key)
VALUES
    ('pub-001', 'Cover page', 'cover'),
    ('pub-001', 'Preferential page', 'inside_cover'),
    ('pub-001', 'Double page', '2'),
    ('pub-001', 'Single page', '1'),
    ('pub-001', 'End page', 'end'),
    ('pub-001', 'Single page (disponible)', 'single_available'),
    ('pub-002', 'Cover page', 'cover'),
    ('pub-002', 'Preferential page', 'inside_cover'),
    ('pub-002', 'Double page', '2'),
    ('pub-002', 'Single page', '1'),
    ('pub-002', 'End page', 'end'),
    ('pub-003', 'Cover page', 'cover'),
    ('pub-003', 'Preferential page', 'inside_cover'),
    ('pub-003', 'Double page', '2'),
    ('pub-003', 'Single page', '1'),
    ('pub-003', 'End page', 'end')
ON CONFLICT DO NOTHING;

-- Offered preferential pages para flatplans
INSERT INTO offered_preferential_pages (flatplan_id, page_type, slot_key)
VALUES
    ('fp-001', 'Cover page', 'cover'),
    ('fp-001', 'Preferential page', 'inside_cover'),
    ('fp-001', 'Double page', '2'),
    ('fp-001', 'Single page', '1'),
    ('fp-001', 'End page', 'end'),
    ('fp-002', 'Cover page', 'cover'),
    ('fp-002', 'Preferential page', 'inside_cover'),
    ('fp-002', 'End page', 'end'),
    ('fp-003', 'Cover page', 'cover'),
    ('fp-003', 'Preferential page', 'inside_cover')
ON CONFLICT DO NOTHING;

-- Single available para pub-001
INSERT INTO publication_single_available (planned_publication_id, state)
VALUES ('pub-001', 'available')
ON CONFLICT (planned_publication_id) DO NOTHING;

-- Actualizar publications existentes con magazine info (si existen)
UPDATE publications p
SET 
    id_magazine = 'mag-001',
    year = 2025,
    issue_number = 1,
    edition_name = 'Glass Today March 2025'
WHERE p.id_publication = 'pub-001' AND p.id_magazine IS NULL;

UPDATE publications p
SET 
    id_magazine = 'mag-002',
    year = 2025,
    issue_number = 1,
    edition_name = 'Glass and Construction June 2025'
WHERE p.id_publication = 'pub-002' AND p.id_magazine IS NULL;

UPDATE publications p
SET 
    id_magazine = 'mag-003',
    year = 2025,
    issue_number = 1,
    edition_name = 'Industrial Glass February 2025'
WHERE p.id_publication = 'pub-003' AND p.id_magazine IS NULL;

UPDATE publications p
SET 
    id_magazine = 'mag-001',
    year = 2024,
    issue_number = 2,
    edition_name = 'Glass Today 2024 - Special Edition'
WHERE p.id_publication = 'pub-004' AND p.id_magazine IS NULL;
