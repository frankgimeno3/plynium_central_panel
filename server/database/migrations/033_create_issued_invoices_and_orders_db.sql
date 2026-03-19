-- 033_create_issued_invoices_and_orders_db.sql
-- Tablas issued_invoices_db y orders_db. Idempotente.

CREATE TABLE IF NOT EXISTS issued_invoices_db (
    invoice_id VARCHAR(64) PRIMARY KEY,
    id_contract VARCHAR(64),
    contract_code VARCHAR(64) NOT NULL,
    client_id VARCHAR(64) NOT NULL,
    client_name VARCHAR(512) NOT NULL,
    agent VARCHAR(255) DEFAULT '',
    amount_eur NUMERIC(14, 2) NOT NULL DEFAULT 0,
    issue_date DATE NOT NULL,
    invoice_state VARCHAR(64) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS issued_invoices_db_id_contract ON issued_invoices_db (id_contract);
CREATE INDEX IF NOT EXISTS issued_invoices_db_client_id ON issued_invoices_db (client_id);
CREATE INDEX IF NOT EXISTS issued_invoices_db_issue_date ON issued_invoices_db (issue_date);
CREATE INDEX IF NOT EXISTS issued_invoices_db_invoice_state ON issued_invoices_db (invoice_state);

CREATE TABLE IF NOT EXISTS orders_db (
    order_code VARCHAR(64) PRIMARY KEY,
    invoice_id VARCHAR(64) NOT NULL REFERENCES issued_invoices_db (invoice_id) ON DELETE CASCADE,
    id_contract VARCHAR(64),
    contract_code VARCHAR(64),
    client_id VARCHAR(64),
    client_name VARCHAR(512),
    agent VARCHAR(255),
    id_contact VARCHAR(64),
    collection_date DATE NOT NULL,
    payment_status VARCHAR(64) NOT NULL,
    amount_eur NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_db_invoice_id ON orders_db (invoice_id);
CREATE INDEX IF NOT EXISTS orders_db_id_contract ON orders_db (id_contract);
CREATE INDEX IF NOT EXISTS orders_db_client_id ON orders_db (client_id);
CREATE INDEX IF NOT EXISTS orders_db_collection_date ON orders_db (collection_date);
CREATE INDEX IF NOT EXISTS orders_db_payment_status ON orders_db (payment_status);

