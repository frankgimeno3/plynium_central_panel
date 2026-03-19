-- 027_create_agents_db.sql
-- Tabla agents_db. Idempotente.

CREATE TABLE IF NOT EXISTS agents_db (
    id_agent VARCHAR(64) PRIMARY KEY,
    name VARCHAR(512) NOT NULL,
    email VARCHAR(512) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agents_db_name ON agents_db (name);

-- Seed inicial (los mismos que estaban en agentsContents.json)
INSERT INTO agents_db (id_agent, name, email)
VALUES
    ('agent-001', 'Frank Gimeno', 'frankgimeno3@gmail.com'),
    ('agent-002', 'Secondary Test Agent', 'sec.agent@plynium.com')
ON CONFLICT (id_agent) DO NOTHING;
