-- 007_bundle_089_092.sql
-- Bundled from migrations 089 to 092 (original files preserved below).

-- ======================================================================
-- BEGIN 089_services_db_seed_by_portals_magazines.sql
-- ======================================================================

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

-- ======================================================================
-- END 089_services_db_seed_by_portals_magazines.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 090_services_db_service_portal.sql
-- ======================================================================

-- 090_services_db_service_portal.sql
-- Añade services_db.service_portal (portals_db.portal_id) para filtrar el catálogo por portal.
-- Puebla: revistas vía magazine_id en el hash del service_id; portal/dem vía sufijo -portal-<id> en service_id.
-- Re-ejecutable (IF NOT EXISTS / idempotente en constraint).

BEGIN;

ALTER TABLE public.services_db
  ADD COLUMN IF NOT EXISTS service_portal INTEGER NULL;

-- Revista: service_id = 'svc-mgz-' || md5(magazine_id || '|' || service_group_id) (migración 089)
UPDATE public.services_db s
SET service_portal = d.portal_id
FROM (
  SELECT DISTINCT ON (s2.service_id)
    s2.service_id,
    mp.portal_id
  FROM public.services_db s2
  INNER JOIN public.service_groups sg
    ON sg.service_group_id = s2.service_group_id
    AND lower(btrim(sg.service_group_channel::text)) = 'magazine'
  INNER JOIN public.magazines_db m
    ON s2.service_id = 'svc-mgz-' || md5(m.magazine_id || '|' || sg.service_group_id::text)
  INNER JOIN public.magazine_portals mp ON mp.magazine_id = m.magazine_id
  ORDER BY s2.service_id, mp.portal_id ASC
) d
WHERE s.service_id = d.service_id
  AND (s.service_portal IS DISTINCT FROM d.portal_id);

-- Portal / DEM / web banners: sufijo -portal-<número> en service_id
UPDATE public.services_db
SET service_portal = (substring(service_id from '-portal-([0-9]+)$'))::integer
WHERE service_portal IS NULL
  AND service_id ~ '-portal-[0-9]+$';

-- Residuo (no debería ocurrir con el seed canónico): portal Plynium
UPDATE public.services_db
SET service_portal = 0
WHERE service_portal IS NULL;

ALTER TABLE public.services_db
  ALTER COLUMN service_portal SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'services_db'
      AND c.conname = 'services_db_service_portal_fkey'
  ) THEN
    ALTER TABLE public.services_db
      ADD CONSTRAINT services_db_service_portal_fkey
      FOREIGN KEY (service_portal) REFERENCES public.portals_db (portal_id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS services_db_service_portal_idx ON public.services_db (service_portal);

COMMIT;

-- ======================================================================
-- END 090_services_db_service_portal.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 091_panel_tickets_services_array.sql
-- ======================================================================

-- 091_panel_tickets_services_array.sql
-- Adds panel_tickets.services_array to store selected services for advertisement tickets.
-- Idempotent.

BEGIN;

ALTER TABLE public.panel_tickets
  ADD COLUMN IF NOT EXISTS services_array TEXT[] NOT NULL DEFAULT '{}'::text[];

COMMIT;

-- ======================================================================
-- END 091_panel_tickets_services_array.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 092_panel_tickets_merge_type_category.sql
-- ======================================================================

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'panel_tickets'
      AND column_name = 'panel_ticket_category'
  ) THEN

    UPDATE public.panel_tickets
    SET panel_ticket_type = CASE
      WHEN lower(btrim(panel_ticket_type::text)) = 'notification' THEN
        COALESCE(
          NULLIF(btrim(panel_ticket_category::text), ''),
          'account_management'
        )
      ELSE btrim(panel_ticket_type::text)
    END;

  END IF;
END $$;

DROP INDEX IF EXISTS public.panel_tickets_panel_ticket_category_idx;

ALTER TABLE public.panel_tickets
  DROP COLUMN IF EXISTS panel_ticket_category;

COMMIT;

-- ======================================================================
-- END 092_panel_tickets_merge_type_category.sql
-- ======================================================================

