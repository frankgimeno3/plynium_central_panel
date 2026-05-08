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
];

/**
 * For a magazine-linked publication: creates publication_slots_db rows (preferential_page / advert / pending / flipbook)
 * and publication_preferential_slots rows with the canonical position labels.
 *
 * @param {{ publicationId: string, magazineId: string }} params
 * @param {{ transaction?: import("sequelize").Transaction }} options
 */
export async function createPreferentialSlotsForMagazinePublication(params, options = {}) {
    const publicationId = String(params.publicationId ?? "").trim();
    const magazineId = String(params.magazineId ?? "").trim();
    if (!publicationId || !magazineId) return;
    const { transaction } = options;

    for (const position_in_magazine of MAGAZINE_PREFERENTIAL_POSITIONS) {
        const service_group_id = serviceGroupIdForMagazinePreferentialPosition(position_in_magazine);
        const slot = await PublicationSlotDbModel.create(
            {
                publication_id: publicationId,
                publication_format: "flipbook",
                slot_key: "preferential_page",
                slot_content_type: "advert",
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
}
