-- One-time backfill: copy each service group's standard tariff into every
-- services_db row for that group (services_db.service_unit_price).
-- Run after 013_service_groups_tariff_price_eur.sql so tariff_price_eur exists.
-- This is not a trigger; it does not keep rows in sync when groups change later.

UPDATE public.services_db AS s
SET service_unit_price = sg.tariff_price_eur
FROM public.service_groups AS sg
WHERE s.service_group_id = sg.service_group_id;
