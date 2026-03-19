-- 030_create_proposals_db.sql
-- Tabla proposals_db. Idempotente.

CREATE TABLE IF NOT EXISTS proposals_db (
    id_proposal VARCHAR(64) PRIMARY KEY,
    id_customer VARCHAR(64) NOT NULL,
    id_contact VARCHAR(64) DEFAULT '',
    additional_contact_ids TEXT[] DEFAULT '{}',
    agent VARCHAR(255) DEFAULT '',
    status VARCHAR(64) NOT NULL,
    title VARCHAR(512) NOT NULL,
    amount_eur NUMERIC(14, 2) DEFAULT 0,
    proposal_date DATE,
    date_created DATE,
    expiration_date DATE,
    general_discount_pct NUMERIC(6, 2) DEFAULT 0,
    service_lines JSONB DEFAULT '[]',
    payments JSONB DEFAULT '[]',
    is_exchange BOOLEAN DEFAULT FALSE,
    exchange_has_final_price BOOLEAN DEFAULT FALSE,
    exchange_final_price NUMERIC(14, 2) DEFAULT 0,
    exchange_has_bank_transfers BOOLEAN DEFAULT FALSE,
    exchange_plynium_transfer_date DATE,
    exchange_counterpart_date DATE,
    exchange_transferred_amount NUMERIC(14, 2) DEFAULT 0,
    exchange_to_be_received_html TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS proposals_db_id_customer ON proposals_db (id_customer);
CREATE INDEX IF NOT EXISTS proposals_db_status ON proposals_db (status);
CREATE INDEX IF NOT EXISTS proposals_db_agent ON proposals_db (agent);
CREATE INDEX IF NOT EXISTS proposals_db_date_created ON proposals_db (date_created);

