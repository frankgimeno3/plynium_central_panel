-- 098_drop_publication_portals.sql
-- Remove junction table publication_portals (portal linkage lives on publications_db.portal).

DROP TABLE IF EXISTS public.publication_portals;
