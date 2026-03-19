-- 026_create_contacts_db.sql
-- Tabla contacts_db. Idempotente.

CREATE TABLE IF NOT EXISTS contacts_db (
    id_contact VARCHAR(64) PRIMARY KEY,
    name VARCHAR(512) NOT NULL,
    role VARCHAR(255) DEFAULT '',
    email VARCHAR(512) DEFAULT '',
    phone VARCHAR(128) DEFAULT '',
    id_customer VARCHAR(64) DEFAULT '',
    company_name VARCHAR(512) DEFAULT '',
    id_user VARCHAR(128) DEFAULT '',
    linkedin_profile VARCHAR(512) DEFAULT '',
    based_in_country VARCHAR(255) DEFAULT '',
    comments JSONB DEFAULT '[]',
    user_list_array TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contacts_db_name ON contacts_db (name);
CREATE INDEX IF NOT EXISTS contacts_db_id_customer ON contacts_db (id_customer);
CREATE INDEX IF NOT EXISTS contacts_db_email ON contacts_db (email);
CREATE INDEX IF NOT EXISTS contacts_db_company_name ON contacts_db (company_name);
