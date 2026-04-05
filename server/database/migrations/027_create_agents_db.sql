-- 027_create_agents_db.sql
-- Tabla agents_db. Idempotente.

CREATE TABLE IF NOT EXISTS agents_db (
    agent_id VARCHAR(64) PRIMARY KEY,
    agent_name VARCHAR(512) NOT NULL,
    agent_email VARCHAR(512) DEFAULT '',
    agent_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    agent_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agents_db_agent_name ON agents_db (agent_name);

-- Seed inicial (los mismos que estaban en agentsContents.json)
INSERT INTO agents_db (agent_id, agent_name, agent_email)
VALUES
    ('agent-001', 'Frank Gimeno', 'frankgimeno3@gmail.com'),
    ('agent-002', 'Secondary Test Agent', 'sec.agent@plynium.com')
ON CONFLICT (agent_id) DO NOTHING;
