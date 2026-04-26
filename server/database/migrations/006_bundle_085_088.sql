-- 006_bundle_085_088.sql
-- Bundled from migrations 085 to 088 (original files preserved below).

-- ======================================================================
-- BEGIN 085_users_db_user_role.sql
-- ======================================================================

-- 085_users_db_user_role.sql
-- Central panel admin user profile expects users_db.user_role (see userRepository.updateUserProfileFieldsInRds).
-- Without this column the server skips updating the role and relies on defaults when mapping rows.

BEGIN;

ALTER TABLE public.users_db
  ADD COLUMN IF NOT EXISTS user_role VARCHAR(512) NOT NULL DEFAULT 'only articles';

COMMENT ON COLUMN public.users_db.user_role IS
  'Free-text panel role label (see migration 086 to widen past VARCHAR(64) if needed).';

COMMIT;

-- ======================================================================
-- END 085_users_db_user_role.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 086_users_db_user_role_widen.sql
-- ======================================================================

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

-- ======================================================================
-- END 086_users_db_user_role_widen.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 087_service_groups.sql
-- ======================================================================

-- 087_service_groups.sql
-- Tabla de agrupación de servicios (identificador, nombre y canal) + filas canónicas iniciales.

BEGIN;

CREATE TABLE IF NOT EXISTS public.service_groups (
  service_group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_group_name VARCHAR(255) NOT NULL,
  service_group_channel VARCHAR(255) NOT NULL DEFAULT ''::character varying
);

INSERT INTO public.service_groups (service_group_name, service_group_channel)
SELECT v.service_group_name, v.service_group_channel
FROM (
  VALUES
    ('newsletter_banner'::varchar(255), 'dem'::varchar(255)),
    ('newsletter_sponsored_space', 'dem'),
    ('portal_highlited_company', 'portal'),
    ('portal_premium_company', 'portal'),
    ('portal_web_banner', 'portal'),
    ('magazine_single_advert', 'magazine'),
    ('magazine_double_advert', 'magazine'),
    ('magazine_sponsored_article', 'magazine'),
    ('magazine_cover_page', 'magazine'),
    ('magazine_end_page', 'magazine'),
    ('magazine_premium_page', 'magazine')
) AS v(service_group_name, service_group_channel)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.service_groups sg
  WHERE sg.service_group_name = v.service_group_name
);

COMMIT;

-- ======================================================================
-- END 087_service_groups.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 088_services_db_service_group_id.sql
-- ======================================================================

-- 088_services_db_service_group_id.sql
-- Sustituye service_channel + service_product por service_group_id (FK a service_groups).
-- Vacía services_db. Requiere que exista public.service_groups (p. ej. migración 087).

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'services_db'
      AND column_name = 'service_channel'
  ) THEN
    TRUNCATE TABLE public.services_db;

    DROP INDEX IF EXISTS public.services_db_service_channel_idx;
    DROP INDEX IF EXISTS public.services_db_service_product_idx;

    ALTER TABLE public.services_db DROP COLUMN IF EXISTS service_channel;
    ALTER TABLE public.services_db DROP COLUMN IF EXISTS service_product;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'services_db'
        AND column_name = 'service_group_id'
    ) THEN
      ALTER TABLE public.services_db
        ADD COLUMN service_group_id UUID NOT NULL REFERENCES public.service_groups(service_group_id) ON DELETE RESTRICT;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS services_db_service_group_id_idx ON public.services_db (service_group_id);

COMMIT;

-- ======================================================================
-- END 088_services_db_service_group_id.sql
-- ======================================================================

