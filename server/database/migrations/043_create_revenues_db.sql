-- 043_create_revenues_db.sql
-- Manual forecasted revenues for the banks cash-flow page. Idempotent.

CREATE TABLE IF NOT EXISTS revenues_db (
    id VARCHAR(64) PRIMARY KEY,
    id_customer VARCHAR(64) NULL REFERENCES customers_db (id_customer) ON DELETE SET NULL,
    customer_name VARCHAR(512) DEFAULT '',
    label VARCHAR(512) NOT NULL DEFAULT '',
    reference VARCHAR(128) DEFAULT '',
    amount_eur NUMERIC(14, 2) NOT NULL DEFAULT 0,
    revenue_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS revenues_db_id_customer ON revenues_db (id_customer);
CREATE INDEX IF NOT EXISTS revenues_db_revenue_date ON revenues_db (revenue_date);

