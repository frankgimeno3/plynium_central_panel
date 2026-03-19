-- 032_create_projects_db.sql
-- Tabla projects_db. Idempotente.

CREATE TABLE IF NOT EXISTS projects_db (
    id_project VARCHAR(64) PRIMARY KEY,
    id_contract VARCHAR(64) NOT NULL,
    title VARCHAR(512) NOT NULL,
    status VARCHAR(64) NOT NULL,
    service VARCHAR(64) NOT NULL,
    publication_date DATE,
    publication_id VARCHAR(64),
    pm_events_array TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_db_id_contract ON projects_db (id_contract);
CREATE INDEX IF NOT EXISTS projects_db_status ON projects_db (status);
CREATE INDEX IF NOT EXISTS projects_db_service ON projects_db (service);
CREATE INDEX IF NOT EXISTS projects_db_publication_date ON projects_db (publication_date);

