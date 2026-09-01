import type { PaymentLine, ProposalForm, ServiceLine, Step } from "./components/types";
import { normalizeServiceLineFromApi } from "./serviceLinePricing";

export type ProposalFase = "1" | "2" | "3" | "4" | "created";

export function stepToProposalFase(step: number): ProposalFase {
  if (step >= 1 && step <= 4) return String(step) as ProposalFase;
  return "1";
}

const FASE_STEP_LABELS: Record<"1" | "2" | "3" | "4", string> = {
  1: "Account and contact",
  2: "Products",
  3: "Payment",
  4: "Review",
};

/** Human-readable wizard phase for list UI. */
export function formatProposalFaseLabel(fase: unknown): string {
  const v = String(fase ?? "1")
    .trim()
    .toLowerCase();
  if (v === "created") return "Created";
  const n = parseInt(v, 10);
  if (Number.isFinite(n) && n >= 1 && n <= 4) {
    return `Step ${n} — ${FASE_STEP_LABELS[String(n) as "1" | "2" | "3" | "4"]}`;
  }
  return v ? v : "—";
}

export function parseProposalFaseToStep(fase: unknown): Step | "created" {
  const v = String(fase ?? "1")
    .trim()
    .toLowerCase();
  if (v === "created") return "created";
  const n = parseInt(v, 10);
  if (Number.isFinite(n) && n >= 1 && n <= 4) return n as Step;
  return 1;
}

type ApiPayment = {
  paymentId?: string;
  date?: string;
  paymentMethod?: PaymentLine["paymentMethod"];
  bank?: PaymentLine["bank"];
  amount?: number;
};

type ApiServiceLine = ServiceLine & { lineId?: string };

export type LoadedProposalApi = {
  id_proposal: string;
  id_customer?: string;
  id_contact?: string;
  additionalContactIds?: string[];
  status?: string;
  proposal_fase?: string;
  title?: string;
  proposal_date?: string;
  expiration_date?: string;
  general_discount_pct?: number;
  serviceLines?: ApiServiceLine[];
  payments?: ApiPayment[];
  isExchange?: boolean;
  exchangeHasFinalPrice?: boolean;
  exchangeFinalPrice?: number;
  exchangeHasBankTransfers?: boolean;
  exchangePlyniumTransferDate?: string;
  exchangeCounterpartDate?: string;
  exchangeTransferredAmount?: number;
  exchangeToBeReceivedHtml?: string;
};

export function proposalApiToForm(p: LoadedProposalApi): ProposalForm {
  const serviceLines: ServiceLine[] = (p.serviceLines ?? []).map((line, idx) =>
    normalizeServiceLineFromApi({
      ...line,
      lineId: line.lineId || `line-${idx}-${line.id_service}`,
    })
  );

  const payments: PaymentLine[] = (p.payments ?? []).map((pay, idx) => ({
    paymentId: pay.paymentId || `pay-${idx}`,
    date: pay.date ?? "",
    paymentMethod: pay.paymentMethod === "recibo" ? "recibo" : "transferencia_bancaria",
    bank: pay.bank === "Santander" ? "Santander" : "Sabadell",
    amount: Number(pay.amount) || 0,
  }));

  return {
    id_customer: String(p.id_customer ?? "").trim(),
    id_contact: String(p.id_contact ?? "").trim(),
    additionalContactIds: Array.isArray(p.additionalContactIds)
      ? p.additionalContactIds.map((x) => String(x).trim()).filter(Boolean)
      : [],
    draft_id_proposal: String(p.id_proposal).trim(),
    title: String(p.title ?? "").trim(),
    proposal_date: String(p.proposal_date ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10),
    expiration_date: String(p.expiration_date ?? "").slice(0, 10),
    serviceLines,
    general_discount_mode: "pct",
    general_discount_pct: Number(p.general_discount_pct) || 0,
    general_discount_abs_eur: 0,
    payments,
    isExchange: !!p.isExchange,
    exchangeHasFinalPrice: !!p.exchangeHasFinalPrice,
    exchangeFinalPrice: Number(p.exchangeFinalPrice) || 0,
    exchangeHasBankTransfers: !!p.exchangeHasBankTransfers,
    exchangePlyniumTransferDate: String(p.exchangePlyniumTransferDate ?? ""),
    exchangeCounterpartDate: String(p.exchangeCounterpartDate ?? ""),
    exchangeTransferredAmount: Number(p.exchangeTransferredAmount) || 0,
    exchangeToBeReceivedHtml: String(p.exchangeToBeReceivedHtml ?? ""),
  };
}

/** Clone proposal data into a new draft (new ids, variation title). */
export function proposalApiToVariationForm(
  p: LoadedProposalApi,
  newDraftId: string
): ProposalForm {
  const base = proposalApiToForm(p);
  const suffix = " (variation)";
  const title = base.title
    ? base.title.endsWith(suffix)
      ? base.title
      : `${base.title}${suffix}`
    : "Proposal variation";

  return {
    ...base,
    draft_id_proposal: newDraftId,
    title,
    serviceLines: base.serviceLines.map((line, idx) => ({
      ...line,
      lineId: `line-var-${Date.now()}-${idx}-${Math.random().toString(36).slice(2)}`,
    })),
    payments: base.payments.map((pay, idx) => ({
      ...pay,
      paymentId: `pay-var-${Date.now()}-${idx}-${Math.random().toString(36).slice(2)}`,
    })),
  };
}
