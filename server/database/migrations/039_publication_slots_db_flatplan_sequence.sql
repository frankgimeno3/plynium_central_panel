-- 039_publication_slots_db_flatplan_sequence.sql
--
-- Ordering key for magazine slots within an issue: allows multiple `regular_page`
-- rows and deterministic insert-between placement without changing slot_key.

BEGIN;

ALTER TABLE publication_slots_db
  ADD COLUMN IF NOT EXISTS flatplan_sequence double precision;

UPDATE publication_slots_db AS s
SET flatplan_sequence = o.seq
FROM (
  SELECT
    publication_slot_id,
    ROW_NUMBER() OVER (
      PARTITION BY publication_id
      ORDER BY sk ASC, publication_slot_id ASC
    )
      * 1000.0 AS seq
  FROM (
    SELECT
      publication_slot_id,
      publication_id,
      CASE
        WHEN lower(btrim(slot_key)) = 'cover' THEN 0
        WHEN lower(btrim(slot_key)) IN ('inside_cover', 'inside cover') THEN 1
        WHEN btrim(slot_key) ~ '^[0-9]+$' THEN 100 + CAST(btrim(slot_key) AS INTEGER)
        WHEN lower(btrim(slot_key)) IN ('end', 'end_page', 'end page') THEN 1000000
        WHEN lower(btrim(slot_key)) = 'regular_page' THEN 800000 + publication_slot_id::double precision * 0.001
        ELSE 500000 + publication_slot_id::double precision * 0.001
      END AS sk
    FROM publication_slots_db
  ) AS t
) AS o
WHERE s.publication_slot_id = o.publication_slot_id;

COMMIT;
