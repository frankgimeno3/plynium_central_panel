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
