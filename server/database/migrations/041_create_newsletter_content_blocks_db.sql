-- 041_create_newsletter_content_blocks_db.sql
-- Tabla para bloques de contenido de newsletters.
-- Requiere: 040_create_newsletters_db.sql
-- Idempotente.

-- ============================================================================
-- newsletter_content_blocks: Bloques de contenido de newsletters
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_content_blocks (
    id_block VARCHAR(64) PRIMARY KEY,
    id_newsletter VARCHAR(64) NOT NULL REFERENCES newsletters(id_newsletter) ON DELETE CASCADE,
    block_type VARCHAR(64) NOT NULL CHECK (block_type IN ('header', 'footer', 'banner', 'portal_article_preview', 'custom_content', 'divider', 'spacer', 'social_links', 'cta_button')),
    block_order INTEGER NOT NULL DEFAULT 0,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS newsletter_content_blocks_newsletter_idx ON newsletter_content_blocks (id_newsletter);
CREATE INDEX IF NOT EXISTS newsletter_content_blocks_type_idx ON newsletter_content_blocks (block_type);
CREATE INDEX IF NOT EXISTS newsletter_content_blocks_order_idx ON newsletter_content_blocks (id_newsletter, block_order);

DROP TRIGGER IF EXISTS newsletter_content_blocks_updated_at ON newsletter_content_blocks;
CREATE TRIGGER newsletter_content_blocks_updated_at
    BEFORE UPDATE ON newsletter_content_blocks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE newsletter_content_blocks IS 'Content blocks that compose a newsletter (headers, banners, articles, etc.).';
COMMENT ON COLUMN newsletter_content_blocks.id_block IS 'Unique identifier for the content block';
COMMENT ON COLUMN newsletter_content_blocks.id_newsletter IS 'Reference to parent newsletter';
COMMENT ON COLUMN newsletter_content_blocks.block_type IS 'Type of content block: header, footer, banner, portal_article_preview, custom_content, divider, spacer, social_links, cta_button';
COMMENT ON COLUMN newsletter_content_blocks.block_order IS 'Display order within the newsletter (0-based)';
COMMENT ON COLUMN newsletter_content_blocks.data IS 'JSON object with block-specific data (title, imageSrc, html, links, etc.)';

-- ============================================================================
-- Seed inicial con datos del JSON
-- ============================================================================
INSERT INTO newsletter_content_blocks (id_block, id_newsletter, block_type, block_order, data)
VALUES
    -- Newsletter nl-001 blocks
    ('ncb-001', 'nl-001', 'header', 0, '{"title": "Newsletter Q1 2025 - Facades", "subtitle": "Ventilated facades and curtain wall", "logoUrl": "/logo-newsletter.png"}'),
    ('ncb-002', 'nl-001', 'banner', 1, '{"imageSrc": "/banners/nl001-banner1.jpg", "redirectUrl": "https://example.com/fachadas", "alt": "Facades campaign"}'),
    ('ncb-003', 'nl-001', 'portal_article_preview', 2, '{"articleId": "art-012", "title": "Ventilated facade in Barcelona", "briefing": "Success case in residential building with glass cladding.", "imageSrc": "/content/nl001-1.jpg", "link": "https://example.com/caso-1"}'),
    ('ncb-004', 'nl-001', 'portal_article_preview', 3, '{"articleId": "art-018", "title": "Corporate offices curtain wall", "briefing": "Installation of 2,500 m² of structural glass.", "imageSrc": "/content/nl001-2.jpg", "link": "https://example.com/caso-2"}'),
    ('ncb-005', 'nl-001', 'banner', 4, '{"imageSrc": "/banners/nl001-banner2.jpg", "redirectUrl": "https://example.com/curtain-wall", "alt": "Curtain wall"}'),
    ('ncb-006', 'nl-001', 'custom_content', 5, '{"html": "<p>Building code updates: summary of insulation requirements for facades in 2025.</p>"}'),
    ('ncb-007', 'nl-001', 'footer', 6, '{"text": "© 2025 Plynium. Unsubscribe from this list.", "links": [{"label": "Privacy", "url": "https://example.com/privacy"}, {"label": "Unsubscribe", "url": "https://example.com/unsubscribe"}]}'),
    
    -- Newsletter nl-002 blocks
    ('ncb-008', 'nl-002', 'header', 0, '{"title": "Newsletter Q2 2025 - Industrial glass", "subtitle": "Industrial glass and safety", "logoUrl": "/logo-newsletter.png"}'),
    ('ncb-009', 'nl-002', 'banner', 1, '{"imageSrc": "/banners/nl002-banner1.jpg", "redirectUrl": "https://example.com/vidrio-industrial", "alt": "Industrial glass"}'),
    ('ncb-010', 'nl-002', 'portal_article_preview', 2, '{"articleId": "art-055", "title": "Laminated safety glass", "briefing": "Applications in industrial warehouses and storage facilities.", "imageSrc": "/content/nl002-1.jpg", "link": "https://example.com/laminado"}'),
    ('ncb-011', 'nl-002', 'footer', 3, '{"text": "© 2025 Plynium.", "links": []}'),
    
    -- Newsletter nl-003 blocks
    ('ncb-012', 'nl-003', 'header', 0, '{"title": "Newsletter Skylights 2024", "subtitle": "Skylights and roof lights", "logoUrl": "/logo-newsletter.png"}'),
    ('ncb-013', 'nl-003', 'portal_article_preview', 1, '{"articleId": "art-088", "title": "Glazed atrium corporate headquarters", "briefing": "Skylights and roof lights in 5-storey building.", "imageSrc": "/content/nl003-1.jpg", "link": "https://example.com/atrio"}'),
    ('ncb-014', 'nl-003', 'footer', 2, '{"text": "© 2024 Plynium. Sent to list_editors, list_publications.", "links": []}'),

    -- Newsletter nl-004 blocks
    ('ncb-015', 'nl-004', 'header', 0, '{"title": "Summer facades update", "subtitle": "News and best practices for summer facade performance", "logoUrl": "/logo-newsletter.png"}'),
    ('ncb-016', 'nl-004', 'banner', 1, '{"imageSrc": "/banners/nl004-banner1.jpg", "redirectUrl": "https://example.com/nl004", "alt": "Summer facades banner"}'),
    ('ncb-017', 'nl-004', 'footer', 2, '{"text": "© 2025 Plynium. Unsubscribe from this list.", "links": [{"label": "Privacy", "url": "https://example.com/privacy"}, {"label": "Unsubscribe", "url": "https://example.com/unsubscribe"}]}'),

    -- Newsletter nl-005 blocks
    ('ncb-018', 'nl-005', 'header', 0, '{"title": "Industrial glass Q1", "subtitle": "Industrial glass and safety highlights for Q1", "logoUrl": "/logo-newsletter.png"}'),
    ('ncb-019', 'nl-005', 'banner', 1, '{"imageSrc": "/banners/nl005-banner1.jpg", "redirectUrl": "https://example.com/nl005", "alt": "Industrial glass Q1 banner"}'),
    ('ncb-020', 'nl-005', 'footer', 2, '{"text": "© 2025 Plynium. Sent to list_admins.", "links": []}')
ON CONFLICT (id_block) DO UPDATE SET
    id_newsletter = EXCLUDED.id_newsletter,
    block_type = EXCLUDED.block_type,
    block_order = EXCLUDED.block_order,
    data = EXCLUDED.data,
    updated_at = NOW();
