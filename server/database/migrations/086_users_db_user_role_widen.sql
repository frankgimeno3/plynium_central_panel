-- 086_users_db_user_role_widen.sql
-- user_role is free text (admin panel); widen beyond 085 VARCHAR(64) cap.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users_db'
      AND column_name = 'user_role'
  ) THEN
    EXECUTE 'ALTER TABLE public.users_db ALTER COLUMN user_role TYPE VARCHAR(512)';
    EXECUTE 'COMMENT ON COLUMN public.users_db.user_role IS ' ||
      quote_literal('Free-text label for the user role in the central panel (max 512 chars in app).');
  END IF;
END $$;

COMMIT;
