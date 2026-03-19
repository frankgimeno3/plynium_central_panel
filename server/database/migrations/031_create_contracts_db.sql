-- 031_create_contracts_db.sql
-- Tabla contracts_db. Idempotente.

CREATE TABLE IF NOT EXISTS contracts_db (
    id_contract VARCHAR(64) PRIMARY KEY,
    id_proposal VARCHAR(64) NOT NULL,
    id_customer VARCHAR(64) NOT NULL,
    agent VARCHAR(255) DEFAULT '',
    process_state VARCHAR(64) NOT NULL,
    payment_state VARCHAR(64) NOT NULL,
    title VARCHAR(512) NOT NULL,
    amount_eur NUMERIC(14, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contracts_db_id_customer ON contracts_db (id_customer);
CREATE INDEX IF NOT EXISTS contracts_db_id_proposal ON contracts_db (id_proposal);
CREATE INDEX IF NOT EXISTS contracts_db_process_state ON contracts_db (process_state);
CREATE INDEX IF NOT EXISTS contracts_db_payment_state ON contracts_db (payment_state);
CREATE INDEX IF NOT EXISTS contracts_db_agent ON contracts_db (agent);

