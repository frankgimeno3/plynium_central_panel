-- Create portals table (run once if the table does not exist)

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
