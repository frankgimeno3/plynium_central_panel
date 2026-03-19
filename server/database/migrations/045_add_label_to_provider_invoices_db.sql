-- 045_add_label_to_provider_invoices_db.sql
-- Optional display label for cash-flow / banks UI. Idempotent.

ALTER TABLE provider_invoices_db
    ADD COLUMN IF NOT EXISTS label VARCHAR(512) NOT NULL DEFAULT '';
