-- 037_create_notifications_db.sql
-- Tabla notifications para almacenar todas las notificaciones, solicitudes de publicidad,
-- solicitudes de empresas y otras comunicaciones. Idempotente.
--
-- notification_type: 'notification' | 'advertisement' | 'company' | 'other'
-- notification_category: solo para type='notification' -> 'account_management' | 'production' | 'administration'
-- state: 'unread' | 'read' | 'solved' | 'pending' | 'in_process' | 'accepted' | 'rejected' | 'expired' | 'other'

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    notification_type VARCHAR(32) NOT NULL CHECK (notification_type IN ('notification', 'advertisement', 'company', 'other')),
    notification_category VARCHAR(32) DEFAULT NULL CHECK (notification_category IS NULL OR notification_category IN ('account_management', 'production', 'administration')),
    state VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (state IN ('unread', 'read', 'solved', 'pending', 'in_process', 'accepted', 'rejected', 'expired', 'other')),
    date TIMESTAMPTZ,
    brief_description TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    sender_email VARCHAR(255) DEFAULT '',
    sender_company VARCHAR(255) DEFAULT '',
    sender_contact_phone VARCHAR(64) DEFAULT '',
    country VARCHAR(128) DEFAULT '',
    user_id VARCHAR(64) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications (notification_type);
CREATE INDEX IF NOT EXISTS notifications_state_idx ON notifications (state);
CREATE INDEX IF NOT EXISTS notifications_date_idx ON notifications (date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS notifications_category_idx ON notifications (notification_category) WHERE notification_category IS NOT NULL;

DROP TRIGGER IF EXISTS notifications_updated_at ON notifications;
CREATE TRIGGER notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE notifications IS 'Unified notifications table: system notifications, advertisement requests, company requests, and other communications.';

-- Tabla para comentarios de notificaciones (principalmente para advertisement requests)
CREATE TABLE IF NOT EXISTS notification_comments (
    id SERIAL PRIMARY KEY,
    notification_id VARCHAR(64) NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_comments_notification_id_idx ON notification_comments (notification_id);
CREATE INDEX IF NOT EXISTS notification_comments_date_idx ON notification_comments (date DESC);

COMMENT ON TABLE notification_comments IS 'Comments/notes on notification/request items.';

-- Tabla para el contenido de solicitudes de empresa (company_content)
CREATE TABLE IF NOT EXISTS notification_company_content (
    id SERIAL PRIMARY KEY,
    notification_id VARCHAR(64) NOT NULL UNIQUE REFERENCES notifications(id) ON DELETE CASCADE,
    nombre_comercial VARCHAR(255) NOT NULL DEFAULT '',
    nombre_fiscal VARCHAR(255) NOT NULL DEFAULT '',
    tax_id VARCHAR(64) NOT NULL DEFAULT '',
    cargo_creador VARCHAR(128) NOT NULL DEFAULT '',
    web_empresa VARCHAR(512) DEFAULT '',
    pais_empresa VARCHAR(128) DEFAULT '',
    descripcion_empresa TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS notification_company_content_updated_at ON notification_company_content;
CREATE TRIGGER notification_company_content_updated_at
    BEFORE UPDATE ON notification_company_content
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE notification_company_content IS 'Company content details for company registration requests.';

-- Seed inicial con los datos del JSON
INSERT INTO notifications (id, notification_type, notification_category, state, date, brief_description, description, sender_email, sender_company, sender_contact_phone, country, user_id)
VALUES
    -- System notifications (type = 'notification')
    ('notif-001', 'notification', 'account_management', 'unread', '2025-02-28T09:15:00Z', 'New company request pending review', 'Acme Glass Solutions has requested to add their company to the directory. The request includes tax documentation and commercial description. Manual review by the admin team is required.', '', '', '', '', ''),
    ('notif-002', 'notification', 'account_management', 'read', '2025-02-28T08:30:00Z', 'Subscription payment received successfully', 'User marco.garcia@vidrios.es has renewed their annual subscription. The payment of €299 has been processed successfully. Subscription is active until 28 February 2026.', '', '', '', '', ''),
    ('notif-003', 'notification', 'account_management', 'solved', '2025-02-27T16:45:00Z', 'Advertisement request accepted', 'The advertisement request from TechSpain Solutions (adv-26-0002) has been accepted. Advertisement materials have been published on the platform. The ad is visible in the featured section.', '', '', '', '', ''),
    ('notif-004', 'notification', 'account_management', 'unread', '2025-02-27T14:20:00Z', 'Error reported on company profile', 'Pedro Sánchez has reported an error on their company profile: the contact phone number is incorrect. Request ID: oreq-004. Directory update required.', '', '', '', '', ''),
    ('notif-005', 'notification', 'account_management', 'read', '2025-02-27T11:00:00Z', 'New comment on advertisement request', 'A comment has been added to request adv-26-0007 from SwedGlass AB. The review team requests additional documentation to verify the company credentials.', '', '', '', '', ''),
    ('notif-006', 'notification', 'administration', 'solved', '2025-02-26T17:30:00Z', 'User removed for terms violation', 'User user-spam-789 has been removed for posting disallowed content. Their articles and comments have been deleted. The action was performed by the main administrator.', '', '', '', '', ''),
    ('notif-007', 'notification', 'account_management', 'unread', '2025-02-26T10:15:00Z', 'Collaboration request for technical article', 'Ana García (ana.garcia@email.com) is requesting information on the process for publishing technical articles on architectural glass. Request oreq-001. Response with requirements and collaboration process required.', '', '', '', '', ''),
    ('notif-008', 'notification', 'production', 'solved', '2025-02-25T15:45:00Z', 'Image upload issue resolved', 'The reported bug regarding image uploads on company profiles has been fixed. The update has been deployed to production. Verification by the QA team is recommended.', '', '', '', '', ''),
    ('notif-009', 'notification', 'account_management', 'read', '2025-02-25T09:00:00Z', 'Reminder: subscription expiry', 'Cristalería del Norte (user-ghi789) subscription expires on 3 March 2025. Reminder email has been sent to the user. Consider follow-up if they do not renew before expiry.', '', '', '', '', ''),
    ('notif-010', 'notification', 'account_management', 'unread', '2025-02-24T16:30:00Z', 'Directory registration request', 'Carlos Ruiz (carlos.ruiz@empresa.com) is requesting to register their practice in the professionals directory. Asking about requirements and benefits of the basic profile. ID: oreq-002.', '', '', '', '', ''),
    ('notif-011', 'notification', 'account_management', 'solved', '2025-02-24T14:00:00Z', 'Advertisement rejected for non-compliance', 'The advertisement request from Deutsch Glas GmbH (adv-26-0004) has been rejected. The content does not meet the platform''s advertising guidelines. The applicant has been notified.', '', '', '', '', ''),
    ('notif-012', 'notification', 'production', 'read', '2025-02-23T03:00:00Z', 'Database backup completed', 'The nightly database backup has completed successfully. Size: 2.4 GB. Stored in S3. Retention: 30 days. No errors were detected during the process.', '', '', '', '', ''),
    ('notif-013', 'notification', 'account_management', 'unread', '2025-02-22T11:20:00Z', 'Enquiry about packages for associations', 'María López (mlopez@consultora.es) on behalf of a glass manufacturers association is asking about advertising options for sector events. Are there special packages for associations? ID: oreq-003.', '', '', '', '', ''),
    ('notif-014', 'notification', 'account_management', 'solved', '2025-02-21T13:45:00Z', 'New company added to directory', 'EuroVidrio Industrias has been added to the directory after approval of request creq-002. The profile is published and visible. Country: Portugal. Includes link to corporate website.', '', '', '', '', ''),
    ('notif-015', 'notification', 'account_management', 'read', '2025-02-20T09:30:00Z', 'Visibility request for R&D project', 'Laura Martínez (laura.martinez@vidrieria.es) is looking for partners for a European sustainability project. Asking whether the platform offers visibility for R&D projects. ID: oreq-005. Pending commercial assessment.', '', '', '', '', ''),
    ('notif-016', 'notification', 'production', 'solved', '2025-02-19T06:00:00Z', 'Scheduled maintenance completed', 'The scheduled maintenance of 19 February was completed in 45 minutes. Security updates applied. No incidents. The platform is 100% operational.', '', '', '', '', ''),
    ('notif-017', 'notification', 'administration', 'unread', '2025-02-18T22:15:00Z', 'High failed login activity', '15 failed login attempts have been detected from IP 192.168.1.xx in the last hour. Possible unauthorized access attempt. Review of logs and temporary blocking are recommended.', '', '', '', '', ''),
    ('notif-018', 'notification', 'account_management', 'read', '2025-02-18T10:00:00Z', 'Advertisement request under review', 'PolGlass Manufacturing (adv-26-0006) has their advertisement request under review. Specialists in glass facades for commercial buildings. Poland. Pending certification verification.', '', '', '', '', ''),
    ('notif-019', 'notification', 'administration', 'solved', '2025-02-17T12:00:00Z', 'Terms of use updated', 'The new terms of use have been published. Existing users have been notified by email. The acceptance banner will be shown on next login. Effective date: 1 March 2025.', '', '', '', '', ''),
    ('notif-020', 'notification', 'account_management', 'unread', '2025-02-16T15:45:00Z', 'Enquiry about smart glass project', 'Glass Innovate GmbH is interested in visibility for their smart glass solutions. Request creq-004. Current status: Other. Commercial follow-up required to evaluate collaboration options.', '', '', '', '', ''),
    
    -- Advertisement requests (type = 'advertisement')
    ('adv-26-0001', 'advertisement', NULL, 'pending', '2024-01-15T10:30:00Z', 'Advertisement request from Acme Corporation', 'We would like to advertise our new line of energy-efficient glass products in your directory. Our company specializes in sustainable building materials and we believe your platform would be an excellent fit for reaching potential clients in the European market.', 'marketing@acmecorp.com', 'Acme Corporation', '+1-555-0101', 'United States', ''),
    ('adv-26-0002', 'advertisement', NULL, 'in_process', '2024-01-20T14:15:00Z', 'Advertisement request from TechSpain Solutions', 'Advertisement request for our premium glass manufacturing services. We offer custom solutions for commercial and residential projects across Spain and Portugal.', 'sales@techspain.es', 'TechSpain Solutions', '+34-91-123-4567', 'Spain', ''),
    ('adv-26-0003', 'advertisement', NULL, 'accepted', '2024-01-10T08:00:00Z', 'Advertisement request from France Glass Industries', 'We are interested in promoting our luxury glass products for high-end residential and commercial projects. Our portfolio includes custom-designed glass installations for prestigious clients.', 'info@franceglass.fr', 'France Glass Industries', '+33-1-23-45-67-89', 'France', ''),
    ('adv-26-0004', 'advertisement', NULL, 'rejected', '2024-01-05T12:00:00Z', 'Advertisement request from Deutsch Glas GmbH', 'Advertisement request for our industrial glass solutions. We provide large-scale glass installations for commercial buildings and factories.', 'contact@deutschglas.de', 'Deutsch Glas GmbH', '+49-30-12345678', 'Germany', ''),
    ('adv-26-0005', 'advertisement', NULL, 'expired', '2023-12-20T09:30:00Z', 'Advertisement request from Italia Glass Works', 'We would like to advertise our restoration glass services for historic buildings. Our expertise includes period-accurate glass manufacturing and installation.', 'hello@italiaglass.it', 'Italia Glass Works', '+39-06-1234-5678', 'Italy', ''),
    ('adv-26-0006', 'advertisement', NULL, 'pending', '2024-01-18T11:45:00Z', 'Advertisement request from PolGlass Manufacturing', 'Advertisement for our large-scale glass facade installation services. We specialize in modern architectural glass solutions for commercial buildings.', 'marketing@polglass.pl', 'PolGlass Manufacturing', '+48-22-123-4567', 'Poland', ''),
    ('adv-26-0007', 'advertisement', NULL, 'in_process', '2024-01-22T13:20:00Z', 'Advertisement request from SwedGlass AB', 'We want to promote our energy-efficient triple-glazed windows. Our products are designed for eco-friendly residential and commercial developments.', 'info@swedglass.se', 'SwedGlass AB', '+46-8-123-456-78', 'Sweden', ''),
    ('adv-26-0008', 'advertisement', NULL, 'rejected', '2024-01-25T15:00:00Z', 'Advertisement request from UK Glass Solutions', 'Advertisement request for specialized glass installation services for museum and exhibition spaces. We provide custom solutions for unique architectural requirements.', 'sales@ukglass.co.uk', 'UK Glass Solutions', '+44-20-1234-5678', 'United Kingdom', ''),
    ('adv-26-0009', 'advertisement', NULL, 'accepted', '2024-01-12T10:00:00Z', 'Advertisement request from PortuGlass Lda', 'We would like to advertise our glass roof installation services. Our expertise includes residential and commercial glass roofing solutions.', 'contact@portuglass.pt', 'PortuGlass Lda', '+351-21-123-4567', 'Portugal', ''),
    ('adv-26-0010', 'advertisement', NULL, 'pending', '2024-01-28T09:15:00Z', 'Advertisement request from BelGlass Industries', 'Advertisement for automated glass doors and smart glass partitions. We provide modern solutions for contemporary office buildings and commercial spaces.', 'marketing@belglass.be', 'BelGlass Industries', '+32-2-123-4567', 'Belgium', ''),
    ('adv-26-0011', 'advertisement', NULL, 'in_process', '2024-01-30T16:30:00Z', 'Advertisement request from DanGlass A/S', 'We want to promote our premium glass balustrades for luxury hotel and residential projects. Our products combine safety with elegant design.', 'info@danglass.dk', 'DanGlass A/S', '+45-33-12-34-56', 'Denmark', ''),
    ('adv-26-0012', 'advertisement', NULL, 'accepted', '2024-01-08T07:00:00Z', 'Advertisement request from RusGlass Ltd', 'Advertisement request for large format glass panels. We specialize in commercial building facades and provide custom solutions for architects and developers.', 'sales@rusglass.ru', 'RusGlass Ltd', '+7-495-123-4567', 'Russia', ''),
    ('adv-26-0013', 'advertisement', NULL, 'pending', '2024-01-14T11:00:00Z', 'Advertisement request from US Glass Corp', 'We would like to advertise our tempered glass safety barriers. Our products meet international safety standards and are ideal for high-rise buildings.', 'marketing@usglass.com', 'US Glass Corp', '+1-212-555-1234', 'United States', ''),
    ('adv-26-0014', 'advertisement', NULL, 'in_process', '2024-01-16T10:00:00Z', 'Advertisement request from JapGlass Industries', 'Advertisement for custom-designed glass partitions. We provide modern solutions for office spaces with focus on functionality and aesthetics.', 'contact@japglass.jp', 'JapGlass Industries', '+81-3-1234-5678', 'Japan', ''),
    ('adv-26-0015', 'advertisement', NULL, 'accepted', '2024-01-19T08:30:00Z', 'Advertisement request from China Glass Manufacturing', 'We want to promote our massive glass installation capabilities. Our company has experience with large-scale projects including airports and commercial complexes.', 'info@chinaglass.cn', 'China Glass Manufacturing', '+86-21-1234-5678', 'China', ''),
    ('adv-26-0016', 'advertisement', NULL, 'pending', '2024-01-21T13:00:00Z', 'Advertisement request from Korea Glass Co', 'Advertisement request for smart glass technology integration. We provide innovative solutions for corporate headquarters and modern buildings.', 'sales@koreaglass.kr', 'Korea Glass Co', '+82-2-1234-5678', 'South Korea', ''),
    ('adv-26-0017', 'advertisement', NULL, 'in_process', '2024-01-23T15:45:00Z', 'Advertisement request from AusGlass Pty Ltd', 'We would like to advertise our laminated safety glass products. Our solutions are designed for residential and commercial high-rise buildings.', 'marketing@ausglass.au', 'AusGlass Pty Ltd', '+61-2-1234-5678', 'Australia', ''),
    ('adv-26-0018', 'advertisement', NULL, 'accepted', '2024-01-26T10:20:00Z', 'Advertisement request from NZ Glass Solutions', 'Advertisement for energy-efficient double-glazed windows. Our products are designed for eco-home developments with focus on sustainability.', 'info@nzglass.nz', 'NZ Glass Solutions', '+64-9-123-4567', 'New Zealand', ''),
    ('adv-26-0019', 'advertisement', NULL, 'pending', '2024-01-27T14:00:00Z', 'Advertisement request from BrazGlass Industries', 'We want to promote our decorative glass panels. Our products are ideal for luxury hotel lobbies and high-end commercial spaces.', 'contact@brazglass.com.br', 'BrazGlass Industries', '+55-11-1234-5678', 'Brazil', ''),
    ('adv-26-0020', 'advertisement', NULL, 'expired', '2024-01-29T12:30:00Z', 'Advertisement request from ArgGlass S.A.', 'Advertisement request for glass curtain wall systems. We provide solutions for modern office buildings with focus on energy efficiency.', 'sales@argglass.com.ar', 'ArgGlass S.A.', '+54-11-1234-5678', 'Argentina', ''),
    ('adv-26-0021', 'advertisement', NULL, 'pending', '2024-01-31T09:00:00Z', 'Advertisement request from UkrGlass Ltd', 'We would like to advertise our specialized glass installation services. Our expertise includes security glass solutions for commercial applications.', 'marketing@ukrglass.ua', 'UkrGlass Ltd', '+380-44-123-4567', 'Ukraine', ''),
    ('adv-26-0022', 'advertisement', NULL, 'in_process', '2024-02-01T08:15:00Z', 'Advertisement request from CzGlass s.r.o.', 'Advertisement for glass skylights and roof windows. We provide solutions for residential renovations with focus on natural light and energy efficiency.', 'info@czglass.cz', 'CzGlass s.r.o.', '+420-2-1234-5678', 'Czech Republic', ''),
    
    -- Company requests (type = 'company')
    ('creq-001', 'company', NULL, 'pending', '2024-02-15T10:30:00Z', 'Company registration: Acme Glass Solutions', 'Request to add Acme Glass Solutions to the directory. Manufacturers of high-quality architectural glass.', '', '', '', '', 'user-abc123'),
    ('creq-002', 'company', NULL, 'in_process', '2024-02-18T14:00:00Z', 'Company registration: EuroVidrio Industrias', 'Request to add EuroVidrio Industrias to the directory. Leader in tempered and laminated glass.', '', '', '', '', 'user-def456'),
    ('creq-003', 'company', NULL, 'pending', '2024-02-20T09:15:00Z', 'Company registration: Cristalería del Norte', 'Request to add Cristalería del Norte to the directory. Wholesale distributors of flat glass.', '', '', '', '', 'user-ghi789'),
    ('creq-004', 'company', NULL, 'other', '2024-02-22T16:45:00Z', 'Company registration: Glass Innovate', 'Request to add Glass Innovate to the directory. Smart glass technology and solar control solutions.', '', '', '', '', 'user-jkl012'),
    ('creq-005', 'company', NULL, 'pending', '2024-02-25T11:20:00Z', 'Company registration: Vidrios Mediterráneos', 'Request to add Vidrios Mediterráneos to the directory. Installation of aluminium windows and glazing.', '', '', '', '', 'user-mno345'),
    
    -- Other requests (type = 'other')
    ('oreq-001', 'other', NULL, 'pending', NULL, 'Enquiry about technical article collaboration', 'Hello, I would like to get more information about collaboration opportunities with your platform for publishing technical articles on architectural glass. Could you outline the process and requirements?', 'ana.garcia@email.com', 'Ana García', '', '', ''),
    ('oreq-002', 'other', NULL, 'in_process', NULL, 'Directory registration enquiry from architect', 'Good morning. I am an architect and I am interested in adding my practice to the professionals directory. How can I register and what benefits does the basic profile include?', 'carlos.ruiz@empresa.com', 'Carlos Ruiz', '', '', ''),
    ('oreq-003', 'other', NULL, 'pending', NULL, 'Enquiry about advertising packages for associations', 'Dear team, I am writing on behalf of a glass manufacturers association. We are interested in learning about advertising options for sector events. Do you have special packages for associations?', 'mlopez@consultora.es', 'María López', '', '', ''),
    ('oreq-004', 'other', NULL, 'other', NULL, 'Error report on company profile', 'I have found an error on my company profile in the directory. The contact phone number is incorrect. Please contact me to update it.', 'pedro.s@hotmail.com', 'Pedro Sánchez', '', '', ''),
    ('oreq-005', 'other', NULL, 'pending', NULL, 'European R&D project partnership enquiry', 'We are looking for partners for a European project on sustainability in glass manufacturing. Does your platform offer visibility for R&D projects? Thank you.', 'laura.martinez@vidrieria.es', 'Laura Martínez', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Insert comments for advertisement requests
INSERT INTO notification_comments (notification_id, date, content)
VALUES
    ('adv-26-0002', '2024-01-22T09:00:00Z', 'Initial review completed. Checking advertisement guidelines and available slots.'),
    ('adv-26-0003', '2024-01-12T10:30:00Z', 'Advertisement request approved. Preparing advertisement materials.'),
    ('adv-26-0003', '2024-01-15T11:00:00Z', 'Advertisement is now live on the platform.'),
    ('adv-26-0004', '2024-01-08T14:00:00Z', 'After review, we cannot accept this advertisement request as it does not meet our content guidelines.'),
    ('adv-26-0005', '2023-12-22T10:00:00Z', 'Advertisement request received. Review deadline: January 20, 2024.'),
    ('adv-26-0007', '2024-01-24T08:30:00Z', 'Reviewing advertisement content and verifying company credentials.'),
    ('adv-26-0007', '2024-01-26T10:15:00Z', 'Waiting for additional documentation from the company.'),
    ('adv-26-0008', '2024-01-26T09:00:00Z', 'Advertisement request does not align with our current advertising strategy.'),
    ('adv-26-0009', '2024-01-15T11:00:00Z', 'Advertisement request approved.'),
    ('adv-26-0009', '2024-01-18T14:30:00Z', 'Advertisement materials received and published.'),
    ('adv-26-0011', '2024-02-01T10:00:00Z', 'Reviewing advertisement proposal and company portfolio.'),
    ('adv-26-0012', '2024-01-10T08:30:00Z', 'Advertisement request approved. Processing payment.'),
    ('adv-26-0012', '2024-01-15T12:00:00Z', 'Advertisement is now active on the platform.'),
    ('adv-26-0014', '2024-01-18T09:00:00Z', 'Verifying company information and reviewing advertisement content.'),
    ('adv-26-0015', '2024-01-21T10:00:00Z', 'Advertisement request approved.'),
    ('adv-26-0015', '2024-01-25T14:00:00Z', 'Advertisement published successfully.'),
    ('adv-26-0017', '2024-01-25T09:30:00Z', 'Reviewing safety certifications and product specifications.'),
    ('adv-26-0018', '2024-01-28T11:00:00Z', 'Advertisement request approved. Highlighting energy efficiency benefits.'),
    ('adv-26-0020', '2024-01-30T10:00:00Z', 'Advertisement request received. Review deadline: February 29, 2024.'),
    ('adv-26-0022', '2024-02-02T10:00:00Z', 'Assessing advertisement requirements and available placement options.')
ON CONFLICT DO NOTHING;

-- Insert company content for company requests
INSERT INTO notification_company_content (notification_id, nombre_comercial, nombre_fiscal, tax_id, cargo_creador, web_empresa, pais_empresa, descripcion_empresa)
VALUES
    ('creq-001', 'Acme Glass Solutions', 'Acme Glass Solutions S.L.', 'B12345678', 'Commercial Director', 'https://acmeglass.es', 'Spain', 'Manufacturers of high-quality architectural glass for commercial and residential buildings. Specialists in facades and glazing systems.'),
    ('creq-002', 'EuroVidrio Industrias', 'EuroVidrio Industrias S.A.', 'A87654321', 'CEO', 'https://eurovidrio.com', 'Portugal', 'Leader in tempered and laminated glass for the automotive and construction sectors. Over 25 years of experience.'),
    ('creq-003', 'Cristalería del Norte', 'Cristalería del Norte S.L.U.', 'B98765432', 'Manager', 'https://cristaleriadelnorte.es', 'Spain', 'Wholesale distributors of flat glass. Custom cutting, tempering and laminating services for professionals.'),
    ('creq-004', 'Glass Innovate', 'Glass Innovate GmbH', 'DE123456789', 'Marketing Manager', 'https://glassinnovate.de', 'Germany', 'Smart glass technology and solar control solutions. Research and development of new materials.'),
    ('creq-005', 'Vidrios Mediterráneos', 'Vidrios Mediterráneos S.L.', 'B45678901', 'Owner', 'https://vidriosmediterraneos.com', 'Spain', 'Installation of aluminium windows and glazing. Full service for refurbishment and new build.')
ON CONFLICT DO NOTHING;
