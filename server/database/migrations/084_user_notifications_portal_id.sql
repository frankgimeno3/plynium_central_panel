-- 084_user_notifications_portal_id.sql
-- Links notifications to a portal (e.g. welcome/tutorial on first portal login).

BEGIN;

ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS portal_id INTEGER NULL
  REFERENCES public.portals_db (portal_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_notifications_portal_id_idx ON public.user_notifications (portal_id);

COMMIT;
