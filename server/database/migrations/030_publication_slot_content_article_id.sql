-- 030_publication_slot_content_article_id.sql
-- Store the article related to a publication slot content row.

BEGIN;

ALTER TABLE public.publication_slot_content
  ADD COLUMN IF NOT EXISTS article_id TEXT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'publication_slot_content_article_id_fkey'
  ) THEN
    ALTER TABLE public.publication_slot_content
      ADD CONSTRAINT publication_slot_content_article_id_fkey
      FOREIGN KEY (article_id)
      REFERENCES public.articles_db (id_article)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS publication_slot_content_article_id_idx
  ON public.publication_slot_content (article_id)
  WHERE article_id IS NOT NULL;

-- Backfill from the legacy shortcut column when it already exists on the slot.
UPDATE public.publication_slot_content AS c
   SET article_id = s.slot_article_id
  FROM public.publication_slots_db AS s
 WHERE c.publication_slot_id = s.publication_slot_id
   AND s.slot_article_id IS NOT NULL
   AND s.slot_article_id <> ''
   AND c.article_id IS DISTINCT FROM s.slot_article_id;

COMMIT;
