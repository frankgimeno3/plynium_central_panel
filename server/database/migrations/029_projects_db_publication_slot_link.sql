-- 029_projects_db_publication_slot_link.sql
-- Allow a project to point back at the publication slot that hosts its content.
--
-- - Adds the FK column `publication_slot_id` on `projects_db`.
-- - When the panel assigns a project to a publication slot it now writes both
--   `publication_id` and `publication_slot_id` on `projects_db` (and copies the
--   project's contract customer into `publication_slots_db.customer_id`).
-- - Backfills the new column for any project that is already linked through
--   `publication_slots_db.project_id` so the relationship is consistent on day one.

BEGIN;

ALTER TABLE public.projects_db
  ADD COLUMN IF NOT EXISTS publication_slot_id INTEGER NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_db_publication_slot_id_fkey'
  ) THEN
    ALTER TABLE public.projects_db
      ADD CONSTRAINT projects_db_publication_slot_id_fkey
      FOREIGN KEY (publication_slot_id)
      REFERENCES public.publication_slots_db (publication_slot_id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS projects_db_publication_slot_id_idx
  ON public.projects_db (publication_slot_id)
  WHERE publication_slot_id IS NOT NULL;

-- Backfill: every slot that already references a project gets reflected back
-- onto that project's publication_id / publication_slot_id columns.
UPDATE public.projects_db AS p
   SET publication_slot_id = s.publication_slot_id,
       publication_id      = s.publication_id,
       project_updated_at  = now()
  FROM public.publication_slots_db AS s
 WHERE s.project_id IS NOT NULL
   AND s.project_id = p.project_id
   AND (
        p.publication_slot_id IS DISTINCT FROM s.publication_slot_id
     OR p.publication_id      IS DISTINCT FROM s.publication_id
   );

COMMIT;
