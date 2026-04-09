# Migraciones SQL

Fuente canónica del esquema RDS compartido por **plynium_central_panel** y portales (p. ej. **portals/glassinformer**): no duplicar DDL en los portales; aplicar aquí y desplegar contra la misma base.

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
| 014 | create_company_members | (LEGACY) Tabla `company_members` (no usar; reemplazada por `employee_relations`) |
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
| 047 | rename_agents_db_columns | Columnas `agents_db` con prefijo `agent_` |
| 048 | migrate_users_to_users_db | Tabla `users` → `users_db`; columnas `user_*`; `user_id` PK primera columna; `id_user` → `user_email` |
| 049 | articles_db_article_portals_schema | `articles` → `articles_db`; `article_publications` → `article_portals`; prefijo `article_`; `canonical_url` eliminado; companies como arrays; sin `portal_id` en artículo |
| 050 | articles_db_is_article_event_column_name | Columna boolean `is_article_event` (sin prefijo `article_`) en `articles_db` |
| 051 | drop_articles_db_portal_id | `DROP COLUMN portal_id` en `articles` / `articles_db` (portales en `article_portals`) |
| 052 | article_portals_pk_article_portals_id | PK `article_portals`: `id` / `article_portal_id` → `article_portals_id`; FK `comments` |
| 053 | article_comments_table | `comments` → `article_comments`; columnas `article_comment_*`; `article_portals_id`; `user_id` desde `users_db` por email; un solo timestamp |
| 054 | banners_db_schema | `banners` → `portal_banners_db`; columnas `banner_*`; `banner_status`; fechas DATE; peso entero; sin `redirect_url` |
| 055 | banners_db_to_portal_banners_db | Renombra `banners_db` → `portal_banners_db` si quedó el nombre antiguo tras 054 |
| 056 | article_contents_rename_and_schema | `contents` → `article_contents`; columnas `article_content_*`; timestamps `article_created_at/article_updated_at`; índice (article_id, article_content_position) |
| 057 | portal_banners_table | `portal_banners_db`/`banners` → `portal_banners`; columnas finales `id_banner`, `banner_*`, `portal_id`, fechas `banner_starting_date/banner_ending_date`, `banner_appearence_weight`, `banner_position`; drop `redirect_url` |
| 058 | companies_db_schema | `companies` → `companies_db`; columnas `company_*` (commercial_name/country/category/main_* etc); drop arrays/email legacy; add `company_employee_relations_array` |
| 059 | create_employee_relations | Tabla `employee_relations` (user↔company): `employee_rel_*`, `employee_role`, `employee_rel_status`, start/end dates |
| 060 | company_categories_portals_schema | company_categories: columnas `category_*`, drop `portals_array`; tabla puente `company_categories_portal` (category_id, portal_id) + backfill |
| 061 | drop_company_members | (LEGACY cleanup) Elimina tabla `company_members` (reemplazada por `employee_relations`) |
| 062 | users_employee_relations_array | users_db: añade `user_employee_relations_array` (paralelo a companies_db.company_employee_relations_array) |
| 063 | products_db_schema | `products` → `products_db`; columnas `product_*` (excepto `company_id`) + índices |
| 064 | product_portals_pk_and_prefix | product_portals: PK `product_portal_id` + prefijos `product_*` (slug/status/created/updated) + unicidad |
| 065 | bootstrap_core_schema | (BOOTSTRAP) Crea el esquema final core en una RDS nueva (portals/users_db/companies_db/products_db/*_portals/employee_relations/company_categories/portal_banners) |
| 066 | company_portals_schema | `company_portals`: PK `company_portal_id` (UUID); `company_id`+`portal_id` UNIQUE; columnas `company_portal_*`; elimina `status` |
| 067 | contacts_db_contact_comments | `contacts_db`: columnas `contact_*` + `contact_user_id_array`; elimina `comments`; crea `contact_comments` |
| 068 | events_portals_articles_schema | `events`: `event_*` + `customer_id`, PK `event_id`; `event_portals`/`event_articles` con PK UUID y columnas `event_*` |
| 069 | issued_invoices_db_schema | `issued_invoices_db`: `contract_id`, `customer_id`, `customer_company`, `agent_id`, `invoice_*`; elimina `contract_code` (merge) |
| 070 | provider_invoices_db_schema | `provider_invoices_db`: PK `provider_invoice_id`, `provider_id`, `invoice_*`, `provider_company_name`; elimina `label` |
| 071 | issued_invoices_invoice_payment_date | `issued_invoices_db`: columna `invoice_payment_date` (backfill desde `invoice_issue_date`) |

Todas las migraciones son idempotentes (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS donde aplica).
