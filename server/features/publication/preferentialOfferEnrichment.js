import { Op } from "sequelize";
import OfferedPreferentialPageDbModel from "../publication_workflow/OfferedPreferentialPageDbModel.js";
import ProposalDbModel from "../proposal_db/ProposalDbModel.js";
import ProposalServiceLineDbModel from "../proposal_db/ProposalServiceLineDbModel.js";
import "../../database/models.js";

const ACTIVE_PROPOSAL_STATUSES = ["draft", "pending"];

/** @param {string} raw */
function parseEmbeddedFromUnitDetails(raw) {
    const text = String(raw ?? "").trim();
    if (!text) return null;
    const marker = "__embedded_json__:";
    const idx = text.indexOf(marker);
    const jsonBlob = idx >= 0 ? text.slice(idx + marker.length).trim() : text;
    try {
        const parsed = JSON.parse(jsonBlob);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function uniqueNonEmptyStrings(value) {
    const out = [];
    const seen = new Set();
    const list = Array.isArray(value) ? value : [];
    for (const item of list) {
        const s = String(item ?? "").trim();
        if (!s || seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }
    return out;
}

/**
 * Load proposal ids keyed by `publication_slots_db.publication_slot_id` from
 * `offered_preferential_pages` (includes rows with null publication_id).
 *
 * @param {string} publicationId
 * @param {number[]} publicationSlotIds
 * @returns {Promise<Map<number, string[]>>}
 */
export async function loadOfferedProposalIdsByPublicationSlotId(publicationId, publicationSlotIds) {
    const pid = String(publicationId ?? "").trim();
    const slotIds = [...new Set(publicationSlotIds.map((n) => Number(n)).filter(Number.isFinite))];
    const map = new Map();
    if (!pid && !slotIds.length) return map;

    /** @type {import("sequelize").WhereOptions} */
    const orClauses = [];
    if (pid) {
        orClauses.push({ publication_id: pid });
    }
    if (slotIds.length) {
        orClauses.push({
            publication_slot_id: { [Op.in]: slotIds },
        });
    }
    if (!orClauses.length) return map;

    const rows = await OfferedPreferentialPageDbModel.findAll({
        where: {
            proposal_id: { [Op.ne]: null },
            [Op.or]: orClauses,
        },
        attributes: ["publication_slot_id", "proposal_id"],
    });

    for (const row of rows) {
        const slotId = Number(row.get("publication_slot_id"));
        const proposalId = String(row.get("proposal_id") ?? "").trim();
        if (!Number.isFinite(slotId) || !proposalId) continue;
        const existing = map.get(slotId) ?? [];
        if (!existing.includes(proposalId)) {
            map.set(slotId, [...existing, proposalId]);
        }
    }
    return map;
}

/**
 * Active proposals with service lines pointing at preferential slots on this publication.
 *
 * @param {string} publicationId
 * @param {string[]} preferentialSlotUuids
 * @returns {Promise<Map<number, string[]>>} keyed by publication_slot_id (resolved via slot uuid)
 */
export async function loadActiveProposalIdsByPreferentialSlotUuid(publicationId, preferentialSlotUuids) {
    const pid = String(publicationId ?? "").trim();
    const slotUuidSet = new Set(
        preferentialSlotUuids.map((s) => String(s ?? "").trim()).filter(Boolean)
    );
    /** @type {Map<string, string[]>} */
    const map = new Map();
    if (!pid || !slotUuidSet.size) return map;

    const props = await ProposalDbModel.findAll({
        where: { status: { [Op.in]: ACTIVE_PROPOSAL_STATUSES } },
        attributes: ["id_proposal"],
    });
    const proposalIds = props
        .map((p) => String(p.get("id_proposal") ?? "").trim())
        .filter(Boolean);
    if (!proposalIds.length) return map;

    const lineRows = await ProposalServiceLineDbModel.findAll({
        where: {
            proposal_id: { [Op.in]: proposalIds },
            [Op.or]: [{ publication_id: pid }, { publication_id: null }],
        },
        attributes: ["proposal_id", "publication_id", "proposal_service_unit_details"],
    });

    for (const row of lineRows) {
        const proposalId = String(row.get("proposal_id") ?? "").trim();
        if (!proposalId) continue;

        let linePub = String(row.get("publication_id") ?? "").trim();
        const embedded = parseEmbeddedFromUnitDetails(row.get("proposal_service_unit_details"));
        if (!linePub && embedded) {
            linePub = String(embedded.id_planned_publication ?? embedded.publication_id ?? "").trim();
        }
        if (linePub && linePub !== pid) continue;

        const prefSlotUuid = String(embedded?.preferential_slot_id ?? "").trim();
        if (!prefSlotUuid || !slotUuidSet.has(prefSlotUuid)) continue;

        const existing = map.get(prefSlotUuid) ?? [];
        if (!existing.includes(proposalId)) {
            map.set(prefSlotUuid, [...existing, proposalId]);
        }
    }
    return map;
}

/**
 * @param {Map<number, string[]>} byPublicationSlotId
 * @param {Map<string, string[]>} byPreferentialSlotUuid
 * @param {Map<string, number>} preferentialUuidToPublicationSlotId
 */
export function mergeOfferIndexes(byPublicationSlotId, byPreferentialSlotUuid, preferentialUuidToPublicationSlotId) {
    const merged = new Map(byPublicationSlotId);
    for (const [prefUuid, proposalIds] of byPreferentialSlotUuid.entries()) {
        const pubSlotId = preferentialUuidToPublicationSlotId.get(prefUuid);
        if (!Number.isFinite(pubSlotId)) continue;
        const existing = merged.get(pubSlotId) ?? [];
        merged.set(pubSlotId, uniqueNonEmptyStrings([...existing, ...proposalIds]));
    }
    return merged;
}

/**
 * Merge slot state + proposal ids with offered_preferential_pages index.
 *
 * @param {{
 *   state?: string | null,
 *   publication_slot_id?: number | null,
 *   proposal_id_array?: unknown,
 * }} slot
 * @param {Map<number, string[]>} offeredByPublicationSlotId
 * @returns {{ state: string, proposal_ids: string[] }}
 */
/**
 * @param {Array<{ preferential_slot_id?: unknown, publication_slot_id?: unknown }>} plainPreferentialRows
 * @param {Map<number, string[]>} offeredByPublicationSlotId
 * @param {Map<string, string[]>} offeredByPreferentialSlotUuid
 */
/**
 * Scan active proposal lines for preferential placements (batch, all publications).
 *
 * @param {Array<{ preferential_slot_id?: unknown, publication_slot_id?: unknown, publication_id?: unknown }>} plainPreferentialRows
 * @returns {Promise<Map<number, string[]>>}
 */
export async function loadActiveProposalOffersForPreferentialRows(plainPreferentialRows) {
    const rows = Array.isArray(plainPreferentialRows) ? plainPreferentialRows : [];
    const publicationIds = new Set(
        rows.map((r) => String(r.publication_id ?? "").trim()).filter(Boolean)
    );
    const slotUuidSet = new Set(
        rows.map((r) => String(r.preferential_slot_id ?? "").trim()).filter(Boolean)
    );
    const map = new Map();
    if (!publicationIds.size || !slotUuidSet.size) return map;

    const uuidToPubSlot = new Map();
    for (const row of rows) {
        const prefUuid = String(row.preferential_slot_id ?? "").trim();
        const pubSlotId = Number(row.publication_slot_id);
        if (prefUuid && Number.isFinite(pubSlotId)) {
            uuidToPubSlot.set(prefUuid, pubSlotId);
        }
    }

    const props = await ProposalDbModel.findAll({
        where: { status: { [Op.in]: ACTIVE_PROPOSAL_STATUSES } },
        attributes: ["id_proposal"],
    });
    const proposalIds = props
        .map((p) => String(p.get("id_proposal") ?? "").trim())
        .filter(Boolean);
    if (!proposalIds.length) return map;

    const lineRows = await ProposalServiceLineDbModel.findAll({
        where: {
            proposal_id: { [Op.in]: proposalIds },
            [Op.or]: [
                { publication_id: { [Op.in]: [...publicationIds] } },
                { publication_id: null },
            ],
        },
        attributes: ["proposal_id", "publication_id", "proposal_service_unit_details"],
    });

    for (const row of lineRows) {
        const proposalId = String(row.get("proposal_id") ?? "").trim();
        if (!proposalId) continue;

        let linePub = String(row.get("publication_id") ?? "").trim();
        const embedded = parseEmbeddedFromUnitDetails(row.get("proposal_service_unit_details"));
        if (!linePub && embedded) {
            linePub = String(embedded.id_planned_publication ?? embedded.publication_id ?? "").trim();
        }
        if (!linePub || !publicationIds.has(linePub)) continue;

        const prefSlotUuid = String(embedded?.preferential_slot_id ?? "").trim();
        const pubSlotId = uuidToPubSlot.get(prefSlotUuid);
        if (!prefSlotUuid || !Number.isFinite(pubSlotId)) continue;

        const existing = map.get(pubSlotId) ?? [];
        if (!existing.includes(proposalId)) {
            map.set(pubSlotId, [...existing, proposalId]);
        }
    }
    return map;
}

export function mergeOfferIndexesForPublication(
    plainPreferentialRows,
    offeredByPublicationSlotId,
    offeredByPreferentialSlotUuid
) {
    const uuidToPubSlot = new Map();
    for (const row of plainPreferentialRows) {
        const prefUuid = String(row.preferential_slot_id ?? "").trim();
        const pubSlotId = Number(row.publication_slot_id);
        if (prefUuid && Number.isFinite(pubSlotId)) {
            uuidToPubSlot.set(prefUuid, pubSlotId);
        }
    }
    return mergeOfferIndexes(
        offeredByPublicationSlotId,
        offeredByPreferentialSlotUuid,
        uuidToPubSlot
    );
}

export function mergeSlotOfferState(slot, offeredByPublicationSlotId) {
    const pubSlotId =
        slot.publication_slot_id != null ? Number(slot.publication_slot_id) : NaN;
    const fromSlot = uniqueNonEmptyStrings(slot.proposal_id_array);
    const fromOffers = Number.isFinite(pubSlotId)
        ? offeredByPublicationSlotId.get(pubSlotId) ?? []
        : [];
    const proposal_ids = uniqueNonEmptyStrings([...fromSlot, ...fromOffers]);
    let state = String(slot.state ?? "").trim() || "available";
    const st = state.toLowerCase();
    if (proposal_ids.length && (st === "available" || st === "")) {
        state = "offered";
    }
    return { state, proposal_ids };
}
