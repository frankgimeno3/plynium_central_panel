-- 054_publications_db_index_summary_ready.sql
-- Issue-level readiness flags for advertiser index and article summary PDFs.
-- Set to true from the index/summary slot detail pages before publishing.

BEGIN;

ALTER TABLE public.publications_db
  ADD COLUMN IF NOT EXISTS is_index_ready BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_summary_ready BOOLEAN NOT NULL DEFAULT false;

COMMIT;
