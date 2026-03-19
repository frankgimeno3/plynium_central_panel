-- 044_create_payments_db.sql
-- Manual forecasted payments for the banks cash-flow page. Idempotent.

CREATE TABLE IF NOT EXISTS payments_db (
    id VARCHAR(64) PRIMARY KEY,
    id_provider VARCHAR(64) NULL REFERENCES providers_db (id_provider) ON DELETE SET NULL,
    provider_name VARCHAR(512) DEFAULT '',
    label VARCHAR(512) NOT NULL DEFAULT '',
    reference VARCHAR(128) DEFAULT '',
    amount_eur NUMERIC(14, 2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_db_id_provider ON payments_db (id_provider);
CREATE INDEX IF NOT EXISTS payments_db_payment_date ON payments_db (payment_date);

