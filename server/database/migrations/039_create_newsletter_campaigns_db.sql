-- 039_create_newsletter_campaigns_db.sql
-- Tabla para campañas de newsletters.
-- Idempotente.

-- ============================================================================
-- newsletter_campaigns: Campañas de newsletters
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id_campaign VARCHAR(64) PRIMARY KEY,
    name VARCHAR(512) NOT NULL,
    description TEXT DEFAULT '',
    portal_code VARCHAR(64) NOT NULL,
    content_theme VARCHAR(512) DEFAULT '',
    frequency VARCHAR(32) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'biannual', 'quarterly', 'yearly', 'one-time')),
    start_date DATE,
    end_date DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'finished', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS newsletter_campaigns_portal_idx ON newsletter_campaigns (portal_code);
CREATE INDEX IF NOT EXISTS newsletter_campaigns_status_idx ON newsletter_campaigns (status);
CREATE INDEX IF NOT EXISTS newsletter_campaigns_start_date_idx ON newsletter_campaigns (start_date);
CREATE INDEX IF NOT EXISTS newsletter_campaigns_end_date_idx ON newsletter_campaigns (end_date);

DROP TRIGGER IF EXISTS newsletter_campaigns_updated_at ON newsletter_campaigns;
CREATE TRIGGER newsletter_campaigns_updated_at
    BEFORE UPDATE ON newsletter_campaigns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE newsletter_campaigns IS 'Newsletter campaigns with scheduling and theme information.';
COMMENT ON COLUMN newsletter_campaigns.id_campaign IS 'Unique identifier for the campaign';
COMMENT ON COLUMN newsletter_campaigns.frequency IS 'Publication frequency: weekly, biweekly, monthly, biannual, quarterly, yearly, one-time';
COMMENT ON COLUMN newsletter_campaigns.status IS 'Campaign status: draft, active, paused, finished, cancelled';

-- ============================================================================
-- Seed inicial con datos del JSON
-- ============================================================================
INSERT INTO newsletter_campaigns (id_campaign, name, description, portal_code, content_theme, frequency, start_date, end_date, status, created_at, updated_at)
VALUES
    ('camp-001', 'Facades & Curtain Wall 2025', 'Quarterly newsletter on ventilated facades and curtain wall systems.', 'plynium', 'Ventilated facades and curtain wall', 'quarterly', '2025-01-01', '2025-12-31', 'active', '2024-11-01 10:00:00+00', '2025-03-01 12:00:00+00'),
    ('camp-002', 'Industrial Glass & Safety', 'Biannual newsletter on industrial glass applications and safety standards.', 'plynium', 'Industrial glass and safety', 'biannual', '2025-01-01', '2025-12-31', 'active', '2024-10-15 09:00:00+00', '2025-02-20 11:00:00+00'),
    ('camp-003', 'Skylights & Roof Lights', 'Newsletter series on skylights, atria and roof glazing.', 'plynium', 'Skylights and roof lights', 'quarterly', '2024-06-01', '2025-06-30', 'finished', '2024-05-01 08:00:00+00', '2024-12-10 14:00:00+00')
ON CONFLICT (id_campaign) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    portal_code = EXCLUDED.portal_code,
    content_theme = EXCLUDED.content_theme,
    frequency = EXCLUDED.frequency,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;
