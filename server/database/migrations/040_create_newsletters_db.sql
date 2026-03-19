-- 040_create_newsletters_db.sql
-- Tabla para newsletters individuales.
-- Requiere: 039_create_newsletter_campaigns_db.sql
-- Idempotente.

-- ============================================================================
-- newsletters: Newsletters individuales
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletters (
    id_newsletter VARCHAR(64) PRIMARY KEY,
    id_campaign VARCHAR(64) NOT NULL REFERENCES newsletter_campaigns(id_campaign) ON DELETE CASCADE,
    portal_code VARCHAR(64) NOT NULL,
    estimated_publish_date DATE,
    topic VARCHAR(512) DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'calendarized', 'in_progress', 'ready', 'published', 'cancelled')),
    user_newsletter_list_id VARCHAR(64),
    sent_to_lists JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS newsletters_campaign_idx ON newsletters (id_campaign);
CREATE INDEX IF NOT EXISTS newsletters_portal_idx ON newsletters (portal_code);
CREATE INDEX IF NOT EXISTS newsletters_status_idx ON newsletters (status);
CREATE INDEX IF NOT EXISTS newsletters_publish_date_idx ON newsletters (estimated_publish_date);
CREATE INDEX IF NOT EXISTS newsletters_user_list_idx ON newsletters (user_newsletter_list_id);

DROP TRIGGER IF EXISTS newsletters_updated_at ON newsletters;
CREATE TRIGGER newsletters_updated_at
    BEFORE UPDATE ON newsletters
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE newsletters IS 'Individual newsletter editions within a campaign.';
COMMENT ON COLUMN newsletters.id_newsletter IS 'Unique identifier for the newsletter';
COMMENT ON COLUMN newsletters.id_campaign IS 'Reference to parent campaign';
COMMENT ON COLUMN newsletters.status IS 'Newsletter status: pending, calendarized, in_progress, ready, published, cancelled';
COMMENT ON COLUMN newsletters.user_newsletter_list_id IS 'Target user list for sending';
COMMENT ON COLUMN newsletters.sent_to_lists IS 'Array of list IDs to which the newsletter was sent (JSON array)';

-- ============================================================================
-- Seed inicial con datos del JSON
-- ============================================================================
INSERT INTO newsletters (id_newsletter, id_campaign, portal_code, estimated_publish_date, topic, status, user_newsletter_list_id, sent_to_lists, created_at, updated_at)
VALUES
    ('nl-001', 'camp-001', 'plynium', '2025-03-15', 'Ventilated facades and curtain wall', 'calendarized', 'list_editors', NULL, '2025-02-01 10:00:00+00', '2025-03-01 12:00:00+00'),
    ('nl-002', 'camp-002', 'plynium', '2025-06-01', 'Industrial glass and safety', 'pending', 'list_publications', NULL, '2025-03-10 09:00:00+00', '2025-03-10 09:00:00+00'),
    ('nl-003', 'camp-003', 'plynium', '2024-12-10', 'Skylights and roof lights', 'published', 'list_editors', '["list_editors", "list_publications"]', '2024-11-01 08:00:00+00', '2024-12-10 14:00:00+00'),
    ('nl-004', 'camp-001', 'plynium', '2025-06-15', 'Summer facades update', 'calendarized', 'list_editors', NULL, '2025-03-05 11:00:00+00', '2025-03-05 11:00:00+00'),
    ('nl-005', 'camp-002', 'plynium', '2025-01-15', 'Industrial glass Q1', 'cancelled', 'list_admins', NULL, '2024-12-01 10:00:00+00', '2025-01-10 09:00:00+00')
ON CONFLICT (id_newsletter) DO UPDATE SET
    id_campaign = EXCLUDED.id_campaign,
    portal_code = EXCLUDED.portal_code,
    estimated_publish_date = EXCLUDED.estimated_publish_date,
    topic = EXCLUDED.topic,
    status = EXCLUDED.status,
    user_newsletter_list_id = EXCLUDED.user_newsletter_list_id,
    sent_to_lists = EXCLUDED.sent_to_lists,
    updated_at = EXCLUDED.updated_at;
