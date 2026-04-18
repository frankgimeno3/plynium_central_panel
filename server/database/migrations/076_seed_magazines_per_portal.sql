-- 076_seed_magazines_per_portal.sql
-- Una revista por defecto en magazines_db para cada portal en portals_db, excepto plynium.
-- magazine_id estable por portal_id (idempotente con ON CONFLICT).

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
