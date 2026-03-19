-- 029_create_providers_db.sql
-- Tablas providers_db y provider_invoices_db. Idempotente.

CREATE TABLE IF NOT EXISTS providers_db (
    id_provider VARCHAR(64) PRIMARY KEY,
    name VARCHAR(512) NOT NULL,
    contact_email VARCHAR(512) DEFAULT '',
    contact_phone VARCHAR(128) DEFAULT '',
    address TEXT DEFAULT '',
    tax_id VARCHAR(64) DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS providers_db_name ON providers_db (name);

CREATE TABLE IF NOT EXISTS provider_invoices_db (
    id VARCHAR(64) PRIMARY KEY,
    id_provider VARCHAR(64) NOT NULL REFERENCES providers_db (id_provider) ON DELETE CASCADE,
    provider_name VARCHAR(512) NOT NULL,
    amount_eur NUMERIC(14, 2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS provider_invoices_db_id_provider ON provider_invoices_db (id_provider);
CREATE INDEX IF NOT EXISTS provider_invoices_db_payment_date ON provider_invoices_db (payment_date);

-- Seed inicial (los mismos que estaban en providers.json y provider_invoices.json)
INSERT INTO providers_db (id_provider, name, contact_email, contact_phone, address, tax_id, notes)
VALUES
    ('prov-001', 'Suministros Técnicos Glass', 'pedidos@suministrosglass.com', '+34 912 345 678', 'Calle Industria 12, 28001 Madrid, Spain', 'B12345678', 'Main supplier for glass materials.'),
    ('prov-002', 'Logística y Envíos S.L.', 'info@logisticaenvios.es', '+34 913 456 789', 'Polígono Norte, Nave 5, 28850 Torrejón de Ardoz, Spain', 'B87654321', 'Logistics and shipping partner.'),
    ('prov-003', 'Software & IT Services', 'comercial@softwareit.com', '+34 914 567 890', 'Calle Tecnología 3, 28002 Madrid, Spain', 'B11223344', 'IT and software licensing.')
ON CONFLICT (id_provider) DO NOTHING;

INSERT INTO provider_invoices_db (id, id_provider, provider_name, amount_eur, payment_date)
VALUES
    ('prov-inv-001', 'prov-001', 'Suministros Técnicos Glass', 1200, '2025-02-28'),
    ('prov-inv-002', 'prov-002', 'Logística y Envíos S.L.', 450, '2025-03-15'),
    ('prov-inv-003', 'prov-001', 'Suministros Técnicos Glass', 890, '2025-01-10'),
    ('prov-inv-004', 'prov-003', 'Software & IT Services', 320, '2025-03-01')
ON CONFLICT (id) DO NOTHING;

