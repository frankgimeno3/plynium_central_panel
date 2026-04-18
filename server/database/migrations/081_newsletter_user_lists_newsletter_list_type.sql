-- 081_newsletter_user_lists_newsletter_list_type.sql
-- Stores main vs specific on the list row (campaign lateral remains a fallback for older rows).

BEGIN;

ALTER TABLE public.newsletter_user_lists
  ADD COLUMN IF NOT EXISTS newsletter_list_type VARCHAR(32) NOT NULL DEFAULT 'specific';

-- Backfill from linked campaigns where possible
UPDATE public.newsletter_user_lists nul
SET newsletter_list_type = src.newsletter_type
FROM (
  SELECT DISTINCT ON (nul_inner.newsletter_user_list_id)
    nul_inner.newsletter_user_list_id,
    c.newsletter_type
  FROM public.newsletter_user_lists nul_inner
  INNER JOIN public.newsletter_campaigns c
    ON c.newsletter_user_lists_id_array @> ARRAY[nul_inner.newsletter_user_list_id]::uuid[]
  ORDER BY nul_inner.newsletter_user_list_id, c.newsletter_campaign_id ASC
) src
WHERE nul.newsletter_user_list_id = src.newsletter_user_list_id
  AND src.newsletter_type IN ('main', 'specific');

ALTER TABLE public.newsletter_user_lists
  DROP CONSTRAINT IF EXISTS newsletter_user_lists_newsletter_list_type_check;

ALTER TABLE public.newsletter_user_lists
  ADD CONSTRAINT newsletter_user_lists_newsletter_list_type_check
  CHECK (newsletter_list_type IN ('main', 'specific'));

COMMIT;
