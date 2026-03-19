-- 025_create_customers_db.sql
-- Tabla customers_db. Idempotente.

CREATE TABLE IF NOT EXISTS customers_db (
    id_customer VARCHAR(64) PRIMARY KEY,
    name VARCHAR(512) NOT NULL,
    cif VARCHAR(64) DEFAULT '',
    country VARCHAR(255) DEFAULT '',
    address TEXT DEFAULT '',
    phone VARCHAR(128) DEFAULT '',
    email VARCHAR(512) DEFAULT '',
    website VARCHAR(512) DEFAULT '',
    industry VARCHAR(255) DEFAULT '',
    segment VARCHAR(128) DEFAULT '',
    owner VARCHAR(255) DEFAULT '',
    source VARCHAR(128) DEFAULT '',
    status VARCHAR(64) DEFAULT 'active',
    revenue_eur NUMERIC(14, 2) DEFAULT 0,
    next_activity TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    contact JSONB DEFAULT '{}',
    contacts JSONB DEFAULT '[]',
    comments JSONB DEFAULT '[]',
    proposals TEXT[] DEFAULT '{}',
    contracts TEXT[] DEFAULT '{}',
    projects TEXT[] DEFAULT '{}',
    related_accounts TEXT[] DEFAULT '{}',
    portal_products JSONB DEFAULT '{}',
    company_categories_array TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customers_db_name ON customers_db (name);
CREATE INDEX IF NOT EXISTS customers_db_country ON customers_db (country);
CREATE INDEX IF NOT EXISTS customers_db_status ON customers_db (status);
CREATE INDEX IF NOT EXISTS customers_db_owner ON customers_db (owner);
