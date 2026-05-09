-- 027_publication_slots_db_default_slot_content_type_advert.sql
-- Backfill: align every existing row in publication_slots_db so its
-- slot_content_type is the canonical default 'advert'. The panel UI now
-- restricts slot_content_type to: advert | article | summary | index,
-- with 'advert' as the default for newly created flatplan slots.

BEGIN;

UPDATE public.publication_slots_db
   SET slot_content_type = 'advert',
       slot_updated_at = now()
 WHERE slot_content_type IS DISTINCT FROM 'advert';

COMMIT;
