-- 089_services_db_seed_by_portals_magazines.sql
-- Catálogo inicial en services_db:
--   · service_groups canal portal o dem: un servicio por portal (salvo portal_web_banner: 3 por portal).
--   · service_groups canal magazine: un servicio por fila en magazines_db.
-- Re-ejecutable: solo inserta service_id que aún no existan.

BEGIN;

-- portal + dem (excluye portal_web_banner): 1 servicio × grupo × portal
INSERT INTO public.services_db (
  service_id,
  service_full_name,
  service_group_id,
  service_format,
  service_description,
  service_unit,
  service_unit_price,
  service_unit_specifications
)
SELECT
  'svc-' || sg.service_group_name || '-portal-' || p.portal_id::text,
  left(
    p.portal_name || ' — ' || initcap(replace(sg.service_group_name, '_', ' ')) || ' — portal ' || p.portal_name_key || ' (' || sg.service_group_channel || ')',
    512
  ),
  sg.service_group_id,
  ''::character varying,
  ''::text,
  ''::character varying,
  0::numeric(14, 2),
  ''::text
FROM public.service_groups sg
CROSS JOIN public.portals_db p
WHERE sg.service_group_channel IN ('portal', 'dem')
  AND sg.service_group_name <> 'portal_web_banner'
  AND NOT EXISTS (
    SELECT 1
    FROM public.services_db s
    WHERE s.service_id = 'svc-' || sg.service_group_name || '-portal-' || p.portal_id::text
  );

-- portal_web_banner: MidBanner, RightBanner, TopBanner × portal
INSERT INTO public.services_db (
  service_id,
  service_full_name,
  service_group_id,
  service_format,
  service_description,
  service_unit,
  service_unit_price,
  service_unit_specifications
)
SELECT
  'svc-portal_web_banner-' || b.slot_key || '-portal-' || p.portal_id::text,
  left(
    p.portal_name || ' — Web banner ' || b.slot_label || ' — ' || p.portal_name_key || ' (portal)',
    512
  ),
  sg.service_group_id,
  ''::character varying,
  ''::text,
  ''::character varying,
  0::numeric(14, 2),
  ''::text
FROM public.service_groups sg
CROSS JOIN public.portals_db p
CROSS JOIN (
  VALUES
    ('mid', 'MidBanner'),
    ('right', 'RightBanner'),
    ('top', 'TopBanner')
) AS b(slot_key, slot_label)
WHERE sg.service_group_name = 'portal_web_banner'
  AND sg.service_group_channel = 'portal'
  AND NOT EXISTS (
    SELECT 1
    FROM public.services_db s
    WHERE s.service_id = 'svc-portal_web_banner-' || b.slot_key || '-portal-' || p.portal_id::text
  );

-- magazine: 1 servicio × grupo × revista (service_id estable por hash; nombre descriptivo con revista + grupo)
INSERT INTO public.services_db (
  service_id,
  service_full_name,
  service_group_id,
  service_format,
  service_description,
  service_unit,
  service_unit_price,
  service_unit_specifications
)
SELECT
  'svc-mgz-' || md5(m.magazine_id || '|' || sg.service_group_id::text),
  left(
    m.magazine_name || ' — ' || initcap(replace(sg.service_group_name, '_', ' ')) || ' — magazine ' || m.magazine_id,
    512
  ),
  sg.service_group_id,
  ''::character varying,
  ''::text,
  ''::character varying,
  0::numeric(14, 2),
  ''::text
FROM public.service_groups sg
CROSS JOIN public.magazines_db m
WHERE sg.service_group_channel = 'magazine'
  AND NOT EXISTS (
    SELECT 1
    FROM public.services_db s
    WHERE s.service_id = 'svc-mgz-' || md5(m.magazine_id || '|' || sg.service_group_id::text)
  );

COMMIT;
