-- 077_users_db_drop_company_experience_columns.sql
-- Drops legacy JSONB columns from users_db.

ALTER TABLE public.users_db DROP COLUMN IF EXISTS user_current_company;
ALTER TABLE public.users_db DROP COLUMN IF EXISTS user_experience_array;
