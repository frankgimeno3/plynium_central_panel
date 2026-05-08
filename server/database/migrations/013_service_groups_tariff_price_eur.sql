-- Default / standard tariff reference for the service group (EUR).
-- Distinct from services_db.service_unit_price (per concrete service row).

ALTER TABLE public.service_groups
    ADD COLUMN IF NOT EXISTS tariff_price_eur NUMERIC(14, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.service_groups.tariff_price_eur IS 'Standard tariff price in EUR for this service group.';
