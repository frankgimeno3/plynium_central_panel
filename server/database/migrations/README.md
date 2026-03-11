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

Todas las migraciones son idempotentes (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS donde aplica).
