-- 008_bundle_093_095.sql
-- Bundled from migrations 093 to 095 (original files preserved below).

-- ======================================================================
-- BEGIN 093_panel_tickets_contact_fields.sql
-- ======================================================================

-- 093_panel_tickets_contact_fields.sql
-- Campos estructurados para tickets (p. ej. mediakit / contacto público) sin mezclar todo en panel_ticket_full_description.
-- Idempotente: ADD COLUMN IF NOT EXISTS.

BEGIN;

ALTER TABLE public.panel_tickets
  ADD COLUMN IF NOT EXISTS panel_ticket_contact_name TEXT NOT NULL DEFAULT ''::text;

ALTER TABLE public.panel_tickets
  ADD COLUMN IF NOT EXISTS panel_ticket_contact_email TEXT NOT NULL DEFAULT ''::text;

ALTER TABLE public.panel_tickets
  ADD COLUMN IF NOT EXISTS panel_ticket_contact_phone TEXT NOT NULL DEFAULT ''::text;

ALTER TABLE public.panel_tickets
  ADD COLUMN IF NOT EXISTS panel_ticket_interest TEXT NOT NULL DEFAULT ''::text;

COMMIT;

-- ======================================================================
-- END 093_panel_tickets_contact_fields.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 094_panel_ticket_advertisement.sql
-- ======================================================================

-- 094_panel_ticket_advertisement.sql
-- Advertisement / mediakit form payload (one row per advertisement ticket).
-- Migrates services_array off panel_tickets into this table, then drops panel_tickets.services_array.

CREATE TABLE IF NOT EXISTS public.panel_ticket_advertisement (
  panel_ticket_advertisement_id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(255) NOT NULL UNIQUE REFERENCES public.panel_tickets (panel_ticket_id) ON DELETE CASCADE,
  contact_full_name TEXT NOT NULL DEFAULT ''::text,
  contact_email TEXT NOT NULL DEFAULT ''::text,
  phone_country_prefix VARCHAR(32) NOT NULL DEFAULT ''::character varying,
  phone_number VARCHAR(64) NOT NULL DEFAULT ''::character varying,
  interest TEXT NOT NULL DEFAULT ''::text,
  message TEXT NOT NULL DEFAULT ''::text,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  services_array TEXT[] NOT NULL DEFAULT '{}'::text[]
);

CREATE INDEX IF NOT EXISTS idx_panel_ticket_advertisement_ticket_id
  ON public.panel_ticket_advertisement (ticket_id);

INSERT INTO public.panel_ticket_advertisement (
  ticket_id,
  contact_full_name,
  contact_email,
  phone_country_prefix,
  phone_number,
  interest,
  message,
  terms_accepted,
  services_array
)
SELECT
  t.panel_ticket_id,
  COALESCE(NULLIF(btrim(t.panel_ticket_contact_name), ''), ''),
  COALESCE(NULLIF(btrim(t.panel_ticket_contact_email), ''), ''),
  '',
  COALESCE(NULLIF(btrim(t.panel_ticket_contact_phone), ''), ''),
  COALESCE(NULLIF(btrim(t.panel_ticket_interest), ''), ''),
  COALESCE(t.panel_ticket_full_description, ''),
  true,
  COALESCE(t.services_array, '{}'::text[])
FROM public.panel_tickets t
WHERE lower(btrim(t.panel_ticket_type::text)) = 'advertisement'
  AND NOT EXISTS (
    SELECT 1 FROM public.panel_ticket_advertisement a WHERE a.ticket_id = t.panel_ticket_id
  );

ALTER TABLE public.panel_tickets DROP COLUMN IF EXISTS services_array;

-- ======================================================================
-- END 094_panel_ticket_advertisement.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 095_panel_ticket_advertisement_company_country.sql
-- ======================================================================

-- 095_panel_ticket_advertisement_company_country.sql
-- Company / organization country for mediakit advertise tickets.

ALTER TABLE public.panel_ticket_advertisement
  ADD COLUMN IF NOT EXISTS company_country VARCHAR(255) NOT NULL DEFAULT ''::character varying;

-- ======================================================================
-- END 095_panel_ticket_advertisement_company_country.sql
-- ======================================================================

