-- 074_seed_newsletter_user_lists_from_campaigns.sql
-- 1) Rebuild newsletter_user_lists: one list per newsletter_campaigns row
-- 2) Add newsletter_campaigns.newsletter_user_lists_id_array with corresponding ids

BEGIN;

-- Ensure campaign column exists
ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS newsletter_user_lists_id_array UUID[] NOT NULL DEFAULT '{}'::uuid[];

-- Remove existing lists (requested) and clear references where applicable
TRUNCATE TABLE public.newsletter_user_lists;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users_db'
      AND column_name = 'newsletter_user_lists_id_array'
  ) THEN
    UPDATE public.users_db
    SET newsletter_user_lists_id_array = '{}'::uuid[]
    WHERE newsletter_user_lists_id_array IS NOT NULL
      AND cardinality(newsletter_user_lists_id_array) > 0;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'newsletters_db'
      AND column_name = 'newsletter_user_list_id_array'
  ) THEN
    UPDATE public.newsletters_db
    SET newsletter_user_list_id_array = NULL
    WHERE newsletter_user_list_id_array IS NOT NULL
      AND cardinality(newsletter_user_list_id_array) > 0;
  END IF;
END $$;

WITH mapping AS (
  SELECT
    c.newsletter_campaign_id,
    gen_random_uuid() AS list_id,
    c.newsletter_campaign_name AS list_name,
    NULLIF(c.content_theme, '') AS list_topic,
    ('Auto-generated for campaign ' || c.newsletter_campaign_id) AS list_description
  FROM public.newsletter_campaigns c
),
ins AS (
  INSERT INTO public.newsletter_user_lists (
    newsletter_user_list_id,
    newsletter_user_list_name,
    newsletter_user_list_topic,
    newsletter_user_list_description
  )
  SELECT
    m.list_id,
    m.list_name,
    m.list_topic,
    m.list_description
  FROM mapping m
)
UPDATE public.newsletter_campaigns c
SET newsletter_user_lists_id_array = ARRAY[m.list_id]::uuid[]
FROM mapping m
WHERE c.newsletter_campaign_id = m.newsletter_campaign_id;

COMMIT;
