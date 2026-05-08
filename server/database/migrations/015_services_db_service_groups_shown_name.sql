-- 015_services_db_service_groups_shown_name.sql
-- Adds shown_name to service_groups and services_db and backfills it from existing names.
-- shown_name rules:
-- - service_groups.shown_name: derived from service_group_name by removing the first snake token (channel),
--   replacing underscores with spaces, then lowercasing and capitalizing only the first letter.
--   Example: magazine_premium_page -> Premium page
-- - services_db.shown_name: derived from the 2nd segment of service_full_name (3-part name),
--   then removing the first word (channel) from that segment, and formatting like above.
--   Example: "Glassinformer — Magazine Premium Page — magazine magazine-portal-3" -> Premium page

BEGIN;

ALTER TABLE public.service_groups
  ADD COLUMN IF NOT EXISTS shown_name VARCHAR(255) NULL;

ALTER TABLE public.services_db
  ADD COLUMN IF NOT EXISTS shown_name VARCHAR(255) NULL;

-- Backfill service_groups.shown_name
UPDATE public.service_groups sg
SET shown_name = (
  CASE
    WHEN coalesce(btrim(sg.service_group_name), '') = '' THEN ''
    ELSE (
      -- Remove "<channel>_" prefix, replace '_' with spaces, lower, capitalize first char
      CASE
        WHEN btrim(regexp_replace(sg.service_group_name, '^[^_]+_', '')) = '' THEN
          upper(left(lower(btrim(replace(sg.service_group_name, '_', ' '))), 1)) ||
          substr(lower(btrim(replace(sg.service_group_name, '_', ' '))), 2)
        ELSE
          upper(left(lower(btrim(replace(regexp_replace(sg.service_group_name, '^[^_]+_', ''), '_', ' '))), 1)) ||
          substr(lower(btrim(replace(regexp_replace(sg.service_group_name, '^[^_]+_', ''), '_', ' '))), 2)
      END
    )
  END
)
WHERE sg.shown_name IS NULL OR sg.shown_name = '';

-- Backfill services_db.shown_name
UPDATE public.services_db s
SET shown_name = (
  CASE
    WHEN coalesce(btrim(s.service_full_name), '') = '' THEN ''
    ELSE (
      -- Split "A — B — C" or "A - B - C"; take B; remove first word (channel), then format
      WITH parts AS (
        SELECT regexp_split_to_array(s.service_full_name, '\\s*(—|-)\\s*') AS arr
      ),
      seg AS (
        SELECT
          CASE
            WHEN array_length(arr, 1) >= 2 THEN btrim(arr[2])
            ELSE btrim(s.service_full_name)
          END AS part2
        FROM parts
      ),
      reduced AS (
        SELECT
          btrim(regexp_replace(part2, '^\\S+\\s+', '')) AS part2_reduced,
          part2 AS part2_raw
        FROM seg
      )
      SELECT
        CASE
          WHEN part2_reduced <> '' THEN
            upper(left(lower(part2_reduced), 1)) || substr(lower(part2_reduced), 2)
          WHEN part2_raw <> '' THEN
            upper(left(lower(part2_raw), 1)) || substr(lower(part2_raw), 2)
          ELSE ''
        END
      FROM reduced
    )
  END
)
WHERE s.shown_name IS NULL OR s.shown_name = '';

-- Make both columns NOT NULL with default '' after backfill
ALTER TABLE public.service_groups
  ALTER COLUMN shown_name SET DEFAULT ''::character varying;
UPDATE public.service_groups SET shown_name = '' WHERE shown_name IS NULL;
ALTER TABLE public.service_groups
  ALTER COLUMN shown_name SET NOT NULL;

ALTER TABLE public.services_db
  ALTER COLUMN shown_name SET DEFAULT ''::character varying;
UPDATE public.services_db SET shown_name = '' WHERE shown_name IS NULL;
ALTER TABLE public.services_db
  ALTER COLUMN shown_name SET NOT NULL;

COMMIT;

