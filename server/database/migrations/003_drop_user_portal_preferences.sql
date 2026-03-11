-- 003_drop_user_portal_preferences.sql
-- Preferencias globales en users. Elimina user_portal_preferences.
-- Idempotente.

DROP TABLE IF EXISTS user_portal_preferences;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
END $$;
