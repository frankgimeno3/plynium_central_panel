-- 036_newsletter_campaign_layout_config.sql
-- Stores the default newsletter layout template for each campaign.

ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS newsletter_campaign_layout_config JSONB NOT NULL DEFAULT '{}'::jsonb;
