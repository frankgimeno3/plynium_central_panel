-- 001_drop_user_portal_preferences.sql
-- Objetivo: Preferencias globales en users (misma preferencia para todos los portales).
-- - Elimina tabla user_portal_preferences (ya no hay preferencias por portal).
-- - Añade users.preferences JSONB si la tabla users existe.
-- Idempotente. DROP TABLE es destructivo para user_portal_preferences.

DROP TABLE IF EXISTS user_portal_preferences;

-- Preferencias en users (theme, locale, etc.) para todos los portales
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
END $$;
