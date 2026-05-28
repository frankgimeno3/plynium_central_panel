-- 053_publication_articles_article_box.sql
-- Adds optional "company box" fields to publication articles.

BEGIN;

ALTER TABLE public.publication_articles
  ADD COLUMN IF NOT EXISTS has_article_box BOOLEAN,
  ADD COLUMN IF NOT EXISTS box_company_name TEXT,
  ADD COLUMN IF NOT EXISTS box_company_direction TEXT,
  ADD COLUMN IF NOT EXISTS box_company_city TEXT,
  ADD COLUMN IF NOT EXISTS box_company_email TEXT,
  ADD COLUMN IF NOT EXISTS box_company_phone TEXT,
  ADD COLUMN IF NOT EXISTS box_company_web TEXT;

COMMIT;

