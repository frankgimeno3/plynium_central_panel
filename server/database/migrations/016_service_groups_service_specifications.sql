-- 016_service_groups_service_specifications.sql
-- Adds service_specifications to service_groups.
-- This field is edited at the service group level and inherited by services in the UI.

BEGIN;

ALTER TABLE public.service_groups
  ADD COLUMN IF NOT EXISTS service_specifications TEXT NULL;

ALTER TABLE public.service_groups
  ALTER COLUMN service_specifications SET DEFAULT ''::text;

UPDATE public.service_groups
SET service_specifications = ''::text
WHERE service_specifications IS NULL;

ALTER TABLE public.service_groups
  ALTER COLUMN service_specifications SET NOT NULL;

COMMENT ON COLUMN public.service_groups.service_specifications IS 'Shared specifications for all services in this group.';

COMMIT;

