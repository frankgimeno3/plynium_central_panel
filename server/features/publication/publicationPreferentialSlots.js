import PublicationSlotDbModel from "../publication_workflow/PublicationSlotDbModel.js";
import PublicationPreferentialSlotDbModel from "../publication_workflow/PublicationPreferentialSlotDbModel.js";
import "../../database/models.js";

/** `service_groups.service_group_id` — Magazine Cover Page (RDS seed). */
export const SERVICE_GROUP_MAGAZINE_COVER_PAGE = "ca229970-2a1d-4787-8d07-051e4ce43a78";
/** Magazine Inside Cover */
export const SERVICE_GROUP_MAGAZINE_INSIDE_COVER = "71d8f1bf-4c7f-486b-8ebb-acef6aa6b5b8";
/** Magazine Premium Page (preferential pages 1–9) */
export const SERVICE_GROUP_MAGAZINE_PREMIUM_PAGE = "ce71b075-d775-487a-9ca7-001e30ee896e";

/**
 * Maps `position_in_magazine` labels to the standard magazine tariff service groups.
 * @param {string} position_in_magazine
 * @returns {string} UUID service_group_id
 */
export function serviceGroupIdForMagazinePreferentialPosition(position_in_magazine) {
    const p = String(position_in_magazine ?? "");
    if (p === "Cover page") return SERVICE_GROUP_MAGAZINE_COVER_PAGE;
    if (p === "Inside Cover") return SERVICE_GROUP_MAGAZINE_INSIDE_COVER;
    return SERVICE_GROUP_MAGAZINE_PREMIUM_PAGE;
}

/** UI title for a `position_in_magazine` value stored in `publication_preferential_slots`. */
export function displayTitleForPreferentialPosition(dbPosition) {
    const p = String(dbPosition ?? "").trim();
    if (p === "Cover page") return "Cover Page";
    if (p === "Inside Cover") return "Inside Cover";
    if (p === "End page") return "End Page";
    const m = /^Preferential page (\d+)$/i.exec(p);
    if (m) return `Preferential Page ${m[1]}`;
    return p || "—";
}

/** Ordered labels for default preferential placements on a magazine publication. */
export const MAGAZINE_PREFERENTIAL_POSITIONS = [
    "Cover page",
    "Inside Cover",
    "Preferential page 1",
    "Preferential page 2",
    "Preferential page 3",
    "Preferential page 4",
    "Preferential page 5",
    "Preferential page 6",
    "Preferential page 7",
    "Preferential page 8",
    "Preferential page 9",
    "End page",
];

/**
 * Default `publication_slots_db.slot_content_type` for a freshly created
 * preferential placement. Most pages are sold as adverts; preferential page 2
 * is reserved for the magazine summary, and preferential page 4 for the
 * advertiser index.
 *
 * @param {string} position_in_magazine
 * @returns {"advert" | "summary" | "index"}
 */
export function defaultSlotContentTypeForMagazinePreferentialPosition(position_in_magazine) {
    const p = String(position_in_magazine ?? "").trim();
    if (p === "Preferential page 2") return "summary";
    if (p === "Preferential page 4") return "index";
    return "advert";
}

/**
 * For a magazine-linked publication: creates publication_slots_db rows (preferential_page / advert / pending / flipbook)
 * and publication_preferential_slots rows with the canonical position labels.
 *
 * @param {{ publicationId: string, magazineId: string }} params
 * @param {{ transaction?: import("sequelize").Transaction }} options
 */
async function createPreferentialSlotAtPosition(
    publicationId,
    magazineId,
    position_in_magazine,
    options = {}
) {
    const { transaction } = options;
    const service_group_id = serviceGroupIdForMagazinePreferentialPosition(position_in_magazine);
    const slot_content_type = defaultSlotContentTypeForMagazinePreferentialPosition(position_in_magazine);
    const slot = await PublicationSlotDbModel.create(
        {
            publication_id: publicationId,
            publication_format: "flipbook",
            slot_key: "preferential_page",
            slot_content_type,
            slot_state: "pending",
        },
        { transaction }
    );
    const publication_slot_id = slot.get("publication_slot_id");
    await PublicationPreferentialSlotDbModel.create(
        {
            magazine_id: magazineId,
            publication_id: publicationId,
            position_in_magazine,
            publication_slot_id,
            service_group_id,
            state: "available",
        },
        { transaction }
    );
}

export async function createPreferentialSlotsForMagazinePublication(params, options = {}) {
    const publicationId = String(params.publicationId ?? "").trim();
    const magazineId = String(params.magazineId ?? "").trim();
    if (!publicationId || !magazineId) return;

    for (const position_in_magazine of MAGAZINE_PREFERENTIAL_POSITIONS) {
        await createPreferentialSlotAtPosition(
            publicationId,
            magazineId,
            position_in_magazine,
            options
        );
    }
}

/**
 * Lazily creates missing `publication_preferential_slots` rows (and backing
 * `publication_slots_db` rows) for magazine-linked publications.
 *
 * @param {{ publicationId: string, magazineId: string }} params
 * @param {{ transaction?: import("sequelize").Transaction }} options
 * @returns {Promise<boolean>} false when ids are missing
 */
export async function ensurePreferentialSlotsForMagazinePublication(params, options = {}) {
    const publicationId = String(params.publicationId ?? "").trim();
    const magazineId = String(params.magazineId ?? "").trim();
    if (!publicationId || !magazineId) return false;

    const { transaction } = options;
    const existing = await PublicationPreferentialSlotDbModel.findAll({
        where: { publication_id: publicationId },
        transaction,
    });
    const existingPositions = new Set(
        existing.map((row) => String(row.get("position_in_magazine") ?? "").trim())
    );

    for (const position_in_magazine of MAGAZINE_PREFERENTIAL_POSITIONS) {
        if (existingPositions.has(position_in_magazine)) continue;
        await createPreferentialSlotAtPosition(
            publicationId,
            magazineId,
            position_in_magazine,
            options
        );
    }

    return true;
}

/**
 * Creates only the requested canonical positions that are still missing.
 *
 * @param {{ publicationId: string, magazineId: string, positions?: string[] }} params
 * @param {{ transaction?: import("sequelize").Transaction }} options
 */
export async function createMissingPreferentialSlotsAtPositions(params, options = {}) {
    const publicationId = String(params.publicationId ?? "").trim();
    const magazineId = String(params.magazineId ?? "").trim();
    const requested = Array.isArray(params.positions) ? params.positions : [];
    if (!publicationId || !magazineId) {
        return { created: [], skipped: requested.map((p) => String(p ?? "").trim()).filter(Boolean) };
    }

    const allowed = new Set(MAGAZINE_PREFERENTIAL_POSITIONS);
    const normalized = [
        ...new Set(
            requested
                .map((position) => String(position ?? "").trim())
                .filter((position) => position && allowed.has(position))
        ),
    ];
    if (!normalized.length) {
        return { created: [], skipped: [] };
    }

    const { transaction } = options;
    const existing = await PublicationPreferentialSlotDbModel.findAll({
        where: { publication_id: publicationId },
        transaction,
    });
    const existingPositions = new Set(
        existing.map((row) => String(row.get("position_in_magazine") ?? "").trim())
    );

    const created = [];
    const skipped = [];
    for (const position_in_magazine of normalized) {
        if (existingPositions.has(position_in_magazine)) {
            skipped.push(position_in_magazine);
            continue;
        }
        await createPreferentialSlotAtPosition(
            publicationId,
            magazineId,
            position_in_magazine,
            options
        );
        existingPositions.add(position_in_magazine);
        created.push(position_in_magazine);
    }

    return { created, skipped };
}
