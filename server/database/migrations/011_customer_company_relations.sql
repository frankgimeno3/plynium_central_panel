-- Many-to-many: customers_db ↔ companies_db (directory companies linked to CRM customer accounts)
CREATE TABLE IF NOT EXISTS public.customer_company_relations (
  customer_company_relation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id character varying(255) NOT NULL,
  company_id character varying(255) NOT NULL,
  CONSTRAINT customer_company_relations_pkey PRIMARY KEY (customer_company_relation_id),
  CONSTRAINT customer_company_relations_customer_fk
    FOREIGN KEY (customer_id) REFERENCES public.customers_db (customer_id) ON DELETE CASCADE,
  CONSTRAINT customer_company_relations_company_fk
    FOREIGN KEY (company_id) REFERENCES public.companies_db (company_id) ON DELETE CASCADE,
  CONSTRAINT customer_company_relations_customer_company_uniq UNIQUE (customer_id, company_id)
);

CREATE INDEX IF NOT EXISTS customer_company_relations_customer_idx
  ON public.customer_company_relations (customer_id);
CREATE INDEX IF NOT EXISTS customer_company_relations_company_idx
  ON public.customer_company_relations (company_id);
