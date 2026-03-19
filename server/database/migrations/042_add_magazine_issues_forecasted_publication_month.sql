-- Add forecasted_publication_month (1-12) to magazine_issues. Idempotent.
-- Used for ordering and displaying forecasted issues; must be unique per magazine/year.

ALTER TABLE magazine_issues
  ADD COLUMN IF NOT EXISTS forecasted_publication_month INTEGER DEFAULT NULL;

COMMENT ON COLUMN magazine_issues.forecasted_publication_month IS 'Forecasted publication month (1-12). Must be unique per id_magazine/year.';

-- Optional: constraint only if we want DB-level validation (1-12)
-- ALTER TABLE magazine_issues DROP CONSTRAINT IF EXISTS magazine_issues_forecasted_month_range;
-- ALTER TABLE magazine_issues ADD CONSTRAINT magazine_issues_forecasted_month_range CHECK (forecasted_publication_month IS NULL OR (forecasted_publication_month >= 1 AND forecasted_publication_month <= 12));
