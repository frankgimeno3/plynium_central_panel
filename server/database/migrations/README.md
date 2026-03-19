# Migraciones SQL

Ejecutar en orden numérico (000 es opcional, solo lectura).

| # | Archivo | Descripción |
|---|---------|-------------|
| 000 | id_consistency_audit | Solo lectura: auditar tipos PK/FK (ejecutar a mano) |
| 001 | create_portals_table | Tabla `portals` |
| 002 | shared_extensions_and_functions | pgcrypto, set_updated_at(), get_default_portal_id() |
| 003 | drop_user_portal_preferences | Elimina user_portal_preferences; users.preferences |
| 004 | create_events_table | Tabla `events` |
| 005 | create_companies_table | Tabla `companies` |
| 006 | create_products_table | Tabla `products` |
| 007 | create_article_publications | Tabla `article_publications` |
| 008 | backfill_article_publications | Backfill desde articles |
| 009 | articles_event_columns | articles.is_article_event, event_id |
| 010 | create_event_articles | Tabla puente event_articles + backfill |
| 011 | update_contents_normalize | contents.article_id, position + backfill |
| 012 | update_comments_to_publication | comments.article_publication_id + backfill |
| 013 | create_banners_table | Tabla `banners` (inicial) |
| 014 | create_company_members | Tabla company_members |
| 015 | create_company_portals | Tabla company_portals + backfill |
| 016 | create_product_portals | Tabla product_portals + backfill |
| 017 | create_event_portals | Tabla event_portals + backfill |
| 018 | create_publication_portals | Tabla publication_portals + backfill |
| 019 | banners_multiportal_schema | portal_id, alt, redirect_url, appearance_weight, índices, trigger |
| 020 | users_cognito_linkedin | users.cognito_sub, linkedin_profile |
| 021 | cleanup_legacy_columns_optional | Opcional: DROP columnas legacy (descomentar lo que aplique) |
| 022 | create_mediateca_tables | Tablas folders, media_contents |
| 023 | add_events_id_customer | events.id_customer |
| 024 | create_company_categories | Tabla `company_categories` |
| 025 | create_customers_db | Tabla `customers_db` |
| 026 | create_contacts_db | Tabla `contacts_db` |
| 027 | create_agents_db | Tabla `agents_db` |
| 028 | create_magazines_db | Tablas `magazines_db`, `magazine_issues_db` |
| 029 | create_providers_db | Tablas `providers_db`, `provider_invoices_db` |
| 030 | create_proposals_db | Tabla `proposals_db` |
| 031 | create_contracts_db | Tabla `contracts_db` |
| 032 | create_projects_db | Tabla `projects_db` |
| 033 | create_issued_invoices_and_orders_db | Tablas `issued_invoices_db`, `orders_db` |
| 034 | create_pm_events_db | Tabla `pm_events_db` (eventos PM por project/customer) + seed |
| 035 | create_services_db | Tabla `services_db` (catálogo de servicios) + seed |
| 036 | user_lists_and_users_id | users.id UUID PK; user_lists + user_list_members (listas newsletter); seed listas |
| 037 | create_notifications_db | Tablas `notifications`, `notification_comments`, `notification_company_content` + seed |
| 038 | create_publications_workflow_db | Tablas `planned_publications`, `flatplans`, `publication_slots`, `offered_preferential_pages`, `publication_single_available` + seed |
| 042 | add_magazine_issues_forecasted_publication_month | Columna `forecasted_publication_month` (1-12) en `magazine_issues` |

Todas las migraciones son idempotentes (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS donde aplica).
