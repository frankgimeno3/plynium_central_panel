-- 021_proposal_payments_ordinal.sql
-- Ordinal "x/y" per proposal: x = position by date, y = total payments for that proposal_id.

BEGIN;

ALTER TABLE public.proposal_payments
  ADD COLUMN IF NOT EXISTS proposal_payment_ordinal VARCHAR(32) NOT NULL DEFAULT '1/1';

WITH ranked AS (
  SELECT
    proposal_payment_id,
    ROW_NUMBER() OVER (
      PARTITION BY proposal_id
      ORDER BY proposal_payment_date ASC NULLS LAST, proposal_payment_id ASC
    ) AS rn,
    COUNT(*) OVER (PARTITION BY proposal_id) AS cnt
  FROM public.proposal_payments
)
UPDATE public.proposal_payments p
SET proposal_payment_ordinal = r.rn::text || '/' || GREATEST(r.cnt, 1)::text
FROM ranked r
WHERE p.proposal_payment_id = r.proposal_payment_id;

COMMIT;
