-- 080_user_list_subscriptions.sql
-- Normalizes newsletter list membership: one row per (user_id, newsletter_user_list_id).
-- Migrates data from newsletter_user_lists.list_user_ids_array then drops that column.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_list_subscriptions (
  user_list_subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users_db (user_id) ON DELETE CASCADE,
  newsletter_user_list_id UUID NOT NULL REFERENCES public.newsletter_user_lists (newsletter_user_list_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_list_subscriptions_user_list_unique UNIQUE (user_id, newsletter_user_list_id)
);

CREATE INDEX IF NOT EXISTS user_list_subscriptions_user_id_idx
  ON public.user_list_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS user_list_subscriptions_newsletter_user_list_id_idx
  ON public.user_list_subscriptions (newsletter_user_list_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'newsletter_user_lists'
      AND column_name = 'list_user_ids_array'
  ) THEN
    INSERT INTO public.user_list_subscriptions (user_id, newsletter_user_list_id)
    SELECT DISTINCT u.user_id, nul.newsletter_user_list_id
    FROM public.newsletter_user_lists nul
    CROSS JOIN LATERAL unnest(COALESCE(nul.list_user_ids_array, '{}'::uuid[])) AS x(uid)
    INNER JOIN public.users_db u ON u.user_id = x.uid
    WHERE cardinality(COALESCE(nul.list_user_ids_array, '{}'::uuid[])) > 0
    ON CONFLICT (user_id, newsletter_user_list_id) DO NOTHING;

    ALTER TABLE public.newsletter_user_lists
      DROP COLUMN list_user_ids_array;
  END IF;
END $$;

COMMIT;
