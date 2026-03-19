-- 024_create_company_categories.sql
-- Tabla company_categories. Idempotente.

CREATE TABLE IF NOT EXISTS company_categories (
    id_category VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    portals_array TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS company_categories_name_lower ON company_categories (LOWER(name));
CREATE INDEX IF NOT EXISTS company_categories_name ON company_categories (name);
