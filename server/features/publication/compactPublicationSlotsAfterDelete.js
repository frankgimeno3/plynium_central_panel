import { Op } from "sequelize";
import { PublicationSlotDbModel } from "../../database/models.js";
import "../../database/models.js";

/**
 * Compact `publication_page` / `slot_ordinal` for the editorial section of a publication
 * so there are **no gaps** after deletes.
 *
 * Layout per issue (flipbook):
 *   cover           → publication_page = -1, slot_ordinal = 0
 *   inside_cover    → publication_page =  0, slot_ordinal = 1
 *   preferential 1..9 → publication_page = 1..9, slot_ordinal = 2..10
 *   regular_page    → publication_page = 10, 11, 12, … in current slot_ordinal order
 *   end             → publication_page = last_regular + 1
 *
 * Preserves the relative order of `regular_page` rows (uses `slot_ordinal`, then
 * `publication_page`, then `publication_slot_id` as tie-breakers).
 *
 * @param {string} publicationId
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 * @returns {Promise<{ updated: number }>}
 */
/**
 * Renumber `regular_page` rows to 10…n with no gaps and place `end` on last+1.
 * Safe to call after inserts, relocations, or deletes (not only deletes).
 */
export async function compactPublicationEditorialPages(publicationId, options = {}) {
    return compactPublicationSlotsAfterDelete(publicationId, options);
}

export async function compactPublicationSlotsAfterDelete(publicationId, options = {}) {
    const { transaction } = options;
    const pid = String(publicationId ?? "").trim();
    if (!pid || !PublicationSlotDbModel?.sequelize) return { updated: 0 };

    const rows = await PublicationSlotDbModel.findAll({
        where: {
            publication_id: pid,
            slot_key: { [Op.in]: ["regular_page", "end"] },
        },
        order: [
            ["slot_ordinal", "ASC"],
            ["publication_page", "ASC"],
            ["publication_slot_id", "ASC"],
        ],
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined,
    });

    const regulars = rows.filter(
        (r) => String(r.get("slot_key") ?? "").trim().toLowerCase() === "regular_page"
    );
    const endRows = rows.filter(
        (r) => String(r.get("slot_key") ?? "").trim().toLowerCase() === "end"
    );

    let nextPage = 10;
    let updated = 0;

    for (const row of regulars) {
        const currentPage = Number(row.get("publication_page"));
        const currentOrdinal = Number(row.get("slot_ordinal"));
        const desiredPage = nextPage;
        const desiredOrdinal = desiredPage + 1;
        if (currentPage !== desiredPage || currentOrdinal !== desiredOrdinal) {
            await row.update(
                { publication_page: desiredPage, slot_ordinal: desiredOrdinal },
                { transaction }
            );
            updated += 1;
        }
        nextPage += 1;
    }

    for (const row of endRows) {
        const currentPage = Number(row.get("publication_page"));
        const currentOrdinal = Number(row.get("slot_ordinal"));
        const desiredPage = nextPage;
        const desiredOrdinal = desiredPage + 1;
        if (currentPage !== desiredPage || currentOrdinal !== desiredOrdinal) {
            await row.update(
                { publication_page: desiredPage, slot_ordinal: desiredOrdinal },
                { transaction }
            );
            updated += 1;
        }
        nextPage += 1;
    }

    return { updated };
}
