-- 001_create_portals_table.sql
-- Base: tabla portals (requerida por get_default_portal_id y tablas *_portals).
-- Idempotente.

CREATE TABLE IF NOT EXISTS portals (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL DEFAULT '',
    default_locale VARCHAR(50) NOT NULL DEFAULT 'es',
    theme VARCHAR(255) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS portals_key ON portals (key);
CREATE INDEX IF NOT EXISTS portals_domain ON portals (domain);
