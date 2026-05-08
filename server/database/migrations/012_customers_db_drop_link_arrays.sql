-- Company/product links moved to customer_company_relations and products_db (by company)
ALTER TABLE IF EXISTS public.customers_db
  DROP COLUMN IF EXISTS customer_company_id_array,
  DROP COLUMN IF EXISTS customer_product_id_array;
