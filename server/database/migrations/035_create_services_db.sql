-- 035_create_services_db.sql
-- Tabla services_db (catálogo de servicios). Idempotente.

CREATE TABLE IF NOT EXISTS services_db (
    id_service VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    service_type VARCHAR(64) NOT NULL DEFAULT '',
    display_name VARCHAR(512) NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    service_description TEXT NOT NULL DEFAULT '',
    tariff_price_eur DECIMAL(14, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(128) NOT NULL DEFAULT '',
    delivery_days INTEGER NOT NULL DEFAULT 0,
    publication_date DATE
);

CREATE INDEX IF NOT EXISTS services_db_name ON services_db (name);
CREATE INDEX IF NOT EXISTS services_db_service_type ON services_db (service_type);

-- Seed: datos desde services.json
INSERT INTO services_db (id_service, name, service_type, display_name, description, service_description, tariff_price_eur, unit, delivery_days, publication_date)
VALUES
  ('srv-001', 'newsletter', 'newsletter', 'Newsletter banner', 'Promotional banner insertion in sector newsletter. Reach to B2B subscriber base.', 'Promotional banner insertion in sector newsletter. Reach to B2B subscriber base.', 450, 'insertion', 5, NULL),
  ('srv-002', 'portal_article', 'portal', 'Portal article', 'Technical or corporate article published on the portal. Includes copywriting and layout.', 'Technical or corporate article published on the portal. Includes copywriting and layout.', 650, 'article', 10, NULL),
  ('srv-003', 'portal_premium_profile', 'portal', 'Premium portal profile', 'Featured company profile on portal with logo, description and link. Priority visibility.', 'Featured company profile on portal with logo, description and link. Priority visibility.', 1200, 'profile/year', 3, NULL),
  ('srv-004', 'magazine_advertisement', 'magazine', 'Magazine advertisement', 'Advertising space in specialist magazine (Glass Today, Glass Magazine or other). Design included.', 'Advertising space in specialist magazine (Glass Today, Glass Magazine or other). Design included.', 850, 'advert', 15, '2025-06-01'),
  ('srv-005', 'portal_banner', 'portal', 'Portal banner', 'Promotional banner on homepage or portal section. Standard formats, rotation included.', 'Promotional banner on homepage or portal section. Standard formats, rotation included.', 550, 'banner/month', 5, NULL),
  ('srv-006', 'magazine_article', 'magazine', 'Magazine article', 'Article in specialist publication (Skylights Today, Glass and Construction, etc.). Copywriting and editing.', 'Article in specialist publication (Skylights Today, Glass and Construction, etc.). Copywriting and editing.', 720, 'article', 20, NULL)
ON CONFLICT (id_service) DO NOTHING;
