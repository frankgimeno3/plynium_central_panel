-- 085_users_db_user_role.sql
-- Central panel admin user profile expects users_db.user_role (see userRepository.updateUserProfileFieldsInRds).
-- Without this column the server skips updating the role and relies on defaults when mapping rows.

BEGIN;

ALTER TABLE public.users_db
  ADD COLUMN IF NOT EXISTS user_role VARCHAR(512) NOT NULL DEFAULT 'only articles';

COMMENT ON COLUMN public.users_db.user_role IS
  'Free-text panel role label (see migration 086 to widen past VARCHAR(64) if needed).';

COMMIT;
