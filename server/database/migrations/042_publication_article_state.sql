-- 042_publication_article_state.sql
-- Adds workflow state on `publication_articles` for editorial / client-approval flow.
--
-- Values (English, stored as-is):
--   unfinished            — default; work not started or in progress.
--   awaiting materials    — blocked until required materials are received.
--   finished unapproved   — layout/content considered complete, not yet client-approved.
--   finished approved     — complete and client-approved (required to publish the issue).

BEGIN;

ALTER TABLE public.publication_articles
  ADD COLUMN IF NOT EXISTS publication_article_state VARCHAR(64) NOT NULL DEFAULT 'unfinished';

ALTER TABLE public.publication_articles
  DROP CONSTRAINT IF EXISTS publication_articles_publication_article_state_chk;

ALTER TABLE public.publication_articles
  ADD CONSTRAINT publication_articles_publication_article_state_chk
  CHECK (
    publication_article_state IN (
      'unfinished',
      'awaiting materials',
      'finished unapproved',
      'finished approved'
    )
  );

COMMIT;
