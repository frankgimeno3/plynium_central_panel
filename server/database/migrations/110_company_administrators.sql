-- 110_company_administrators.sql
-- Administradores de empresa: permisos por usuario y compañía.

CREATE TABLE IF NOT EXISTS public.company_administrators (
  company_administrator_id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users_db (user_id) ON DELETE CASCADE,
  company_id VARCHAR(255) NOT NULL REFERENCES public.companies_db (company_id) ON DELETE CASCADE,
  company_administrator_role_name VARCHAR(255) NOT NULL DEFAULT ''::character varying,
  employee_admission_rights BOOLEAN NOT NULL DEFAULT FALSE,
  employee_deletion_rights BOOLEAN NOT NULL DEFAULT FALSE,
  employee_modification_rights BOOLEAN NOT NULL DEFAULT FALSE,
  base_role_modification_rights BOOLEAN NOT NULL DEFAULT FALSE,
  admin_role_modification_rights BOOLEAN NOT NULL DEFAULT FALSE,
  product_addition_rights BOOLEAN NOT NULL DEFAULT FALSE,
  product_modification_rights BOOLEAN NOT NULL DEFAULT FALSE,
  product_deletion_rights BOOLEAN NOT NULL DEFAULT FALSE,
  base_company_data_modification_rights BOOLEAN NOT NULL DEFAULT FALSE,
  advanced_company_data_modification_rights BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT company_administrators_pkey PRIMARY KEY (company_administrator_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS company_administrators_user_company_uidx
  ON public.company_administrators (user_id, company_id);

CREATE INDEX IF NOT EXISTS company_administrators_company_id_idx ON public.company_administrators (company_id);
CREATE INDEX IF NOT EXISTS company_administrators_user_id_idx ON public.company_administrators (user_id);
