-- 038_delete_corrupt_preferential_slots_publication_26_000000011.sql
--
-- One-off repair for publication `publication_26_000000011`: remove orphan
-- `publication_slots_db` rows left by duplicated `preferential_page` inserts
-- (e.g. race on GET `/preferential-slots` with `ensureMissing`), which created
-- extra slot rows without a matching `publication_preferential_slots` bridge row.
--
-- Safety: we only DELETE slots that are BOTH "empty junk pattern" AND NOT referenced
-- from `publication_preferential_slots`. Canonical preferential placements stay intact.
--
-- Steps:
-- 1) Strip those ids from `publication_articles.publication_slots_id_array`.
-- 2) DELETE orphans from `publication_slots_db` (`publication_slot_content` CASCADE).

BEGIN;

CREATE TEMP TABLE tmp_orphan_pref_slots AS
SELECT s.publication_slot_id
FROM public.publication_slots_db AS s
WHERE s.publication_id = 'publication_26_000000011'
  AND lower(btrim(COALESCE(s.slot_key, ''))) = 'preferential_page'
  AND lower(btrim(COALESCE(s.slot_state, ''))) = 'pending'
  AND s.customer_id IS NULL
  AND s.project_id IS NULL
  AND s.slot_article_id IS NULL
  AND (
    s.slot_media_url IS NULL
    OR btrim(COALESCE(s.slot_media_url, '')) = ''
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.publication_preferential_slots AS p
    WHERE p.publication_slot_id = s.publication_slot_id
  );

UPDATE public.publication_articles AS pa
SET
  publication_slots_id_array =
    COALESCE(
      (
        SELECT array_agg(u.e ORDER BY u.ord)
        FROM unnest(pa.publication_slots_id_array) WITH ORDINALITY AS u(e, ord)
        WHERE
          u.e IS NULL
          OR NOT EXISTS (
            SELECT 1
            FROM tmp_orphan_pref_slots t
            WHERE t.publication_slot_id = u.e
          )
      ),
      '{}'::integer[]
    ),
  publication_article_updated_at = now()
WHERE pa.publication_id = 'publication_26_000000011'
  AND EXISTS (
    SELECT 1
    FROM unnest(pa.publication_slots_id_array) AS used(e)
    INNER JOIN tmp_orphan_pref_slots t ON t.publication_slot_id = used.e
  );

DELETE FROM public.publication_slots_db AS s
USING tmp_orphan_pref_slots AS t
WHERE s.publication_slot_id = t.publication_slot_id;

DROP TABLE IF EXISTS tmp_orphan_pref_slots;

COMMIT;
