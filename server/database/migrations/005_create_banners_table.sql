-- Create banners table (run once if the table does not exist)
-- Compatible with Sequelize BannerModel (modelName: 'banner', tableName: 'banners')

CREATE TABLE IF NOT EXISTS banners (
    id VARCHAR(255) PRIMARY KEY,
    src VARCHAR(2048) NOT NULL,
    route VARCHAR(512) NOT NULL DEFAULT '/',
    banner_redirection VARCHAR(2048) NOT NULL DEFAULT 'https://www.vidrioperfil.com',
    position_type VARCHAR(32) NOT NULL,
    page_type VARCHAR(32) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS banners_page_type ON banners (page_type);
CREATE INDEX IF NOT EXISTS banners_position_type ON banners (position_type);
CREATE INDEX IF NOT EXISTS banners_route ON banners (route);
