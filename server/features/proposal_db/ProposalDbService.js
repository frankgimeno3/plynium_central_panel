import ProposalDbModel from "./ProposalDbModel.js";
import "../../database/models.js";

function normalizeServiceLines(p) {
  const lines = p?.service_lines ?? p?.serviceLines ?? p?.servicesArray ?? [];
  return Array.isArray(lines) ? lines : [];
}

function normalizePayments(p) {
  const pay = p?.payments ?? [];
  return Array.isArray(pay) ? pay : [];
}

function toApiProposal(row) {
  if (!row) return null;
  const additional = Array.isArray(row.additional_contact_ids) ? row.additional_contact_ids : [];
  return {
    id_proposal: row.id_proposal,
    id_customer: row.id_customer ?? "",
    id_contact: row.id_contact ?? "",
    additionalContactIds: additional,
    agent: row.agent ?? "",
    status: row.status ?? "",
    title: row.title ?? "",
    proposal_date: row.proposal_date ?? "",
    date_created: row.date_created ?? "",
    expiration_date: row.expiration_date ?? "",
    amount_eur: row.amount_eur != null ? Number(row.amount_eur) : 0,
    general_discount_pct: row.general_discount_pct != null ? Number(row.general_discount_pct) : 0,
    serviceLines: normalizeServiceLines(row),
    payments: normalizePayments(row),
    isExchange: !!row.is_exchange,
    exchangeHasFinalPrice: !!row.exchange_has_final_price,
    exchangeFinalPrice: row.exchange_final_price != null ? Number(row.exchange_final_price) : 0,
    exchangeHasBankTransfers: !!row.exchange_has_bank_transfers,
    exchangePlyniumTransferDate: row.exchange_plynium_transfer_date ?? "",
    exchangeCounterpartDate: row.exchange_counterpart_date ?? "",
    exchangeTransferredAmount: row.exchange_transferred_amount != null ? Number(row.exchange_transferred_amount) : 0,
    exchangeToBeReceivedHtml: row.exchange_to_be_received_html ?? "",
  };
}

export async function getAllProposals() {
  try {
    if (!ProposalDbModel.sequelize) {
      console.warn("ProposalDbModel not initialized, returning empty array");
      return [];
    }
    const rows = await ProposalDbModel.findAll({
      order: [["date_created", "DESC"]],
    });
    return rows.map((r) => toApiProposal(r.get({ plain: true })));
  } catch (error) {
    console.error("Error fetching proposals from database:", error);
    if (
      error.name === "SequelizeConnectionError" ||
      error.name === "SequelizeConnectionRefusedError" ||
      error.message?.includes("ETIMEDOUT") ||
      error.message?.includes("ECONNREFUSED") ||
      (error.message?.includes("relation") && error.message?.includes("does not exist")) ||
      error.message?.includes("not initialized") ||
      error.message?.includes("Model not found")
    ) {
      console.warn("Database connection issue, returning empty array");
      return [];
    }
    throw error;
  }
}

export async function getProposalById(idProposal) {
  const row = await ProposalDbModel.findByPk(idProposal);
  if (!row) throw new Error(`Proposal with id ${idProposal} not found`);
  return toApiProposal(row.get({ plain: true }));
}

