-- 028_create_magazines_db.sql
-- Tablas magazines y magazine_issues. Idempotente.
--
-- Por qué están separadas:
--   magazines     = cabecera/revista (Buildinformer, Fenestrator, Glassinformer) con metadatos (name, description, first_year, last_year).
--   magazine_issues = cada edición concreta: "revista X, año Y, número Z" (PK: id_magazine, year, issue_number).
-- Una publication (publicada), una planned_publication o un flatplan referencian siempre una edición = una fila de magazine_issues (vía id_magazine + year + issue_number).

CREATE TABLE IF NOT EXISTS magazines (
    id_magazine VARCHAR(64) PRIMARY KEY,
    name VARCHAR(512) NOT NULL,
    description TEXT DEFAULT '',
    first_year INTEGER,
    last_year INTEGER,
    notes TEXT DEFAULT '',
    portal_name VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS magazines_name ON magazines (name);
CREATE INDEX IF NOT EXISTS magazines_first_year ON magazines (first_year);
CREATE INDEX IF NOT EXISTS magazines_last_year ON magazines (last_year);

CREATE TABLE IF NOT EXISTS magazine_issues (
    id_magazine VARCHAR(64) NOT NULL REFERENCES magazines (id_magazine) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    issue_number INTEGER NOT NULL,
    is_special_edition BOOLEAN NOT NULL DEFAULT FALSE,
    special_topic VARCHAR(512) DEFAULT NULL,
    PRIMARY KEY (id_magazine, year, issue_number)
);

CREATE INDEX IF NOT EXISTS magazine_issues_id_magazine_year ON magazine_issues (id_magazine, year);

-- Seed inicial
INSERT INTO magazines (id_magazine, name, description, first_year, last_year, notes, portal_name)
VALUES
    ('mag-001', 'Buildinformer', 'Semestral magazine on architectural and industrial glass.', 2020, 2027, 'Some issues have special editions by theme.', 'Buildinformer'),
    ('mag-002', 'Fenestrator', 'Semestral publication on fenestration.', 2019, 2027, '', 'Fenestrator'),
    ('mag-003', 'Glassinformer', 'Bimonthly magazine focused on industrial processes.', 2021, 2027, '', 'Glassinformer')
ON CONFLICT (id_magazine) DO NOTHING;

INSERT INTO magazine_issues (id_magazine, year, issue_number, is_special_edition, special_topic)
VALUES
    ('mag-001', 2025, 1, FALSE, NULL),
    ('mag-001', 2025, 2, TRUE, 'Innovation in architectural glass'),
    ('mag-001', 2025, 3, FALSE, NULL),
    ('mag-001', 2025, 4, FALSE, NULL),
    ('mag-001', 2026, 1, FALSE, NULL),
    ('mag-001', 2026, 2, TRUE, 'Sustainability in glass'),
    ('mag-001', 2026, 3, FALSE, NULL),
    ('mag-001', 2026, 4, FALSE, NULL),
    ('mag-001', 2027, 1, FALSE, NULL),
    ('mag-001', 2027, 2, FALSE, NULL),
    ('mag-002', 2025, 1, FALSE, NULL),
    ('mag-002', 2025, 2, FALSE, NULL),
    ('mag-002', 2026, 1, FALSE, NULL),
    ('mag-002', 2026, 2, FALSE, NULL),
    ('mag-002', 2027, 1, FALSE, NULL),
    ('mag-002', 2027, 2, FALSE, NULL),
    ('mag-003', 2025, 1, FALSE, NULL),
    ('mag-003', 2025, 2, FALSE, NULL),
    ('mag-003', 2026, 1, FALSE, NULL),
    ('mag-003', 2026, 2, FALSE, NULL),
    ('mag-003', 2027, 1, FALSE, NULL),
    ('mag-003', 2027, 2, FALSE, NULL)
ON CONFLICT (id_magazine, year, issue_number) DO NOTHING;
