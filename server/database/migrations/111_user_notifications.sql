-- 111_user_notifications.sql
-- Notificaciones por usuario (bandeja / centro de avisos).

CREATE TABLE IF NOT EXISTS public.user_notifications (
  user_notification_id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users_db (user_id) ON DELETE CASCADE,
  notification_type VARCHAR(255) NOT NULL DEFAULT ''::character varying,
  notification_content TEXT NOT NULL DEFAULT ''::text,
  notification_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_status VARCHAR(64) NOT NULL DEFAULT 'pending'::character varying,
  notification_redirection VARCHAR(2048) NULL DEFAULT ''::character varying,
  CONSTRAINT user_notifications_pkey PRIMARY KEY (user_notification_id)
);

CREATE INDEX IF NOT EXISTS user_notifications_user_id_idx ON public.user_notifications (user_id);
CREATE INDEX IF NOT EXISTS user_notifications_notification_date_idx ON public.user_notifications (notification_date DESC);
CREATE INDEX IF NOT EXISTS user_notifications_notification_status_idx ON public.user_notifications (notification_status);
CREATE INDEX IF NOT EXISTS user_notifications_notification_type_idx ON public.user_notifications (notification_type);
