import { Op, Transaction } from "sequelize";
import PublicationPreferentialSlotDbModel from "../publication_workflow/PublicationPreferentialSlotDbModel.js";
import PublicationSlotDbModel from "../publication_workflow/PublicationSlotDbModel.js";
import ProposalDbModel from "../proposal_db/ProposalDbModel.js";
import CustomerDbModel from "../customer_db/CustomerDbModel.js";
import {
    MAGAZINE_PREFERENTIAL_POSITIONS,
    displayTitleForPreferentialPosition,
    defaultSlotContentTypeForMagazinePreferentialPosition,
} from "./publicationPreferentialSlots.js";
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

/**
 * Ordered summary of `publication_preferential_slots` for a publication (canonical magazine positions).
 * @param {string} publication_id
 * @param {{ sequelize?: import("sequelize").Sequelize }} [opts]
 */
export async function listPreferentialSlotsForPublication(publication_id, opts = {}) {
    const sequelize = opts.sequelize ?? PublicationPreferentialSlotDbModel.sequelize;
    if (!sequelize) {
        throw new Error("PublicationPreferentialSlotDbModel not initialized");
    }
    const pid = String(publication_id ?? "").trim();
    if (!pid) return { slots: [] };

    const rows = await PublicationPreferentialSlotDbModel.findAll({
        where: { publication_id: pid },
    });

    const plainRows = rows.map((r) => r.get({ plain: true }));
    const byPos = new Map();
    for (const row of plainRows) {
        byPos.set(String(row.position_in_magazine ?? "").trim(), row);
    }

    const publicationSlotIds = plainRows
        .map((row) => row.publication_slot_id)
        .filter((id) => id != null)
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id));
    const slotContentTypeById = new Map();
    if (publicationSlotIds.length) {
        const slotRows = await PublicationSlotDbModel.findAll({
            where: { publication_slot_id: { [Op.in]: publicationSlotIds } },
            attributes: ["publication_slot_id", "slot_content_type"],
        });
        for (const slot of slotRows) {
            const plain = slot.get({ plain: true });
            const id = Number(plain.publication_slot_id);
            if (Number.isFinite(id)) {
                slotContentTypeById.set(id, plain.slot_content_type != null ? String(plain.slot_content_type) : null);
            }
        }
    }

    const proposalSet = new Set();
    const customerSet = new Set();

    for (const row of plainRows) {
        const st = String(row.state ?? "").toLowerCase();
        const assigned = row.assigned_customer_id != null ? String(row.assigned_customer_id).trim() : "";
        const prArr = coerceProposalIdArray(row.proposal_id_array);
        prArr.forEach((id) => proposalSet.add(id));
        if (st === "bought" && assigned) customerSet.add(assigned);
        if (st === "assigned" && assigned && !["summary", "advertiser_index"].includes(assigned.toLowerCase())) {
            customerSet.add(assigned);
        }
    }

    const proposalIds = [...proposalSet];
    /** @type {Map<string, { id_proposal: string, id_customer: string | null, status: string | null, title: string | null }>} */
    const proposalsById = new Map();
    if (proposalIds.length) {
        const props = await ProposalDbModel.findAll({
            where: { id_proposal: { [Op.in]: proposalIds } },
            attributes: ["id_proposal", "id_customer", "status", "title"],
        });
        for (const p of props) {
            const pl = p.get({ plain: true });
            const id = String(pl.id_proposal ?? "").trim();
            if (!id) continue;
            const cid = pl.id_customer != null ? String(pl.id_customer).trim() : null;
            if (cid) customerSet.add(cid);
            proposalsById.set(id, {
                id_proposal: id,
                id_customer: cid,
                status: pl.status != null ? String(pl.status) : null,
                title: pl.title != null ? String(pl.title) : null,
            });
        }
    }

    const customerIds = [...customerSet];
    const customerNameById = new Map();
    if (customerIds.length) {
        const custs = await CustomerDbModel.findAll({
            where: { id_customer: { [Op.in]: customerIds } },
            attributes: ["id_customer", "name"],
        });
        for (const c of custs) {
            const cl = c.get({ plain: true });
            const id = String(cl.id_customer ?? "").trim();
            if (id) customerNameById.set(id, cl.name != null ? String(cl.name).trim() : "");
        }
    }

    const slots = MAGAZINE_PREFERENTIAL_POSITIONS.map((position_in_magazine) => {
        const posKey = String(position_in_magazine ?? "").trim();
        const row = byPos.get(posKey);
        const section_title = displayTitleForPreferentialPosition(posKey);

        if (!row) {
            const fallbackType = defaultSlotContentTypeForMagazinePreferentialPosition(posKey);
            return {
                position_in_magazine: posKey,
                section_title,
                missing: true,
                preferential_slot_id: null,
                publication_slot_id: null,
                state: null,
                contract_id: null,
                assigned_customer_id: null,
                assigned_kind: null,
                assigned_customer_name: null,
                slot_content_type:
                    fallbackType === "summary" || fallbackType === "index" ? fallbackType : null,
                proposal_summaries: [],
            };
        }

        const st = String(row.state ?? "").toLowerCase();
        const assigned = row.assigned_customer_id != null ? String(row.assigned_customer_id).trim() : "";
        const pids = coerceProposalIdArray(row.proposal_id_array);

        let assignedKind = null;
        if (st === "assigned" && assigned) {
            const al = assigned.toLowerCase();
            if (al === "summary") assignedKind = "summary";
            else if (al === "advertiser_index") assignedKind = "advertiser_index";
            else assignedKind = "customer";
        }

        const proposal_summaries = pids.map((propId) => {
            const pr = proposalsById.get(propId);
            const cid = pr?.id_customer ?? null;
            return {
                proposal_id: propId,
                customer_id: cid,
                customer_name: cid ? customerNameById.get(cid) ?? null : null,
                proposal_status: pr?.status ?? null,
                title: pr?.title ?? null,
            };
        });

        const assigned_customer_name =
            assigned &&
            !["summary", "advertiser_index"].includes(assigned.toLowerCase()) &&
            (st === "bought" || st === "assigned")
                ? customerNameById.get(assigned) ?? null
                : null;

        return {
            position_in_magazine: posKey,
            section_title,
            missing: false,
            preferential_slot_id: row.preferential_slot_id != null ? String(row.preferential_slot_id) : "",
            publication_slot_id:
                row.publication_slot_id != null ? Number(row.publication_slot_id) : null,
            state: row.state != null ? String(row.state) : "",
            contract_id: row.contract_id != null ? String(row.contract_id) : null,
            assigned_customer_id: assigned || null,
            assigned_kind: assignedKind,
            assigned_customer_name,
            slot_content_type:
                row.publication_slot_id != null
                    ? slotContentTypeById.get(Number(row.publication_slot_id)) ?? null
                    : null,
            proposal_summaries,
        };
    });

    return { slots };
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
