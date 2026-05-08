-- 017_service_groups_service_base_description.sql
-- Adds service_base_description to service_groups.

BEGIN;

ALTER TABLE public.service_groups
  ADD COLUMN IF NOT EXISTS service_base_description TEXT NULL;

ALTER TABLE public.service_groups
  ALTER COLUMN service_base_description SET DEFAULT ''::text;

UPDATE public.service_groups
SET service_base_description = ''::text
WHERE service_base_description IS NULL;

ALTER TABLE public.service_groups
  ALTER COLUMN service_base_description SET NOT NULL;

COMMENT ON COLUMN public.service_groups.service_base_description IS 'Base description for services in this group.';

COMMIT;

