-- 041_delete_publication_slots_non_integer_publication_page.sql
--
-- Drops legacy editorial rows whose publication_page used fractional ordering.
-- Strips deleted ids from publication_articles.publication_slots_id_array.
-- publication_slot_content CASCADE deletes when parent slot row is removed.

BEGIN;

CREATE TEMP TABLE tmp_non_integer_publication_page_slots AS
SELECT publication_slot_id
FROM publication_slots_db
WHERE publication_page IS NOT NULL
  AND publication_page::numeric <> trunc(publication_page::numeric);

UPDATE publication_articles AS pa
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
            FROM tmp_non_integer_publication_page_slots t
            WHERE t.publication_slot_id = u.e
          )
      ),
      '{}'::integer[]
    ),
  publication_article_updated_at = now()
WHERE EXISTS (
    SELECT 1
    FROM unnest(pa.publication_slots_id_array) AS used(e)
    INNER JOIN tmp_non_integer_publication_page_slots t ON t.publication_slot_id = used.e
  );

DELETE FROM publication_slots_db AS s
USING tmp_non_integer_publication_page_slots AS t
WHERE s.publication_slot_id = t.publication_slot_id;

DROP TABLE IF EXISTS tmp_non_integer_publication_page_slots;

COMMIT;
