-- 023_add_events_id_customer.sql
-- Vincula evento a una cuenta (customer). Idempotente.

ALTER TABLE events ADD COLUMN IF NOT EXISTS id_customer VARCHAR(255) DEFAULT NULL;
