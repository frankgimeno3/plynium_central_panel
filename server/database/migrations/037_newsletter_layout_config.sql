-- 037_newsletter_layout_config.sql
-- Optional per-newsletter layout override (edition differs from campaign template).

ALTER TABLE public.newsletters_db
  ADD COLUMN IF NOT EXISTS newsletter_layout_config JSONB NULL;
