-- 007_create_company_members.sql
-- Objetivo: Relación users <-> companies (trabajadores). company_id = companies.company_id, user_id = users.id_user.
-- Idempotente.

CREATE TABLE IF NOT EXISTS company_members (
    company_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    title TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (company_id, user_id)
);

COMMENT ON TABLE company_members IS 'Users as workers of companies. company_id = companies.company_id, user_id = users.id_user (logical FKs).';

CREATE INDEX IF NOT EXISTS company_members_user_id_idx ON company_members (user_id);
