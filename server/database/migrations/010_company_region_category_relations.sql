  -- Rename geographic column on companies_db (was overloaded with business category names).
  ALTER TABLE IF EXISTS public.companies_db
    RENAME COLUMN company_category TO company_region;

  DROP INDEX IF EXISTS public.companies_db_category_idx;
  CREATE INDEX IF NOT EXISTS companies_db_region_idx ON public.companies_db (company_region);

  -- Many-to-many: published companies ↔ business rows in company_categories
  CREATE TABLE IF NOT EXISTS public.company_category_relations (
    category_relation_id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id character varying(255) NOT NULL,
    category_id character varying(32) NOT NULL,
    CONSTRAINT company_category_relations_pkey PRIMARY KEY (category_relation_id),
    CONSTRAINT company_category_relations_company_fk
      FOREIGN KEY (company_id) REFERENCES public.companies_db (company_id) ON DELETE CASCADE,
    CONSTRAINT company_category_relations_category_fk
      FOREIGN KEY (category_id) REFERENCES public.company_categories (category_id) ON DELETE CASCADE,
    CONSTRAINT company_category_relations_company_category_uniq UNIQUE (company_id, category_id)
  );

  CREATE INDEX IF NOT EXISTS company_category_relations_company_idx
    ON public.company_category_relations (company_id);
  CREATE INDEX IF NOT EXISTS company_category_relations_category_idx
    ON public.company_category_relations (category_id);
