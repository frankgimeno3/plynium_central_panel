-- 040_publication_slots_db_page_ordinal_slot_key.sql
--
-- Normalizes magazine slot rows:
--   - slot_key ∈ { cover, inside_cover, end, preferential_page, regular_page }
--   - publication_page: cover=-1, inside_cover=0, preferential 1–9, end=10 (editable),
--     regular_page strictly between structural neighbours (typically (9,10)).
--   - slot_ordinal = publication_page + 1 (ordering key; replaces flatplan_sequence).
--
BEGIN;

ALTER TABLE publication_slots_db
  ADD COLUMN IF NOT EXISTS publication_page double precision,
  ADD COLUMN IF NOT EXISTS slot_ordinal double precision;

-- 1) Rows bridged by publication_preferential_slots (canonical magazine positions)
UPDATE publication_slots_db AS ps
SET
  publication_page = (
    CASE trim(BOTH FROM p.position_in_magazine)
      WHEN 'Cover page' THEN -1::double precision
      WHEN 'Inside Cover' THEN 0::double precision
      WHEN 'End page' THEN 10::double precision
      ELSE COALESCE(
        CASE
          WHEN regexp_match(trim(BOTH FROM p.position_in_magazine), '^Preferential page ([0-9]+)$') IS NOT NULL
          THEN (regexp_match(trim(BOTH FROM p.position_in_magazine), '^Preferential page ([0-9]+)$'))[1]::integer
        END,
        1
      )::double precision
    END
  ),
  slot_key = (
    CASE trim(BOTH FROM p.position_in_magazine)
      WHEN 'Cover page' THEN 'cover'
      WHEN 'Inside Cover' THEN 'inside_cover'
      WHEN 'End page' THEN 'end'
      ELSE 'preferential_page'
    END
  )
FROM publication_preferential_slots AS p
WHERE p.publication_slot_id = ps.publication_slot_id;

-- 2) Legacy numeric keys 1–9 → preferential_page + publication_page
UPDATE publication_slots_db
SET
  publication_page = CAST(trim(BOTH FROM slot_key) AS integer)::double precision,
  slot_key = 'preferential_page'
WHERE publication_page IS NULL
  AND trim(BOTH FROM slot_key) ~ '^[0-9]+$'
  AND CAST(trim(BOTH FROM slot_key) AS integer) BETWEEN 1 AND 9;

-- 3) Legacy textual structural keys without preferential bridge
UPDATE publication_slots_db
SET publication_page = -1::double precision,
    slot_key = 'cover'
WHERE publication_page IS NULL
  AND lower(trim(BOTH FROM slot_key)) = 'cover';

UPDATE publication_slots_db
SET publication_page = 0::double precision,
    slot_key = 'inside_cover'
WHERE publication_page IS NULL
  AND lower(trim(BOTH FROM slot_key)) IN ('inside_cover', 'inside cover');

UPDATE publication_slots_db
SET publication_page = 10::double precision,
    slot_key = 'end'
WHERE publication_page IS NULL
  AND lower(trim(BOTH FROM slot_key)) IN ('end', 'end_page', 'end page');

-- 4) Preferential rows still missing publication_page (e.g. legacy flatplan bucket ~800k): assign 1..n by issue order
UPDATE publication_slots_db AS ps
SET publication_page = least(
    9::double precision,
    greatest(1::double precision, pref.rn::double precision)
  )
FROM (
  SELECT
    publication_slot_id,
    ROW_NUMBER() OVER (
      PARTITION BY publication_id
      ORDER BY publication_slot_id ASC
    ) AS rn
  FROM publication_slots_db
  WHERE publication_page IS NULL
    AND lower(trim(BOTH FROM slot_key)) = 'preferential_page'
) AS pref
WHERE ps.publication_slot_id = pref.publication_slot_id;

-- Clamp preferential interior pages to [1, 9]
UPDATE publication_slots_db
SET publication_page = greatest(1::double precision, least(9::double precision, round(publication_page::numeric, 0)::double precision))
WHERE lower(trim(BOTH FROM slot_key)) = 'preferential_page';

-- 5) Remaining orphan rows → regular_page; interpolate strictly inside (9, 10) using prior flatplan order
UPDATE publication_slots_db AS ps
SET
  publication_page = 9.0::double precision + (
    ranked.rn::double precision / (ranked.cnt + 1)::double precision
  ),
  slot_key = 'regular_page'
FROM (
  SELECT
    publication_slot_id,
    ROW_NUMBER() OVER (
      PARTITION BY publication_id
      ORDER BY publication_slot_id ASC
    ) AS rn,
    COUNT(*) OVER (PARTITION BY publication_id) AS cnt
  FROM publication_slots_db
  WHERE publication_page IS NULL
) AS ranked
WHERE ps.publication_slot_id = ranked.publication_slot_id;

-- 6) slot_ordinal derived column
UPDATE publication_slots_db
SET slot_ordinal = publication_page + 1::double precision
WHERE slot_ordinal IS NULL;

-- Fail loudly if anything still NULL (data repair needed before constraints)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM publication_slots_db WHERE publication_page IS NULL OR slot_ordinal IS NULL) THEN
    RAISE EXCEPTION '040 migration: publication_page/slot_ordinal still NULL after backfill';
  END IF;
END $$;

ALTER TABLE publication_slots_db
  ALTER COLUMN publication_page SET NOT NULL,
  ALTER COLUMN slot_ordinal SET NOT NULL;

ALTER TABLE publication_slots_db DROP COLUMN IF EXISTS flatplan_sequence;

ALTER TABLE publication_slots_db
  DROP CONSTRAINT IF EXISTS publication_slots_db_slot_key_allowed;

ALTER TABLE publication_slots_db
  ADD CONSTRAINT publication_slots_db_slot_key_allowed CHECK (
    slot_key IN (
      'cover',
      'inside_cover',
      'end',
      'preferential_page',
      'regular_page'
    )
  );

DROP INDEX IF EXISTS publication_slots_db_publication_id_flatplan_sequence;

CREATE INDEX IF NOT EXISTS publication_slots_db_pub_slot_ordinal_idx
  ON publication_slots_db (publication_id, slot_ordinal);

COMMIT;
