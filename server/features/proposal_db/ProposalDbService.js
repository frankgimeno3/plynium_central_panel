import { Op } from "sequelize";
import ProposalDbModel from "./ProposalDbModel.js";
import ProposalServiceLineDbModel from "./ProposalServiceLineDbModel.js";
import ProposalPaymentDbModel from "./ProposalPaymentDbModel.js";
import "../../database/models.js";

function parseTransferArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map((s) => {
        if (s == null || s === "") return null;
        try {
            return typeof s === "string" ? JSON.parse(s) : s;
        } catch {
            return { raw: String(s) };
        }
    }).filter(Boolean);
}

function linesToApi(lines) {
    return (lines || []).map((l) => ({
        service_id: l.service_id ?? "",
        custom_name: l.proposal_service_custom_name ?? "",
        discount: l.proposal_service_discount != null ? Number(l.proposal_service_discount) : 0,
    }));
}

function paymentsToApi(rows) {
    return (rows || []).map((p) => ({
        amount: p.proposal_payment_amount != null ? Number(p.proposal_payment_amount) : 0,
        date: p.proposal_payment_date ?? "",
        number: p.proposal_payment_number ?? "",
    }));
}

function normalizeServiceLinesFromRow(p) {
    const lines = p?.service_lines ?? p?.serviceLines ?? p?.servicesArray ?? [];
    return Array.isArray(lines) ? lines : [];
}

function normalizePaymentsFromRow(p) {
    const pay = p?.payments ?? [];
    return Array.isArray(pay) ? pay : [];
}

function toApiProposal(row, serviceLines = [], paymentRows = []) {
    if (!row) return null;
    const additional = Array.isArray(row.additional_contact_ids)
        ? row.additional_contact_ids
        : [];
    const plyniumArr = parseTransferArray(row.exchange_plynium_transfers_array);
    const counterpartArr = parseTransferArray(row.exchange_counterpart_transfers_array);
    const firstPlynium = plyniumArr[0] || {};
    const firstCounter = counterpartArr[0] || {};
    const serviceLinesApi =
        serviceLines.length > 0 ? linesToApi(serviceLines) : normalizeServiceLinesFromRow(row);
    const paymentsApi =
        paymentRows.length > 0 ? paymentsToApi(paymentRows) : normalizePaymentsFromRow(row);
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
        serviceLines: serviceLinesApi,
        payments: paymentsApi,
        isExchange: !!row.is_exchange,
        exchangeHasFinalPrice: !!row.exchange_has_final_price,
        exchangeFinalPrice: row.exchange_final_price != null ? Number(row.exchange_final_price) : 0,
        exchangeHasBankTransfers: !!row.exchange_has_bank_transfers,
        exchangePlyniumTransferDate: firstPlynium.date ?? firstPlynium.payment_date ?? "",
        exchangeCounterpartDate: firstCounter.date ?? "",
        exchangeTransferredAmount:
            firstPlynium.amount != null ? Number(firstPlynium.amount) : 0,
        exchangeToBeReceivedHtml: "",
        exchangePlyniumTransfers: plyniumArr,
        exchangeCounterpartTransfers: counterpartArr,
    };
}

async function loadLinesAndPaymentsByProposalIds(proposalIds) {
    const linesBy = new Map();
    const payBy = new Map();
    if (!proposalIds.length || !ProposalServiceLineDbModel.sequelize) {
        return { linesBy, payBy };
    }
    const [lines, pays] = await Promise.all([
        ProposalServiceLineDbModel.findAll({
            where: { proposal_id: { [Op.in]: proposalIds } },
        }),
        ProposalPaymentDbModel.findAll({
            where: { proposal_id: { [Op.in]: proposalIds } },
        }),
    ]);
    for (const id of proposalIds) {
        linesBy.set(id, []);
        payBy.set(id, []);
    }
    for (const r of lines) {
        const p = r.get({ plain: true });
        const pid = p.proposal_id;
        if (!linesBy.has(pid)) linesBy.set(pid, []);
        linesBy.get(pid).push(p);
    }
    for (const r of pays) {
        const p = r.get({ plain: true });
        const pid = p.proposal_id;
        if (!payBy.has(pid)) payBy.set(pid, []);
        payBy.get(pid).push(p);
    }
    return { linesBy, payBy };
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
        const ids = rows.map((r) => r.get("id_proposal"));
        const { linesBy, payBy } = await loadLinesAndPaymentsByProposalIds(ids);
        return rows.map((r) => {
            const plain = r.get({ plain: true });
            const id = plain.id_proposal;
            return toApiProposal(plain, linesBy.get(id) || [], payBy.get(id) || []);
        });
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
    const plain = row.get({ plain: true });
    const { linesBy, payBy } = await loadLinesAndPaymentsByProposalIds([idProposal]);
    return toApiProposal(plain, linesBy.get(idProposal) || [], payBy.get(idProposal) || []);
}
