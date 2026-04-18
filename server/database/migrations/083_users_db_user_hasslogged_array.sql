-- 083_users_db_user_hasslogged_array.sql
-- Tracks portal_id values for which the user has already received the first-login feed bootstrap
-- (neutral user_feed_preferences for all topic_portals topics of that portal).

BEGIN;

ALTER TABLE public.users_db
  ADD COLUMN IF NOT EXISTS user_hasslogged_array INTEGER[] NOT NULL DEFAULT '{}'::integer[];

COMMIT;
