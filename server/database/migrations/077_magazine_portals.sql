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
