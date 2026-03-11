-- 020_users_cognito_linkedin.sql
-- Columnas cognito_sub y linkedin_profile en users. Idempotente.

ALTER TABLE users ADD COLUMN IF NOT EXISTS cognito_sub VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_profile VARCHAR(512);
