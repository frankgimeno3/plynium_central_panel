-- 000_id_consistency_audit.sql
-- SOLO LECTURA: no modifica datos ni esquema. Ejecutar a mano para auditar tipos PK/FK.
-- Canon: ver 065_bootstrap_core_schema.sql. Este audit valida:
-- - tablas faltantes vs canon
-- - tablas extra (legacy / no canon)
-- - mismatches FK/PK por tipo

-- ========== 0) Tablas esperadas vs reales ==========
WITH expected(table_name) AS (
  VALUES
    ('portals_id'),
    ('users_db'),
    ('companies_db'),
    ('products_db'),
    ('company_portals'),
    ('product_portals'),
    ('employee_relations'),
    ('company_administrators'),
    ('company_categories'),
    ('company_categories_portal'),
    ('portal_banners'),
    ('articles_db'),
    ('article_portals'),
    ('article_contents'),
    ('article_comments'),
    ('events'),
    ('event_portals'),
    ('event_articles'),
    ('publications_db'),
    ('mediateca_folders'),
    ('mediateca_media_contents'),
    ('customers_db'),
    ('contacts_db'),
    ('agents_db'),
    ('magazines_db'),
    ('providers_db'),
    ('provider_invoices_db'),
    ('proposals_db'),
    ('proposal_service_lines'),
    ('proposal_payments'),
    ('contracts_db'),
    ('projects_db'),
    ('pm_events_db'),
    ('issued_invoices_db'),
    ('orders_db'),
    ('services_db'),
    ('panel_tickets'),
    ('panel_ticket_comments'),
    ('panel_ticket_company_data'),
    ('user_notifications'),
    ('publication_slots_db'),
    ('publication_slot_content'),
    ('offered_preferential_pages'),
    ('newsletter_campaigns'),
    ('newsletters_db'),
    ('newsletter_content_blocks'),
    ('revenues_db'),
    ('payments_db'),
    ('newsletter_user_lists'),
    ('user_list_subscriptions')
),
actual AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema='public' AND table_type='BASE TABLE'
),
missing AS (
  SELECT e.table_name FROM expected e
  LEFT JOIN actual a ON a.table_name = e.table_name
  WHERE a.table_name IS NULL
),
extra AS (
  SELECT a.table_name FROM actual a
  LEFT JOIN expected e ON e.table_name = a.table_name
  WHERE e.table_name IS NULL
)
SELECT 'MISSING' AS status, table_name FROM missing
UNION ALL
SELECT 'EXTRA' AS status, table_name FROM extra
ORDER BY status, table_name;

-- ========== 2) FKs: tipo de columna FK vs tipo de PK referenciada ==========
SELECT
    tc.table_schema AS fk_table_schema,
    tc.table_name AS fk_table,
    kcu.column_name AS fk_column,
    ccu.table_name AS ref_table,
    ccu.column_name AS ref_column,
    ac_fk.data_type AS fk_data_type,
    ac_ref.data_type AS ref_data_type,
    CASE WHEN ac_fk.data_type IS DISTINCT FROM ac_ref.data_type THEN 'MISMATCH' ELSE 'OK' END AS type_match
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.constraint_schema
JOIN information_schema.columns ac_fk
    ON ac_fk.table_schema = kcu.table_schema AND ac_fk.table_name = kcu.table_name AND ac_fk.column_name = kcu.column_name
JOIN information_schema.columns ac_ref
    ON ac_ref.table_schema = ccu.table_schema AND ac_ref.table_name = ccu.table_name AND ac_ref.column_name = ccu.column_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ========== 3) UUID donde se espera TEXT (inspección general) ==========
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'uuid'
ORDER BY table_name, column_name;
