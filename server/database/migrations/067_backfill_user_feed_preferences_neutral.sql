-- 067_backfill_user_feed_preferences_neutral.sql
-- Para cada fila de users_db y cada fila de topics_db, crea una fila en
-- user_feed_preferences con preference_state = 'neutral' solo si aún no existe
-- esa pareja (user_id, topic_id). Las filas existentes no se tocan.

BEGIN;

INSERT INTO public.user_feed_preferences (user_id, topic_id, preference_state)
SELECT u.user_id, t.topic_id, 'neutral'::character varying
FROM public.users_db AS u
CROSS JOIN public.topics_db AS t
WHERE NOT EXISTS (
  SELECT 1
  FROM public.user_feed_preferences AS p
  WHERE p.user_id = u.user_id
    AND p.topic_id = t.topic_id
);

COMMIT;
