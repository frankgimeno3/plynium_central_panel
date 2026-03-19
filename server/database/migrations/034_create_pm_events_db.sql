-- 034_create_pm_events_db.sql
-- Tabla pm_events_db (eventos PM vinculados a projects y customers). Idempotente.

CREATE TABLE IF NOT EXISTS pm_events_db (
    id_event VARCHAR(64) PRIMARY KEY,
    id_project VARCHAR(64) NOT NULL,
    id_customer VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    date DATE NOT NULL,
    event_description TEXT NOT NULL DEFAULT '',
    event_state VARCHAR(64) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pm_events_db_id_project ON pm_events_db (id_project);
CREATE INDEX IF NOT EXISTS pm_events_db_id_customer ON pm_events_db (id_customer);
CREATE INDEX IF NOT EXISTS pm_events_db_event_type ON pm_events_db (event_type);
CREATE INDEX IF NOT EXISTS pm_events_db_date ON pm_events_db (date);
CREATE INDEX IF NOT EXISTS pm_events_db_event_state ON pm_events_db (event_state);

-- Seed: datos desde pm_events.json (solo si la tabla está vacía)
INSERT INTO pm_events_db (id_event, id_project, id_customer, event_type, date, event_description, event_state)
SELECT * FROM (VALUES
  ('ev-001', 'proj-001', 'cust-001', 'ask_materials', '2026-03-05'::date, 'Request materials from client for Newsletter banner Q1 2026', 'done'),
  ('ev-002', 'proj-001', 'cust-001', 'send_preview', '2026-03-15'::date, 'Send preview to client - Newsletter banner Q1 2026', 'done'),
  ('ev-003', 'proj-001', 'cust-001', 'publication_date', '2026-03-28'::date, 'Publication date - Newsletter banner Q1 2026', 'done'),
  ('ev-004', 'proj-002', 'cust-001', 'ask_materials', '2026-03-18'::date, 'Request materials from client for Portal article - Warehouse expansion', 'done'),
  ('ev-005', 'proj-002', 'cust-001', 'send_preview', '2026-04-02'::date, 'Send preview to client - Portal article Warehouse expansion', 'done'),
  ('ev-006', 'proj-002', 'cust-001', 'publication_date', '2026-04-15'::date, 'Publication date - Portal article Warehouse expansion', 'done'),
  ('ev-007', 'proj-003', 'cust-001', 'ask_materials', '2026-04-08'::date, 'Request materials from client for Premium profile Cristalería Mediterránea', 'pending'),
  ('ev-008', 'proj-003', 'cust-001', 'send_preview', '2026-04-22'::date, 'Send preview to client - Premium profile Cristalería Mediterránea', 'pending'),
  ('ev-009', 'proj-003', 'cust-001', 'publication_date', '2026-05-06'::date, 'Publication date - Premium profile Cristalería Mediterránea', 'pending'),
  ('ev-010', 'proj-004', 'cust-001', 'ask_materials', '2026-04-20'::date, 'Request materials from client for Magazine ad Glass Today March', 'pending'),
  ('ev-011', 'proj-004', 'cust-001', 'send_preview', '2026-05-04'::date, 'Send preview to client - Anuncio revista Glass Today', 'pending'),
  ('ev-012', 'proj-004', 'cust-001', 'publication_date', '2026-05-20'::date, 'Publication date - Magazine ad Glass Today March', 'pending'),
  ('ev-013', 'proj-005', 'cust-001', 'ask_materials', '2026-05-10'::date, 'Request materials from client for Banner homepage portal', 'pending'),
  ('ev-014', 'proj-005', 'cust-001', 'send_preview', '2026-05-25'::date, 'Send preview to client - Banner homepage portal', 'pending'),
  ('ev-015', 'proj-005', 'cust-001', 'publication_date', '2026-06-08'::date, 'Publication date - Banner homepage portal', 'pending'),
  ('ev-016', 'proj-006', 'cust-001', 'ask_materials', '2026-06-12'::date, 'Request materials from client for Magazine article Glass and Construction', 'pending'),
  ('ev-017', 'proj-006', 'cust-001', 'send_preview', '2026-06-26'::date, 'Send preview to client - Magazine article Glass and Construction', 'pending'),
  ('ev-018', 'proj-006', 'cust-001', 'publication_date', '2026-07-10'::date, 'Publication date - Magazine article Glass and Construction', 'pending'),
  ('ev-019', 'proj-007', 'cust-002', 'ask_materials', '2026-03-10'::date, 'Request materials from client for Newsletter banner Ventilated facade', 'done'),
  ('ev-020', 'proj-007', 'cust-002', 'send_preview', '2026-03-22'::date, 'Send preview to client - Newsletter banner Ventilated facade', 'done'),
  ('ev-021', 'proj-007', 'cust-002', 'publication_date', '2026-04-05'::date, 'Publication date - Newsletter banner Ventilated facade', 'done'),
  ('ev-022', 'proj-008', 'cust-002', 'ask_materials', '2026-03-07'::date, 'Request materials from client for Premium profile Vidrios del Norte', 'done'),
  ('ev-023', 'proj-008', 'cust-002', 'send_preview', '2026-03-21'::date, 'Send preview to client - Premium profile Vidrios del Norte', 'pending'),
  ('ev-024', 'proj-008', 'cust-002', 'publication_date', '2026-04-08'::date, 'Publication date - Premium profile Vidrios del Norte', 'pending'),
  ('ev-025', 'proj-009', 'cust-002', 'ask_materials', '2026-04-22'::date, 'Request materials from client for Portal article Glass installation', 'pending'),
  ('ev-026', 'proj-009', 'cust-002', 'send_preview', '2026-05-06'::date, 'Send preview to client - Portal article Glass installation', 'pending'),
  ('ev-027', 'proj-009', 'cust-002', 'publication_date', '2026-05-22'::date, 'Publication date - Portal article Glass installation', 'pending'),
  ('ev-028', 'proj-010', 'cust-002', 'ask_materials', '2026-03-25'::date, 'Request materials from client for Magazine ad Skylights Today', 'done'),
  ('ev-029', 'proj-010', 'cust-002', 'send_preview', '2026-04-10'::date, 'Send preview to client - Magazine ad Skylights Today', 'done'),
  ('ev-030', 'proj-010', 'cust-002', 'publication_date', '2026-04-25'::date, 'Publication date - Magazine ad Skylights Today', 'done'),
  ('ev-031', 'proj-011', 'cust-002', 'ask_materials', '2026-04-12'::date, 'Request materials from client for Banner lateral portal', 'done'),
  ('ev-032', 'proj-011', 'cust-002', 'send_preview', '2026-04-28'::date, 'Send preview to client - Banner lateral portal', 'done'),
  ('ev-033', 'proj-011', 'cust-002', 'publication_date', '2026-05-12'::date, 'Publication date - Banner lateral portal', 'done'),
  ('ev-034', 'proj-012', 'cust-002', 'ask_materials', '2026-05-18'::date, 'Request materials from client for Newsletter banner Skylights', 'done'),
  ('ev-035', 'proj-012', 'cust-002', 'send_preview', '2026-06-02'::date, 'Send preview to client - Newsletter banner Skylights', 'done'),
  ('ev-036', 'proj-012', 'cust-002', 'publication_date', '2026-06-18'::date, 'Publication date - Newsletter banner Skylights', 'done'),
  ('ev-037', 'proj-013', 'cust-003', 'ask_materials', '2026-03-12'::date, 'Request materials from client for Magazine article Industrial Glass', 'done'),
  ('ev-038', 'proj-013', 'cust-003', 'send_preview', '2026-03-26'::date, 'Send preview to client - Magazine article Industrial Glass', 'done'),
  ('ev-039', 'proj-013', 'cust-003', 'publication_date', '2026-04-10'::date, 'Publication date - Magazine article Industrial Glass', 'done'),
  ('ev-040', 'proj-014', 'cust-003', 'ask_materials', '2026-04-15'::date, 'Request materials from client for Perfil premium Glass Solutions Portugal', 'pending'),
  ('ev-041', 'proj-014', 'cust-003', 'send_preview', '2026-04-30'::date, 'Send preview to client - Perfil premium Glass Solutions Portugal', 'pending'),
  ('ev-042', 'proj-014', 'cust-003', 'publication_date', '2026-05-15'::date, 'Publication date - Perfil premium Glass Solutions Portugal', 'pending'),
  ('ev-043', 'proj-015', 'cust-003', 'ask_materials', '2026-05-08'::date, 'Request materials from client for Newsletter double glazing', 'pending'),
  ('ev-044', 'proj-015', 'cust-003', 'send_preview', '2026-05-24'::date, 'Send preview to client - Newsletter double glazing', 'pending'),
  ('ev-045', 'proj-015', 'cust-003', 'publication_date', '2026-06-08'::date, 'Publication date - Newsletter double glazing', 'pending'),
  ('ev-046', 'proj-016', 'cust-003', 'ask_materials', '2026-03-24'::date, 'Request materials from client for Magazine ad Glass Today May', 'pending'),
  ('ev-047', 'proj-016', 'cust-003', 'send_preview', '2026-04-07'::date, 'Send preview to client - Magazine ad Glass Today May', 'pending'),
  ('ev-048', 'proj-016', 'cust-003', 'publication_date', '2026-04-22'::date, 'Publication date - Magazine ad Glass Today May', 'pending'),
  ('ev-049', 'proj-017', 'cust-003', 'ask_materials', '2026-05-28'::date, 'Request materials from client for Portal article residential', 'pending'),
  ('ev-050', 'proj-017', 'cust-003', 'send_preview', '2026-06-12'::date, 'Send preview to client - Portal article residential', 'pending'),
  ('ev-051', 'proj-017', 'cust-003', 'publication_date', '2026-06-26'::date, 'Publication date - Portal article residential', 'pending'),
  ('ev-052', 'proj-018', 'cust-003', 'ask_materials', '2026-07-04'::date, 'Request materials from client for Portal banner residential installation', 'pending'),
  ('ev-053', 'proj-018', 'cust-003', 'send_preview', '2026-07-18'::date, 'Send preview to client - Portal banner residential installation', 'pending'),
  ('ev-054', 'proj-018', 'cust-003', 'publication_date', '2026-08-01'::date, 'Publication date - Portal banner residential installation', 'pending'),
  ('ev-055', 'proj-019', 'cust-004', 'ask_materials', '2026-03-08'::date, 'Request materials from client for Perfil premium Fenêtres Élégantes', 'done'),
  ('ev-056', 'proj-019', 'cust-004', 'send_preview', '2026-03-18'::date, 'Send preview to client - Perfil premium Fenêtres Élégantes', 'done'),
  ('ev-057', 'proj-019', 'cust-004', 'publication_date', '2026-04-01'::date, 'Publication date - Perfil premium Fenêtres Élégantes', 'done'),
  ('ev-058', 'proj-020', 'cust-004', 'ask_materials', '2026-04-14'::date, 'Request materials from client for Newsletter curtain wall HQ', 'pending'),
  ('ev-059', 'proj-020', 'cust-004', 'send_preview', '2026-04-28'::date, 'Send preview to client - Newsletter curtain wall HQ', 'pending'),
  ('ev-060', 'proj-020', 'cust-004', 'publication_date', '2026-05-12'::date, 'Publication date - Newsletter curtain wall HQ', 'pending'),
  ('ev-061', 'proj-021', 'cust-004', 'ask_materials', '2026-06-10'::date, 'Request materials from client for Magazine article facade HQ', 'pending'),
  ('ev-062', 'proj-021', 'cust-004', 'send_preview', '2026-06-24'::date, 'Send preview to client - Magazine article facade HQ', 'pending'),
  ('ev-063', 'proj-021', 'cust-004', 'publication_date', '2026-07-08'::date, 'Publication date - Magazine article facade HQ', 'pending'),
  ('ev-064', 'proj-022', 'cust-004', 'ask_materials', '2026-03-15'::date, 'Request materials from client for Banner showroom skylights', 'done'),
  ('ev-065', 'proj-022', 'cust-004', 'send_preview', '2026-03-30'::date, 'Send preview to client - Banner showroom skylights', 'done'),
  ('ev-066', 'proj-022', 'cust-004', 'publication_date', '2026-04-18'::date, 'Publication date - Banner showroom skylights', 'done'),
  ('ev-067', 'proj-023', 'cust-004', 'ask_materials', '2026-05-03'::date, 'Request materials from client for Magazine ad Glass Magazine Sep', 'done'),
  ('ev-068', 'proj-023', 'cust-004', 'send_preview', '2026-05-18'::date, 'Send preview to client - Anuncio revista Glass Magazine', 'done'),
  ('ev-069', 'proj-023', 'cust-004', 'publication_date', '2026-06-02'::date, 'Publication date - Magazine ad Glass Magazine Sep', 'done'),
  ('ev-070', 'proj-024', 'cust-004', 'ask_materials', '2026-06-15'::date, 'Request materials from client for Portal article skylights showroom', 'done'),
  ('ev-071', 'proj-024', 'cust-004', 'send_preview', '2026-06-30'::date, 'Send preview to client - Portal article skylights showroom', 'done'),
  ('ev-072', 'proj-024', 'cust-004', 'publication_date', '2026-07-15'::date, 'Publication date - Portal article skylights showroom', 'done')
) AS t(id_event, id_project, id_customer, event_type, date, event_description, event_state)
ON CONFLICT (id_event) DO NOTHING;
