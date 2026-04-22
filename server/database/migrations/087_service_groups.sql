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
