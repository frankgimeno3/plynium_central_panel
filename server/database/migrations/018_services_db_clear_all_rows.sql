-- 018_services_db_clear_all_rows.sql
-- Clears all rows from services_db (catalog will be rebuilt later).
-- Uses TRUNCATE to reset dependent FKs if any are added in the future.

BEGIN;

TRUNCATE TABLE public.services_db RESTART IDENTITY CASCADE;

COMMIT;

