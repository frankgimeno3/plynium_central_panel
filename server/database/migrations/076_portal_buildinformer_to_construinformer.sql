-- 076_portal_buildinformer_to_construinformer.sql
-- Replaces the BuildInformer / buildinformer.com portal row with Construinformer / construinformer.com, locale en.
-- Uses UPDATE (keeps portal_id) so FKs from company_portals, article_portals, etc. stay valid.

UPDATE public.portals_id
SET
  portal_name = 'Construinformer',
  portal_name_key = 'construinformer',
  portal_domain = 'construinformer.com',
  portal_default_locale = 'en',
  portal_theme = COALESCE(portal_theme, ''::character varying)
WHERE portal_id = 25
   OR portal_domain = 'buildinformer.com'
   OR LOWER(TRIM(portal_name_key)) IN ('buildinformer', 'buildinformer.com');
