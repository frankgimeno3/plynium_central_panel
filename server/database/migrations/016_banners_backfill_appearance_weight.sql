-- Backfill appearance_weight for all banners that still have NULL (e.g. right banners and any missed by 015)
UPDATE banners SET appearance_weight = 'medium' WHERE appearance_weight IS NULL;
