import { Op, Transaction } from "sequelize";
import PublicationPreferentialSlotDbModel from "../publication_workflow/PublicationPreferentialSlotDbModel.js";
import ProposalDbModel from "../proposal_db/ProposalDbModel.js";
import "../../database/models.js";

function httpError(statusCode, message) {
    const e = new Error(message);
    e.statusCode = statusCode;
    return e;
}

/**
 * Normalize proposal_id_array from DB (sequelize/pg may return null).
 * @param {unknown} raw
 * @returns {string[]}
 */
export function coerceProposalIdArray(raw) {
    if (raw == null) return [];
    if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);
    return [];
}

/** @returns {'summary'|'advertiser_index'|'customer_token'|null} */
export function assignedPlacementKind(assigned_customer_id, state) {
    if (String(state ?? "").toLowerCase() !== "assigned") return null;
    const a = String(assigned_customer_id ?? "").trim().toLowerCase();
    if (!a) return null;
    if (a === "summary") return "summary";
    if (a === "advertiser_index") return "advertiser_index";
    return "customer_token";
}

/**
 * Availability row for GET + UI (English messaging built client-side using these fields).
 * @param {{ sequelize?: import('sequelize').Sequelize }} [opts]
 */
export async function getPreferentialSlotAvailabilityRow(publication_id, service_group_id, position_in_magazine, opts = {}) {
    const sequelize = opts.sequelize ?? PublicationPreferentialSlotDbModel.sequelize;
    if (!sequelize) {
        throw new Error("PublicationPreferentialSlotDbModel not initialized");
    }
    const pid = String(publication_id ?? "").trim();
    const gid = String(service_group_id ?? "").trim().toLowerCase();
    const pos = String(position_in_magazine ?? "").trim();
    if (!pid || !gid || !pos) return { found: false };

    const row = await PublicationPreferentialSlotDbModel.findOne({
        where: {
            publication_id: pid,
            service_group_id: gid,
            position_in_magazine: pos,
        },
    });
    if (!row) return { found: false };

    const plain = row.get({ plain: true });
    const pidArr = coerceProposalIdArray(plain.proposal_id_array);
    const assigned_customer_id =
        plain.assigned_customer_id != null ? String(plain.assigned_customer_id).trim() : "";

    let assigned_customer_name = null;
    if (
        assignedPlacementKind(assigned_customer_id, plain.state) === "customer_token" &&
        assigned_customer_id &&
        !["summary", "advertiser_index"].includes(assigned_customer_id.toLowerCase())
    ) {
        const [rows] = await sequelize.query(
            `SELECT customer_account_name AS name FROM customers_db WHERE customer_id = :cid LIMIT 1`,
            { replacements: { cid: assigned_customer_id } }
        );
        const r0 = rows && rows[0];
        assigned_customer_name = r0?.name != null ? String(r0.name).trim() : null;
    }

    return {
        found: true,
        preferential_slot_id: plain.preferential_slot_id != null ? String(plain.preferential_slot_id) : "",
        publication_id: plain.publication_id != null ? String(plain.publication_id) : "",
        magazine_id: plain.magazine_id != null ? String(plain.magazine_id) : "",
        position_in_magazine: plain.position_in_magazine != null ? String(plain.position_in_magazine) : "",
        service_group_id: plain.service_group_id != null ? String(plain.service_group_id) : "",
        publication_slot_id: plain.publication_slot_id != null ? Number(plain.publication_slot_id) : null,
        state: plain.state != null ? String(plain.state) : "",
        proposal_id_array: pidArr,
        assigned_customer_id: assigned_customer_id || null,
        contract_id: plain.contract_id != null ? String(plain.contract_id) : null,
        assigned_customer_name,
        assigned_kind:
            plain.state === "assigned"
                ? assigned_customer_id?.toLowerCase() === "summary"
                    ? "summary"
                    : assigned_customer_id?.toLowerCase() === "advertiser_index"
                      ? "advertiser_index"
                      : assigned_customer_id
                        ? "customer"
                        : null
                : null,
    };
}

function lockLevel(transaction) {
    return transaction?.LOCK?.UPDATE ?? Transaction.LOCK.UPDATE;
}

/**
 * Add proposal to competing array; transition available→offered or assigned(customer)→offered.
 * @param {import('sequelize').Transaction} transaction
 * @param {string} proposalId
 * @param {string} preferentialSlotId
 */
export async function reservePreferentialSlotForProposal(transaction, proposalId, preferentialSlotId) {
    const slotId = String(preferentialSlotId ?? "").trim();
    const pid = String(proposalId ?? "").trim();
    if (!slotId || !pid) return;

    const row = await PublicationPreferentialSlotDbModel.findByPk(slotId, {
        transaction,
        lock: lockLevel(transaction),
    });
    if (!row) {
        throw httpError(404, "Preferential placement not found.");
    }

    const state = String(row.get("state") ?? "").toLowerCase();
    const assigned = row.get("assigned_customer_id") != null ? String(row.get("assigned_customer_id")).trim() : "";

    if (state === "bought") {
        throw httpError(409, "This placement is already sold.");
    }

    if (state === "assigned") {
        const al = assigned.toLowerCase();
        if (al === "summary" || al === "advertiser_index") {
            throw httpError(
                409,
                "This placement is reserved for publication layout (summary or advertiser index). Resolve it on the publication before offering it."
            );
        }
    }

    const arr = coerceProposalIdArray(row.get("proposal_id_array"));
    if (!arr.includes(pid)) {
        arr.push(pid);
    }

    await row.update(
        {
            proposal_id_array: arr,
            state: "offered",
            assigned_customer_id: null,
        },
        { transaction }
    );
}

/**
 * Mark placement sold and expire competing proposals listed on the slot.
 * @param {import('sequelize').Transaction} transaction
 * @param {{ preferentialSlotId: string, acceptedProposalId: string, contractId: string, customerId: string }} p
 */
export async function finalizePreferentialSlotAfterAccept(transaction, p) {
    const slotId = String(p.preferentialSlotId ?? "").trim();
    const acceptedProposalId = String(p.acceptedProposalId ?? "").trim();
    const contractId = String(p.contractId ?? "").trim();
    const customerId = String(p.customerId ?? "").trim();
    if (!slotId || !acceptedProposalId || !contractId || !customerId) return;

    const row = await PublicationPreferentialSlotDbModel.findByPk(slotId, {
        transaction,
        lock: lockLevel(transaction),
    });
    if (!row) return;

    const arr = coerceProposalIdArray(row.get("proposal_id_array"));
    const losers = arr.filter((id) => id && id !== acceptedProposalId);

    if (losers.length) {
        await ProposalDbModel.update(
            { status: "expired" },
            { where: { id_proposal: { [Op.in]: losers } }, transaction }
        );
    }

    await row.update(
        {
            state: "bought",
            contract_id: contractId,
            assigned_customer_id: customerId,
            proposal_id_array: [],
        },
        { transaction }
    );
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {string} proposalId
 * @param {Iterable<string>} slotIdsIterable
 */
export async function reserveAllPreferentialSlotsForProposal(transaction, proposalId, slotIdsIterable) {
    const seen = new Set();
    for (const id of slotIdsIterable) {
        const s = String(id ?? "").trim();
        if (!s || seen.has(s)) continue;
        seen.add(s);
        await reservePreferentialSlotForProposal(transaction, proposalId, s);
    }
}
