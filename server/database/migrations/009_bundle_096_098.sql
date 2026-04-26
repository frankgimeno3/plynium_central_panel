-- 009_bundle_096_098.sql
-- Bundled from migrations 096 to 098 (original files preserved below).

-- ======================================================================
-- BEGIN 096_panel_ticket_company_list_as_employee.sql
-- ======================================================================

-- 096_panel_ticket_company_list_as_employee.sql
-- Directory company requests: whether the requester wants to appear as a visible employee.

BEGIN;

ALTER TABLE public.panel_ticket_company_data
  ADD COLUMN IF NOT EXISTS ticket_company_list_as_employee BOOLEAN NOT NULL DEFAULT false;

COMMIT;

-- ======================================================================
-- END 096_panel_ticket_company_list_as_employee.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 097_panel_ticket_company_data_updated_at.sql
-- ======================================================================

-- 097_panel_ticket_company_data_updated_at.sql
-- panel_ticket_company_data: column required by generic BEFORE UPDATE triggers using public.set_updated_at()
-- (Postgres error: record "new" has no field "updated_at")

ALTER TABLE public.panel_ticket_company_data
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.panel_ticket_company_data
SET updated_at = now()
WHERE updated_at IS NULL;

ALTER TABLE public.panel_ticket_company_data
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.panel_ticket_company_data
  ALTER COLUMN updated_at SET NOT NULL;

-- ======================================================================
-- END 097_panel_ticket_company_data_updated_at.sql
-- ======================================================================

-- ======================================================================
-- BEGIN 098_panel_ticket_product_data.sql
-- ======================================================================

-- 098_panel_ticket_product_data.sql
-- Product creation request payload (one row per product ticket).
-- Mirrors products_db fields, with `ticket_product_` prefix to store the requested data.

CREATE TABLE IF NOT EXISTS public.panel_ticket_product_data (
  ticket_product_data_id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(255) NOT NULL UNIQUE REFERENCES public.panel_tickets (panel_ticket_id) ON DELETE CASCADE,
  ticket_product_name VARCHAR(255) NOT NULL DEFAULT ''::character varying,
  ticket_product_description TEXT NULL DEFAULT ''::text,
  ticket_product_price NUMERIC NOT NULL DEFAULT 0,
  ticket_product_company_id VARCHAR(255) NOT NULL DEFAULT ''::character varying,
  ticket_product_main_image_src VARCHAR(2048) NULL DEFAULT ''::character varying,
  ticket_product_categories_array VARCHAR(255)[] NULL DEFAULT ARRAY[]::character varying[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_panel_ticket_product_data_ticket_id
  ON public.panel_ticket_product_data (ticket_id);

CREATE INDEX IF NOT EXISTS idx_panel_ticket_product_data_company_id
  ON public.panel_ticket_product_data (ticket_product_company_id);

-- ======================================================================
-- END 098_panel_ticket_product_data.sql
-- ======================================================================

