-- Flatplan thumbnail for cover slot: full composite from Data tab (…/adverts media/cover/final/).

ALTER TABLE publications_db
  ADD COLUMN IF NOT EXISTS publication_cover_flatplan_image_url VARCHAR(512) NULL;
