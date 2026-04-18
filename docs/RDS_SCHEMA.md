# RDS schema reference (public)

This document is a **read-only reference** of the current Postgres RDS schema (schema `public`) so agents can write correct SQL, migrations, and data mappings.

- **Source of truth**: the RDS instance (not Sequelize models).
- **Format**: `column` · `type` · `null` · `default` (when provided).

---

## agents_db

| column | type | null | default |
|---|---|---:|---|
| agent_id | character varying | NO |  |
| agent_name | character varying | NO |  |
| agent_email | character varying | YES | `''::character varying` |
| agent_created_at | timestamp with time zone | NO | `now()` |
| agent_updated_at | timestamp with time zone | NO | `now()` |

## article_comments

| column | type | null | default |
|---|---|---:|---|
| article_comment_id | character varying | NO |  |
| article_comment_timestamp | timestamp with time zone | NO |  |
| article_comment_user_id | uuid | YES |  |
| article_comment_content | text | NO |  |
| article_portals_id | uuid | NO |  |

## article_contents

| column | type | null | default |
|---|---|---:|---|
| article_content_id | character varying | NO |  |
| article_content_type | USER-DEFINED | NO |  |
| article_content_content | jsonb | NO |  |
| article_created_at | timestamp with time zone | NO |  |
| article_updated_at | timestamp with time zone | NO |  |
| article_id | text | NO |  |
| article_content_position | integer | NO |  |

## article_portals

| column | type | null | default |
|---|---|---:|---|
| article_portals_id | uuid | NO | `gen_random_uuid()` |
| article_id | text | NO |  |
| article_portal_ref_id | integer | NO |  |
| article_slug | text | NO |  |
| article_status | text | NO | `'draft'::text` |
| article_published_at | timestamp with time zone | YES |  |
| article_visibility | text | NO | `'public'::text` |
| article_highlight_position | text | YES |  |
| article_commenting_enabled | boolean | NO | `true` |
| article_created_at | timestamp with time zone | NO | `now()` |
| article_updated_at | timestamp with time zone | NO | `now()` |

## articles_db

| column | type | null | default |
|---|---|---:|---|
| id_article | character varying | NO |  |
| article_title | character varying | NO |  |
| article_subtitle | character varying | YES |  |
| article_main_image_url | character varying | YES |  |
| article_date | timestamp with time zone | NO |  |
| article_created_at | timestamp with time zone | NO |  |
| article_updated_at | timestamp with time zone | NO |  |
| article_highlited_position | text | YES |  |
| is_article_event | boolean | NO | `false` |
| article_event_id | character varying | YES | `''::character varying` |
| article_company_names_array | ARRAY | NO | `ARRAY[]::text[]` |
| article_company_id_array | ARRAY | NO | `ARRAY[]::text[]` |
| topic_ids_array | ARRAY | NO | `ARRAY[]::integer[]` |

## companies_db

| column | type | null | default |
|---|---|---:|---|
| company_id | character varying | NO |  |
| company_commercial_name | character varying | NO |  |
| company_country | character varying | YES | `''::character varying` |
| company_category | character varying | YES | `''::character varying` |
| company_main_description | text | YES | `''::text` |
| company_main_image | character varying | YES | `''::character varying` |
| company_main_telephone | character varying | YES | `''::character varying` |
| company_full_address | character varying | YES | `''::character varying` |
| company_web_link | character varying | YES | `''::character varying` |
| company_created_at | timestamp with time zone | NO |  |
| company_updated_at | timestamp with time zone | NO |  |
| company_employee_relations_array | ARRAY | NO | `'{}'::text[]` |

## company_administrators

| column | type | null | default |
|---|---|---:|---|
| company_administrator_id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | NO |  |
| company_id | character varying | NO |  |
| company_administrator_role_name | character varying | NO | `''::character varying` |
| employee_admission_rights | boolean | NO | `false` |
| employee_deletion_rights | boolean | NO | `false` |
| employee_modification_rights | boolean | NO | `false` |
| base_role_modification_rights | boolean | NO | `false` |
| admin_role_modification_rights | boolean | NO | `false` |
| product_addition_rights | boolean | NO | `false` |
| product_modification_rights | boolean | NO | `false` |
| product_deletion_rights | boolean | NO | `false` |
| base_company_data_modification_rights | boolean | NO | `false` |
| advanced_company_data_modification_rights | boolean | NO | `false` |

## company_categories

| column | type | null | default |
|---|---|---:|---|
| category_id | character varying | NO |  |
| category_name | character varying | NO |  |
| category_description | text | YES | `''::text` |
| category_created_at | timestamp with time zone | NO | `now()` |
| category_updated_at | timestamp with time zone | NO | `now()` |

## company_categories_portal

| column | type | null | default |
|---|---|---:|---|
| category_portal_relation_id | uuid | NO | `gen_random_uuid()` |
| category_id | character varying | NO |  |
| portal_id | integer | NO |  |

## company_portals

| column | type | null | default |
|---|---|---:|---|
| company_id | text | NO |  |
| portal_id | integer | NO |  |
| company_portal_slug | text | NO |  |
| company_portal_created_at | timestamp with time zone | NO | `now()` |
| company_portal_updated_at | timestamp with time zone | NO | `now()` |
| company_portal_id | uuid | NO | `gen_random_uuid()` |

## contact_comments

| column | type | null | default |
|---|---|---:|---|
| contact_comment_id | uuid | NO | `gen_random_uuid()` |
| contact_id | character varying | NO |  |
| agent_id | character varying | YES |  |
| contact_comment_content | text | NO | `''::text` |
| contact_comment_created_at | timestamp with time zone | NO | `now()` |
| contact_comment_updated_at | timestamp with time zone | NO | `now()` |

## contacts_db

| column | type | null | default |
|---|---|---:|---|
| contact_id | character varying | NO |  |
| contact_name | character varying | NO |  |
| contact_role | character varying | YES | `''::character varying` |
| contact_email | character varying | YES | `''::character varying` |
| contact_phone | character varying | YES | `''::character varying` |
| customer_id | character varying | YES | `''::character varying` |
| customer_company_name | character varying | YES | `''::character varying` |
| contact_linkedin_url | character varying | YES | `''::character varying` |
| contact_based_in_country | character varying | YES | `''::character varying` |
| contact_user_id_array | ARRAY | YES | `'{}'::text[]` |
| contact_created_at | timestamp with time zone | NO | `now()` |
| contact_updated_at | timestamp with time zone | NO | `now()` |
| contact_surnames | character varying | YES | `''::character varying` |

## contracts_db

| column | type | null | default |
|---|---|---:|---|
| contract_id | character varying | NO |  |
| proposal_id | character varying | NO |  |
| customer_id | character varying | NO |  |
| agent_id | character varying | YES | `''::character varying` |
| contract_process_state | character varying | NO |  |
| contract_payment_state | character varying | NO |  |
| contract_title | character varying | NO |  |
| contract_amount_eur | numeric | YES | `0` |
| contract_created_at | timestamp with time zone | NO | `now()` |
| contract_updated_at | timestamp with time zone | NO | `now()` |

## customer_comments

| column | type | null | default |
|---|---|---:|---|
| customer_comment_id | uuid | NO | `gen_random_uuid()` |
| customer_id | character varying | NO |  |
| agent_id | character varying | YES |  |
| customer_comment_created_at | timestamp with time zone | NO | `now()` |
| customer_comment_updated_at | timestamp with time zone | NO | `now()` |

## customers_db

| column | type | null | default |
|---|---|---:|---|
| customer_id | character varying | NO |  |
| tags | ARRAY | YES | `'{}'::text[]` |
| related_accounts | ARRAY | YES | `'{}'::text[]` |
| customer_account_name | character varying | NO | `''::character varying` |
| customer_tax_id | character varying | YES | `''::character varying` |
| customer_country | character varying | YES | `''::character varying` |
| customer_full_address | text | YES | `''::text` |
| customer_main_phone | character varying | YES | `''::character varying` |
| customer_main_email | character varying | YES | `''::character varying` |
| customer_website | character varying | YES | `''::character varying` |
| customer_industry | character varying | YES | `''::character varying` |
| customer_agent_id | character varying | YES | `''::character varying` |
| customer_status | character varying | YES | `'active'::character varying` |
| customer_tags | ARRAY | YES | `'{}'::text[]` |
| customer_related_accounts | ARRAY | YES | `'{}'::text[]` |
| customer_company_id_array | ARRAY | YES | `'{}'::text[]` |
| customer_product_id_array | ARRAY | YES | `'{}'::text[]` |
| customer_created_at | timestamp with time zone | NO | `now()` |
| customer_updated_at | timestamp with time zone | NO | `now()` |

## employee_relations

| column | type | null | default |
|---|---|---:|---|
| employee_rel_id | uuid | NO | `gen_random_uuid()` |
| employee_user_id | uuid | NO |  |
| employee_company_id | character varying | NO |  |
| employee_role | character varying | NO | `'employee'::character varying` |
| employee_rel_status | character varying | NO | `'active'::character varying` |
| employee_rel_start_date | date | NO | `CURRENT_DATE` |
| employee_rel_end_date | date | YES |  |

## event_articles

| column | type | null | default |
|---|---|---:|---|
| event_id | text | NO |  |
| article_id | text | NO |  |
| position | integer | YES |  |
| event_updated_at | timestamp with time zone | NO | `now()` |
| event_article_id | uuid | NO | `gen_random_uuid()` |

## event_portals

| column | type | null | default |
|---|---|---:|---|
| event_id | text | NO |  |
| portal_id | integer | NO |  |
| event_portal_slug | text | NO |  |
| event_portal_status | text | NO | `'active'::text` |
| event_created_at | timestamp with time zone | NO | `now()` |
| event_updated_at | timestamp with time zone | NO | `now()` |
| event_portal_id | uuid | NO | `gen_random_uuid()` |

## events

| column | type | null | default |
|---|---|---:|---|
| event_id | character varying | YES |  |
| event_name | character varying | YES |  |
| event_country | character varying | YES |  |
| event_main_description | text | YES |  |
| event_region | character varying | YES |  |
| event_start_date | date | YES |  |
| event_end_date | date | YES |  |
| event_location | character varying | YES |  |
| event_created_at | timestamp with time zone | YES |  |
| event_updated_at | timestamp with time zone | YES |  |
| event_main_image_src | character varying | YES |  |
| customer_id | character varying | YES |  |

## events_db

| column | type | null | default |
|---|---|---:|---|
| event_id | character varying | NO |  |
| event_name | character varying | NO |  |
| event_country | character varying | YES | `''::character varying` |
| event_main_description | text | YES | `''::text` |
| event_region | character varying | YES | `''::character varying` |
| event_start_date | date | NO |  |
| event_end_date | date | NO |  |
| event_location | character varying | YES | `''::character varying` |
| event_created_at | timestamp with time zone | NO |  |
| event_updated_at | timestamp with time zone | NO |  |
| event_main_image_src | character varying | YES | `''::character varying` |
| customer_id | character varying | YES | `NULL::character varying` |

## issued_invoices_db

| column | type | null | default |
|---|---|---:|---|
| invoice_id | character varying | NO |  |
| contract_id | character varying | YES |  |
| customer_id | character varying | NO |  |
| customer_company | character varying | NO |  |
| agent_id | character varying | YES | `''::character varying` |
| invoice_amount_eur | numeric | NO | `0` |
| invoice_issue_date | date | NO |  |
| invoice_state | character varying | YES | `''::character varying` |
| invoice_created_at | timestamp with time zone | NO | `now()` |
| invoice_updated_at | timestamp with time zone | NO | `now()` |
| invoice_payment_date | date | YES |  |

## magazines

| column | type | null | default |
|---|---|---:|---|
| id_magazine | character varying | YES |  |
| name | character varying | YES |  |
| description | text | YES |  |
| first_year | integer | YES |  |
| last_year | integer | YES |  |
| notes | text | YES |  |
| portal_name | character varying | YES |  |

## magazines_db

| column | type | null | default |
|---|---|---:|---|
| magazine_id | character varying | NO |  |
| magazine_name | character varying | NO |  |
| magazine_description | text | YES | `''::text` |
| magazine_starting_year | integer | YES |  |
| magazine_periodicity | character varying | NO | `''::character varying` |
| magazine_subscriber_number | integer | YES |  |

## mediateca_folders

| column | type | null | default |
|---|---|---:|---|
| mediateca_folder_id | uuid | NO | `gen_random_uuid()` |
| mediateca_folder_name | character varying | NO |  |
| mediateca_parent_folder_id | uuid | YES |  |
| mediateca_folder_created_at | timestamp with time zone | YES | `now()` |
| mediateca_folder_updated_at | timestamp with time zone | YES | `now()` |

## mediateca_media_contents

| column | type | null | default |
|---|---|---:|---|
| mediateca_content_id | uuid | NO | `gen_random_uuid()` |
| mediateca_folder_id | uuid | YES |  |
| mediateca_content_name | character varying | NO |  |
| mediateca_s3_key | text | NO |  |
| mediateca_content_src | text | YES |  |
| content_mime_type | character varying | YES |  |
| mediateca_content_type | USER-DEFINED | NO |  |
| mediateca_content_created_at | timestamp with time zone | YES | `now()` |
| mediateca_content_updated_at | timestamp with time zone | YES | `now()` |

## newsletter_campaigns

| column | type | null | default |
|---|---|---:|---|
| newsletter_campaign_id | character varying | NO |  |
| newsletter_campaign_name | character varying | NO |  |
| newsletter_campaign_description | text | YES | `''::text` |
| content_theme | character varying | YES | `''::character varying` |
| newsletter_campaign_publication_frequency | character varying | NO |  |
| newsletter_campaign_start_date | date | YES |  |
| newsletter_campaign_end_date | date | YES |  |
| newsletter_campaign_status | character varying | NO | `'draft'::character varying` |
| newsletter_campaign_created_at | timestamp with time zone | NO | `now()` |
| newsletter_campaign_updated_at | timestamp with time zone | NO | `now()` |
| portal_id | integer | NO |  |
| newsletter_campaign | text | YES | `''::text` |
| newsletter_campaign_planned_publication_dates_array | ARRAY | NO | `'{}'::date[]` |

## newsletter_content_blocks

| column | type | null | default |
|---|---|---:|---|
| newsletter_block_id | character varying | NO |  |
| newsletter_id | character varying | NO |  |
| newsletter_block_type | character varying | NO |  |
| newsletter_block_position | integer | NO | `0` |
| newsletter_block_content | jsonb | NO | `'{}'::jsonb` |
| newsletter_block_created_at | timestamp with time zone | NO | `now()` |
| newsletter_block_updated_at | timestamp with time zone | NO | `now()` |

## newsletter_user_lists

| column | type | null | default |
|---|---|---:|---|
| newsletter_user_list_id | uuid | NO | `gen_random_uuid()` |
| newsletter_user_list_name | character varying | YES |  |
| newsletter_user_list_topic | character varying | YES |  |
| newsletter_user_list_created_at | timestamp with time zone | NO | `now()` |
| newsletter_user_list_description | text | YES | `''::text` |
| user_list_portal | integer | YES | FK to `portals_db.portal_id` (migration 078) |

Membership is stored in **`user_list_subscriptions`** (not on this table). Migration `080_user_list_subscriptions.sql` removed `list_user_ids_array` if it existed.

## user_list_subscriptions

| column | type | null | default |
|---|---|---:|---|
| user_list_subscription_id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | NO | FK → `users_db.user_id` |
| newsletter_user_list_id | uuid | NO | FK → `newsletter_user_lists.newsletter_user_list_id` |
| created_at | timestamp with time zone | NO | `now()` |

Unique `(user_id, newsletter_user_list_id)`. Replaces the former `newsletter_user_lists.list_user_ids_array` array.

## newsletters_db

| column | type | null | default |
|---|---|---:|---|
| newsletter_id | character varying | NO |  |
| newsletter_campaign_id | character varying | NO |  |
| newsletter_estimated_publication_date | date | YES |  |
| newsletter_topic | character varying | YES | `''::character varying` |
| newsletter_status | character varying | NO | `'pending'::character varying` |
| newsletter_created_at | timestamp with time zone | NO | `now()` |
| newsletter_updated_at | timestamp with time zone | NO | `now()` |
| newsletter_real_publication_date | date | YES |  |
| portal_id | integer | NO |  |
| newsletter_user_list_id_array | ARRAY | YES |  |

## offered_preferential_pages

| column | type | null | default |
|---|---|---:|---|
| offered_page_type | character varying | NO |  |
| offered_slot_key | character varying | NO |  |
| offered_page_id | uuid | NO |  |
| publication_id | character varying | YES |  |
| agent_id | character varying | YES |  |
| customer_id | character varying | YES |  |
| proposal_id | character varying | YES |  |
| offered_page_proposal_date | date | YES |  |
| publication_slot_id | integer | YES |  |

## orders_db

| column | type | null | default |
|---|---|---:|---|
| order_id | character varying | NO |  |
| invoice_id | character varying | NO |  |
| contract_id | character varying | YES |  |
| customer_id | character varying | YES |  |
| customer_company_name | character varying | YES |  |
| agent_id | character varying | YES |  |
| order_payment_status | character varying | NO |  |
| order_total_amount_eur | numeric | NO | `0` |
| order_created_at | timestamp with time zone | NO | `now()` |
| order_updated_at | timestamp with time zone | NO | `now()` |

## panel_ticket_comments

| column | type | null | default |
|---|---|---:|---|
| panel_ticket_comment_id | integer | NO | `nextval('panel_ticket_comments_panel_ticket_comment_id_seq'::regclass)` |
| panel_ticket_id | character varying | NO |  |
| panel_ticket_comment_date | timestamp with time zone | NO | `now()` |
| panel_ticket_comment_content | text | NO |  |
| agent_id | character varying | YES |  |

## panel_ticket_company_data

| column | type | null | default |
|---|---|---:|---|
| ticket_company_data_id | integer | NO | `nextval('panel_ticket_company_data_ticket_company_data_id_seq'::regclass)` |
| ticket_id | character varying | NO |  |
| ticket_company_name | character varying | NO | `''::character varying` |
| ticket_company_tax_name | character varying | NO | `''::character varying` |
| ticket_company_tax_id | character varying | NO | `''::character varying` |
| ticket_company_creator_role | character varying | NO | `''::character varying` |
| ticket_company_website | character varying | YES | `''::character varying` |
| ticket_company_country | character varying | YES | `''::character varying` |
| ticket_company_description | text | YES | `''::text` |

## panel_tickets

| column | type | null | default |
|---|---|---:|---|
| panel_ticket_id | character varying | NO |  |
| panel_ticket_type | character varying | NO |  |
| panel_ticket_category | character varying | YES | `NULL::character varying` |
| panel_ticket_state | character varying | NO | `'pending'::character varying` |
| panel_ticket_date | timestamp with time zone | YES |  |
| panel_ticket_brief_description | text | NO | `''::text` |
| panel_ticket_full_description | text | NO | `''::text` |
| panel_ticket_created_at | timestamp with time zone | NO | `now()` |
| panel_ticket_related_to_user_id_array | ARRAY | NO | `'{}'::text[]` |
| panel_ticket_updates_array | jsonb | NO | `'[]'::jsonb` |

## payments_db

| column | type | null | default |
|---|---|---:|---|
| payment_id | character varying | NO |  |
| provider_id | character varying | YES |  |
| payment_provider_name | character varying | YES | `''::character varying` |
| payment_label | character varying | NO | `''::character varying` |
| payment_reference | character varying | YES | `''::character varying` |
| payment_expected_amount_eur | numeric | NO | `0` |
| payment_expected_date | date | NO |  |
| payment_created_at | timestamp with time zone | NO | `now()` |
| payment_updated_at | timestamp with time zone | NO | `now()` |
| payment_real_amount_eur | numeric | YES |  |
| payment_real_date | date | YES |  |

## pm_events_db

| column | type | null | default |
|---|---|---:|---|
| pm_event_id | character varying | NO |  |
| project_id | character varying | NO |  |
| customer_id | character varying | NO |  |
| pm_event_type | character varying | NO |  |
| pm_event_date | date | NO |  |
| pm_event_description | text | NO | `''::text` |
| pm_event_state | character varying | NO | `'pending'::character varying` |
| pm_event_created_at | timestamp with time zone | NO | `now()` |
| pm_event_updated_at | timestamp with time zone | NO | `now()` |

## portal_banners

| column | type | null | default |
|---|---|---:|---|
| id_banner | character varying | NO |  |
| banner_image_src | character varying | NO |  |
| banner_route | character varying | NO | `'/'::character varying` |
| banner_redirection_url | character varying | NO | `'https://www.vidrioperfil.com'::character varying` |
| banner_position_type | USER-DEFINED | NO |  |
| banner_page_type | USER-DEFINED | NO |  |
| banner_created_at | timestamp with time zone | NO |  |
| banner_updated_at | timestamp with time zone | NO |  |
| portal_id | integer | NO |  |
| alt | text | YES |  |
| starts_at | timestamp with time zone | YES |  |
| ends_at | timestamp with time zone | YES |  |
| position | integer | NO | `0` |
| banner_appearence_weight | integer | NO | `2` |
| banner_starting_date | date | NO | `CURRENT_DATE` |
| banner_ending_date | date | NO | `((CURRENT_DATE + '1 year'::interval))::date` |
| banner_position | integer | NO | `0` |
| banner_status | character varying | NO | `'published'::character varying` |

## portals_db

| column | type | null | default |
|---|---|---:|---|
| portal_id | integer | NO | `nextval('portals_id_seq'::regclass)` |
| portal_name_key | character varying | NO |  |
| portal_name | character varying | NO |  |
| portal_domain | character varying | NO | `''::character varying` |
| portal_default_locale | character varying | NO | `'es'::character varying` |
| portal_theme | character varying | NO | `''::character varying` |
| portal_created_at | timestamp with time zone | YES | `now()` |
| magazine_id_array | ARRAY | YES | `(ARRAY[]::character varying[])::character varying(255)[]` |

## portals_id

| column | type | null | default |
|---|---|---:|---|
| portal_id | integer | YES |  |
| portal_name_key | character varying | YES |  |
| portal_name | character varying | YES |  |
| portal_domain | character varying | YES |  |
| portal_default_locale | character varying | YES |  |
| portal_theme | character varying | YES |  |
| portal_created_at | timestamp with time zone | YES |  |

## product_portals

| column | type | null | default |
|---|---|---:|---|
| product_id | text | NO |  |
| portal_id | integer | NO |  |
| product_slug | text | NO |  |
| product_status | text | NO | `'active'::text` |
| product_created_at | timestamp with time zone | NO | `now()` |
| product_updated_at | timestamp with time zone | NO | `now()` |
| product_portal_id | uuid | YES | `gen_random_uuid()` |

## products_db

| column | type | null | default |
|---|---|---:|---|
| product_id | character varying | NO |  |
| product_name | character varying | NO |  |
| product_price | numeric | NO | `0` |
| company_id | character varying | YES | `''::character varying` |
| product_description | text | YES | `''::text` |
| product_main_image_src | character varying | YES | `''::character varying` |
| product_categories_array | ARRAY | YES | `(ARRAY[]::character varying[])::character varying(255)[]` |
| product_created_at | timestamp with time zone | NO |  |
| product_updated_at | timestamp with time zone | NO |  |

## projects_db

| column | type | null | default |
|---|---|---:|---|
| project_id | character varying | NO |  |
| contract_id | character varying | NO |  |
| project_title | character varying | NO |  |
| project_status | character varying | NO |  |
| service_id | character varying | NO |  |
| project_publication_date | date | YES |  |
| publication_id | character varying | YES |  |
| pm_events_id_array | ARRAY | YES | `'{}'::text[]` |
| project_created_at | timestamp with time zone | NO | `now()` |
| project_updated_at | timestamp with time zone | NO | `now()` |

## proposal_payments

| column | type | null | default |
|---|---|---:|---|
| proposal_payment_id | uuid | NO | `gen_random_uuid()` |
| proposal_id | character varying | NO |  |
| proposal_payment_amount | numeric | NO | `0` |
| proposal_payment_date | date | YES |  |

## proposal_service_lines

| column | type | null | default |
|---|---|---:|---|
| proposal_service_line_id | uuid | NO | `gen_random_uuid()` |
| proposal_id | character varying | NO |  |
| service_id | character varying | NO | `''::character varying` |
| proposal_service_custom_name | character varying | NO | `''::character varying` |
| proposal_service_discount | numeric | NO | `0` |
| proposal_service_publication_date | date | YES |  |
| proposal_service_unit_details | text | NO | `''::text` |

## proposals_db

| column | type | null | default |
|---|---|---:|---|
| proposal_id | character varying | NO |  |
| customer_id | character varying | NO |  |
| contact_id | character varying | YES | `''::character varying` |
| additional_contact_ids_array | ARRAY | YES | `'{}'::text[]` |
| agent_id | character varying | YES | `''::character varying` |
| proposal_status | character varying | NO |  |
| proposal_tittle | character varying | NO |  |
| proposal_ammount_eur | numeric | YES | `0` |
| proposal_date | date | YES |  |
| proposal_creation_date | date | YES |  |
| proposal_expiration_date | date | YES |  |
| proposal_general_discount | numeric | YES | `0` |
| is_proposal_exchange | boolean | YES | `false` |
| exchange_has_final_price | boolean | YES | `false` |
| exchange_final_price | numeric | YES | `0` |
| exchange_has_bank_transfers | boolean | YES | `false` |
| proposal_created_at | timestamp with time zone | NO | `now()` |
| proposal_updated_at | timestamp with time zone | NO | `now()` |
| exchange_plynium_transfers_array | ARRAY | NO | `'{}'::text[]` |
| exchange_counterpart_transfers_array | ARRAY | NO | `'{}'::text[]` |

## provider_invoices_db

| column | type | null | default |
|---|---|---:|---|
| provider_invoice_id | character varying | NO |  |
| provider_id | character varying | NO |  |
| provider_company_name | character varying | NO |  |
| invoice_amount_eur | numeric | NO | `0` |
| invoice_payment_date | date | NO |  |
| invoice_created_at | timestamp with time zone | NO | `now()` |
| invoice_updated_at | timestamp with time zone | NO | `now()` |
| invoice_issue_date | date | NO |  |
| invoice_provider_reference_number | character varying | NO | `''::character varying` |

## providers_db

| column | type | null | default |
|---|---|---:|---|
| provider_id | character varying | NO |  |
| provider_company_name | character varying | NO |  |
| provider_contact_email | character varying | YES | `''::character varying` |
| provider_contact_phone | character varying | YES | `''::character varying` |
| provider_full_address | text | YES | `''::text` |
| provider_tax_id | character varying | YES | `''::character varying` |
| provider_notes | text | YES | `''::text` |
| provider_created_at | timestamp with time zone | NO | `now()` |
| provider_updated_at | timestamp with time zone | NO | `now()` |

## publication_slot_content

| column | type | null | default |
|---|---|---:|---|
| publication_slot_content_id | integer | NO |  |
| publication_id | character varying | NO |  |
| publication_slot_id | integer | NO |  |
| publication_slot_position | integer | NO | `0` |
| slot_content_format | character varying | NO | `''::character varying` |
| slot_content_object_array | jsonb | NO | `'[]'::jsonb` |

## publication_slots_db

| column | type | null | default |
|---|---|---:|---|
| publication_slot_id | integer | NO |  |
| publication_id | character varying | YES |  |
| publication_format | character varying | NO | `'flipbook'::character varying` |
| slot_key | character varying | NO |  |
| slot_content_type | character varying | NO |  |
| slot_state | character varying | NO | `'pending'::character varying` |
| customer_id | character varying | YES |  |
| project_id | character varying | YES |  |
| slot_media_url | character varying | YES |  |
| slot_article_id | character varying | YES |  |
| slot_created_at | timestamp with time zone | NO | `now()` |
| slot_updated_at | timestamp with time zone | NO | `now()` |

## publications

| column | type | null | default |
|---|---|---:|---|
| publication_id | character varying | YES |  |
| publication_main_image_url | character varying | YES |  |
| magazine_id | character varying | YES |  |
| publication_year | integer | YES |  |
| publication_edition_name | character varying | YES |  |
| magazine_general_issue_number | integer | YES |  |
| magazine_this_year_issue | integer | YES |  |
| publication_expected_publication_month | smallint | YES |  |
| real_publication_month_date | date | YES |  |
| publication_materials_deadline | date | YES |  |
| is_special_edition | boolean | YES |  |
| publication_theme | character varying | YES |  |
| publication_status | character varying | YES |  |
| publication_format | character varying | YES |  |

## publications_db

| column | type | null | default |
|---|---|---:|---|
| publication_id | character varying | NO |  |
| publication_main_image_url | character varying | YES |  |
| magazine_id | character varying | YES |  |
| publication_year | integer | YES |  |
| publication_edition_name | character varying | YES | `''::character varying` |
| magazine_general_issue_number | integer | YES |  |
| magazine_this_year_issue | integer | YES |  |
| publication_expected_publication_month | smallint | YES |  |
| real_publication_month_date | date | YES |  |
| publication_materials_deadline | date | YES |  |
| is_special_edition | boolean | NO | `false` |
| publication_theme | character varying | YES | `''::character varying` |
| publication_status | character varying | NO | `'draft'::character varying` |
| publication_format | character varying | NO | `'flipbook'::character varying` |

## revenues_db

| column | type | null | default |
|---|---|---:|---|
| id | character varying | NO |  |
| id_customer | character varying | YES |  |
| customer_name | character varying | YES | `''::character varying` |
| label | character varying | NO | `''::character varying` |
| reference | character varying | YES | `''::character varying` |
| amount_eur | numeric | NO | `0` |
| revenue_date | date | NO |  |
| created_at | timestamp with time zone | NO | `now()` |
| updated_at | timestamp with time zone | NO | `now()` |
| revenue_real_amount_eur | numeric | YES |  |

## services_db

| column | type | null | default |
|---|---|---:|---|
| service_id | character varying | NO |  |
| service_full_name | character varying | NO |  |
| service_channel | character varying | NO | `''::character varying` |
| service_description | text | NO | `''::text` |
| service_unit_price | numeric | NO | `0` |
| service_unit | character varying | NO | `''::character varying` |
| service_unit_specifications | text | NO | `''::text` |
| service_product | character varying | NO | `''::character varying` |
| service_format | character varying | NO | `''::character varying` |

## topics_db

| column | type | null | default |
|---|---|---:|---|
| topic_id | integer | NO | identity |
| topic_name | character varying | NO |  |
| topic_description | text | NO | `''::text` |
| topic_created_at | timestamp with time zone | NO | `now()` |
| topic_updated_at | timestamp with time zone | NO | `now()` |

Note: topics are associated to portals via `topic_portals` (bridge table).

## topic_portals

| column | type | null | default |
|---|---|---:|---|
| topic_id | integer | NO |  |
| portal_id | integer | NO |  |
| topic_portal_created_at | timestamp with time zone | NO | `now()` |

FK: `topic_id` → `topics_db.topic_id`; `portal_id` → `portals_db.portal_id`.  
PK `(topic_id, portal_id)`.

## user_feed_preferences

| column | type | null | default |
|---|---|---:|---|
| user_feed_preference_id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | NO |  |
| topic_id | integer | NO |  |
| preference_state | character varying | NO | `'neutral'::character varying` |

FK: `user_id` → `users_db.user_id`; `topic_id` → `topics_db.topic_id`.  
UNIQUE `(user_id, topic_id)`.  
CHECK: `preference_state` ∈ `neutral`, `not interested`, `very interested`.

## user_notifications

| column | type | null | default |
|---|---|---:|---|
| user_notification_id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | NO |  |
| notification_type | character varying | NO | `''::character varying` |
| notification_content | text | NO | `''::text` |
| notification_date | timestamp with time zone | NO | `now()` |
| notification_status | character varying | NO | `'pending'::character varying` |
| notification_redirection | character varying | YES | `''::character varying` |

## users_db

| column | type | null | default |
|---|---|---:|---|
| user_id | uuid | NO |  |
| user_email | character varying | NO |  |
| user_name | character varying | YES |  |
| user_surnames | character varying | YES |  |
| user_description | text | YES |  |
| user_main_image_src | character varying | YES |  |
| user_preferences | jsonb | YES |  |
| user_cognito_sub | character varying | YES |  |
| user_linkedin_profile | character varying | YES |  |
| user_employee_relations_array | ARRAY | NO | `'{}'::text[]` |
| newsletter_user_lists_id_array | ARRAY | NO | `'{}'::uuid[]` |

