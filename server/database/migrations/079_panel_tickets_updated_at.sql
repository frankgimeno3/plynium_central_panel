  -- panel_tickets: column required by generic BEFORE UPDATE triggers using public.set_updated_at()
  -- (Postgres error: record "new" has no field "updated_at")
  ALTER TABLE public.panel_tickets
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

  UPDATE public.panel_tickets
  SET updated_at = panel_ticket_created_at
  WHERE updated_at IS NULL;

  ALTER TABLE public.panel_tickets
    ALTER COLUMN updated_at SET DEFAULT now();

  ALTER TABLE public.panel_tickets
    ALTER COLUMN updated_at SET NOT NULL;
