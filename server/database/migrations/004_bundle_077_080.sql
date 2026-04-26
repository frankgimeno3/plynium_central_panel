-- 004_bundle_077_080.sql
-- Bundled from migrations 077 to 080 (original files preserved below).

-- ======================================================================
-- BEGIN 077_magazine_portals.sql
-- ======================================================================

-- 077_magazine_portals.sql
-- Tabla puente magazine_portals (magazine_portal_id, magazine_id, portal_id).
-- Puebla un vínculo por cada portal en portals_db excepto plynium:
--   - Donde existan las revistas mag-001…mag-004 de la captura, se enlazan por portal temático.
--   - El resto usa la revista por defecto magazine-portal-{portal_id} (ver 076).
-- Requisito: ejecutar después de 065; 076 recomendado para asegurar filas magazine-portal-*.

CREATE TABLE IF NOT EXISTS public.magazine_portals (
  magazine_portal_id UUID NOT NULL DEFAULT gen_random_uuid(),
  magazine_id VARCHAR(255) NOT NULL,
  portal_id INTEGER NOT NULL,
  CONSTRAINT magazine_portals_pkey PRIMARY KEY (magazine_portal_id),
  CONSTRAINT magazine_portals_magazine_id_fkey
    FOREIGN KEY (magazine_id) REFERENCES public.magazines_db (magazine_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT magazine_portals_portal_id_fkey
    FOREIGN KEY (portal_id) REFERENCES public.portals_db (portal_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT magazine_portals_portal_magazine_uidx UNIQUE (portal_id, magazine_id)
);

CREATE INDEX IF NOT EXISTS magazine_portals_portal_id_idx ON public.magazine_portals (portal_id);
CREATE INDEX IF NOT EXISTS magazine_portals_magazine_id_idx ON public.magazine_portals (magazine_id);

-- Asegurar revistas por defecto por portal (idempotente; alineado con 076).
INSERT INTO public.magazines_db (
  magazine_id,
  magazine_name,
  magazine_description,
  magazine_starting_year,
  magazine_periodicity,
  magazine_subscriber_number
)
SELECT
  'magazine-portal-' || p.portal_id::text,
  left(btrim(p.portal_name::text) || ' Magazine', 255),
  left(
    'Primary publication magazine for portal ' || btrim(p.portal_name_key::text) || '.',
    10000
  ),
  extract(year from timezone('UTC', now()))::integer,
  'monthly',
  NULL
FROM public.portals_db p
WHERE lower(btrim(p.portal_name_key::text)) <> 'plynium'
ON CONFLICT (magazine_id) DO UPDATE SET
  magazine_name = EXCLUDED.magazine_name,
  magazine_description = EXCLUDED.magazine_description,
  magazine_starting_year = EXCLUDED.magazine_starting_year,
  magazine_periodicity = EXCLUDED.magazine_periodicity,
  magazine_subscriber_number = EXCLUDED.magazine_subscriber_number;

-- Un enlace por portal (excepto plynium): revista preferente si existe en magazines_db, si no la por defecto.
INSERT INTO public.magazine_portals (magazine_portal_id, magazine_id, portal_id)
SELECT
  gen_random_uuid(),
  mm.magazine_id,
  p.portal_id
FROM public.portals_db p
INNER JOIN public.magazines_db mm ON mm.magazine_id = COALESCE(
  (
    SELECT m.magazine_id
    FROM public.magazines_db m
    WHERE m.magazine_id = (
      CASE p.portal_id
        WHEN 1 THEN 'mag-003'
        WHEN 2 THEN 'mag-002'
        WHEN 6 THEN 'mag-004'
        WHEN 25 THEN 'mag-001'
        ELSE NULL::varchar
      END
    )
    LIMIT 1
  ),
  'magazine-portal-' || p.portal_id::text
)
WHERE lower(btrim(p.portal_name_key::text)) <> 'plynium'
ON CONFLICT (portal_id, magazine_id) DO NOTHING;

-- ======================================================================
-- END 077_magazine_portals.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 078_newsletter_user_lists_user_list_portal.sql
-- ======================================================================

-- 078_newsletter_user_lists_user_list_portal.sql
-- Añade user_list_portal (FK a portals_db), rellena por heurística según newsletter_user_list_name,
-- y rellena list_user_ids_array en todas las filas con dos user_id de users_db.
--
-- UUIDs concretos: si los dos usuarios de tu captura no son los dos primeros por email,
-- sustituye el bloque final comentado y comenta el UPDATE dinámico.

ALTER TABLE public.newsletter_user_lists
  ADD COLUMN IF NOT EXISTS user_list_portal INTEGER NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'newsletter_user_lists'
      AND c.conname = 'newsletter_user_lists_user_list_portal_fkey'
  ) THEN
    ALTER TABLE public.newsletter_user_lists
      ADD CONSTRAINT newsletter_user_lists_user_list_portal_fkey
        FOREIGN KEY (user_list_portal)
        REFERENCES public.portals_db (portal_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS newsletter_user_lists_user_list_portal_idx
  ON public.newsletter_user_lists (user_list_portal);

-- 1) Prefijo antes de " - ", quitando sufijo "Monthly" / "Monthly Newsletter" (insensible a mayúsculas).
UPDATE public.newsletter_user_lists nul
SET user_list_portal = p.portal_id
FROM public.portals_db p
WHERE nul.user_list_portal IS NULL
  AND lower(regexp_replace(
        trim(split_part(coalesce(nul.newsletter_user_list_name, ''), ' - ', 1)),
        '\s+monthly(\s+newsletter)?\s*$',
        '',
        'i'
      )) IN (lower(btrim(p.portal_name_key::text)), lower(btrim(p.portal_name::text)));

-- 2) Nombres sin portal en el prefijo (capturas habituales).
UPDATE public.newsletter_user_lists
SET user_list_portal = 1
WHERE user_list_portal IS NULL
  AND (
    lower(coalesce(newsletter_user_list_name, '')) LIKE '%skylight%'
    OR lower(coalesce(newsletter_user_list_name, '')) LIKE '%roof light%'
    OR lower(coalesce(newsletter_user_list_name, '')) LIKE '%industrial glass%'
  );

UPDATE public.newsletter_user_lists
SET user_list_portal = 3
WHERE user_list_portal IS NULL
  AND (
    lower(coalesce(newsletter_user_list_name, '')) LIKE '%facade%'
    OR lower(coalesce(newsletter_user_list_name, '')) LIKE '%curtain wall%'
  );

-- 3) Todas las filas: dos usuarios = los dos primeros de users_db por email (ajusta con UUIDs fijos si hace falta).
UPDATE public.newsletter_user_lists
SET list_user_ids_array = COALESCE(
  (
    SELECT ARRAY(
      SELECT u.user_id
      FROM public.users_db u
      ORDER BY lower(btrim(u.user_email::text)) ASC NULLS LAST, u.user_id ASC
      LIMIT 2
    )
  ),
  '{}'::uuid[]
);

-- Alternativa con dos UUID fijos de tu users_db (descomenta y comenta el UPDATE de arriba):
-- UPDATE public.newsletter_user_lists
-- SET list_user_ids_array = ARRAY[
--   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
--   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
-- ];

-- ======================================================================
-- END 078_newsletter_user_lists_user_list_portal.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 079_panel_tickets_updated_at.sql
-- ======================================================================

  -- panel_tickets: column required by generic BEFORE UPDATE triggers using public.set_updated_at()
  -- (Postgres error: record "new" has no field "updated_at")
  ALTER TABLE public.panel_tickets
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

  UPDATE public.panel_tickets
  SET updated_at = panel_ticket_created_at
  WHERE updated_at IS NULL;

  ALTER TABLE public.panel_tickets
    ALTER COLUMN updated_at SET DEFAULT now();

  ALTER TABLE public.panel_tickets
    ALTER COLUMN updated_at SET NOT NULL;

-- ======================================================================
-- END 079_panel_tickets_updated_at.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 080_user_list_subscriptions.sql
-- ======================================================================

-- 080_user_list_subscriptions.sql
-- Normalizes newsletter list membership: one row per (user_id, newsletter_user_list_id).
-- Migrates data from newsletter_user_lists.list_user_ids_array then drops that column.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_list_subscriptions (
  user_list_subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users_db (user_id) ON DELETE CASCADE,
  newsletter_user_list_id UUID NOT NULL REFERENCES public.newsletter_user_lists (newsletter_user_list_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_list_subscriptions_user_list_unique UNIQUE (user_id, newsletter_user_list_id)
);

CREATE INDEX IF NOT EXISTS user_list_subscriptions_user_id_idx
  ON public.user_list_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS user_list_subscriptions_newsletter_user_list_id_idx
  ON public.user_list_subscriptions (newsletter_user_list_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'newsletter_user_lists'
      AND column_name = 'list_user_ids_array'
  ) THEN
    INSERT INTO public.user_list_subscriptions (user_id, newsletter_user_list_id)
    SELECT DISTINCT u.user_id, nul.newsletter_user_list_id
    FROM public.newsletter_user_lists nul
    CROSS JOIN LATERAL unnest(COALESCE(nul.list_user_ids_array, '{}'::uuid[])) AS x(uid)
    INNER JOIN public.users_db u ON u.user_id = x.uid
    WHERE cardinality(COALESCE(nul.list_user_ids_array, '{}'::uuid[])) > 0
    ON CONFLICT (user_id, newsletter_user_list_id) DO NOTHING;

    ALTER TABLE public.newsletter_user_lists
      DROP COLUMN list_user_ids_array;
  END IF;
END $$;

COMMIT;

-- ======================================================================
-- END 080_user_list_subscriptions.sql
-- ======================================================================

