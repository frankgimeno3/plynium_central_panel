import type { ProposalForm } from "./components/types";
import { stepToProposalFase, type ProposalFase } from "./proposalWizardUtils";

export type ProposalDraftPayload = {
  id_proposal: string;
  id_customer: string;
  id_contact: string;
  additionalContactIds: string[];
  agent: string;
  title: string;
  status: "draft";
  proposal_fase: ProposalFase;
  proposal_date: string;
  expiration_date: string;
  amount_eur: number;
  general_discount_mode: "pct" | "abs";
  general_discount_pct: number;
  general_discount_abs_eur: number;
  serviceLines: ProposalForm["serviceLines"];
  payments: ProposalForm["payments"];
  isExchange: boolean;
  exchangeHasFinalPrice: boolean;
  exchangeFinalPrice: number;
  exchangeHasBankTransfers: boolean;
  exchangePlyniumTransferDate: string;
  exchangeCounterpartDate: string;
  exchangeTransferredAmount: number;
  exchangeToBeReceivedHtml: string;
};

export function buildDraftPayload(
  form: ProposalForm,
  amountEur: number,
  agent: string,
  step: number
): ProposalDraftPayload {
  return {
    id_proposal: form.draft_id_proposal,
    id_customer: form.id_customer,
    id_contact: form.id_contact,
    additionalContactIds: form.additionalContactIds,
    agent,
    title: form.title.trim() || "Untitled proposal",
    status: "draft",
    proposal_fase: stepToProposalFase(step),
    proposal_date: form.proposal_date,
    expiration_date: form.expiration_date,
    amount_eur: amountEur,
    general_discount_mode: form.general_discount_mode,
    general_discount_pct: form.general_discount_pct,
    general_discount_abs_eur: form.general_discount_abs_eur,
    serviceLines: form.serviceLines,
    payments: form.payments,
    isExchange: form.isExchange,
    exchangeHasFinalPrice: form.exchangeHasFinalPrice,
    exchangeFinalPrice: form.exchangeFinalPrice,
    exchangeHasBankTransfers: form.exchangeHasBankTransfers,
    exchangePlyniumTransferDate: form.exchangePlyniumTransferDate,
    exchangeCounterpartDate: form.exchangeCounterpartDate,
    exchangeTransferredAmount: form.exchangeTransferredAmount,
    exchangeToBeReceivedHtml: form.exchangeToBeReceivedHtml,
  };
}

export function buildFinalizePayload(
  form: ProposalForm,
  amountEur: number,
  agent: string
): ProposalDraftPayload & { proposal_fase: "created"; status: "pending" } {
  return {
    ...buildDraftPayload(form, amountEur, agent, 4),
    proposal_fase: "created",
    status: "pending",
  };
}

/** PATCH body for edit wizard (services, payments, exchange, totals). */
export function buildEditSavePayload(form: ProposalForm, amountEur: number) {
  const serviceLines = form.serviceLines.map((line) => {
    const unitPrice = line.unit_price ?? line.price ?? 0;
    return { ...line, unit_price: unitPrice, price: unitPrice };
  });
  return {
    serviceLines,
    payments: form.payments,
    general_discount_mode: form.general_discount_mode,
    general_discount_pct: form.general_discount_pct,
    general_discount_abs_eur: form.general_discount_abs_eur,
    amount_eur: amountEur,
    isExchange: form.isExchange,
    exchangeHasFinalPrice: form.exchangeHasFinalPrice,
    exchangeFinalPrice: form.exchangeFinalPrice,
    exchangeHasBankTransfers: form.exchangeHasBankTransfers,
    exchangePlyniumTransferDate: form.exchangePlyniumTransferDate,
    exchangeCounterpartDate: form.exchangeCounterpartDate,
    exchangeTransferredAmount: form.exchangeTransferredAmount,
    exchangeToBeReceivedHtml: form.exchangeToBeReceivedHtml,
  };
}

/** Stable JSON for dirty-state comparison (includes wizard step). */
export function buildDraftSnapshot(form: ProposalForm, step: number): string {
  return JSON.stringify({
    step,
    proposal_fase: stepToProposalFase(step),
    id_customer: form.id_customer,
    id_contact: form.id_contact,
    additionalContactIds: form.additionalContactIds,
    draft_id_proposal: form.draft_id_proposal,
    title: form.title,
    proposal_date: form.proposal_date,
    expiration_date: form.expiration_date,
    serviceLines: form.serviceLines,
    general_discount_mode: form.general_discount_mode,
    general_discount_pct: form.general_discount_pct,
    general_discount_abs_eur: form.general_discount_abs_eur,
    payments: form.payments,
    isExchange: form.isExchange,
    exchangeHasFinalPrice: form.exchangeHasFinalPrice,
    exchangeFinalPrice: form.exchangeFinalPrice,
    exchangeHasBankTransfers: form.exchangeHasBankTransfers,
    exchangePlyniumTransferDate: form.exchangePlyniumTransferDate,
    exchangeCounterpartDate: form.exchangeCounterpartDate,
    exchangeTransferredAmount: form.exchangeTransferredAmount,
    exchangeToBeReceivedHtml: form.exchangeToBeReceivedHtml,
  });
}
