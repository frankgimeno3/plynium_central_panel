-- Add appearance_weight for top/medium banners: low=1, medium=2, high=3 (used to compute display probability)
ALTER TABLE banners ADD COLUMN IF NOT EXISTS appearance_weight VARCHAR(16) NULL;
UPDATE banners SET appearance_weight = 'medium' WHERE appearance_weight IS NULL AND position_type IN ('top', 'medium');
