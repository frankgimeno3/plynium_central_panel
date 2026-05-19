-- Mediateca-hosted PDFs (one per publication) referenced by every summary/index slot in the flatplan.
-- index.pdf lives under …/{edition}/index/, summary.pdf under …/{edition}/summary/.

ALTER TABLE publications_db
  ADD COLUMN IF NOT EXISTS publication_index_pdf_url VARCHAR(512) NULL,
  ADD COLUMN IF NOT EXISTS publication_summary_pdf_url VARCHAR(512) NULL;
