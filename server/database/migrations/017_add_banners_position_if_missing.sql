-- Add position column to banners if missing (required by Sequelize model and order clause)
ALTER TABLE banners ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;
