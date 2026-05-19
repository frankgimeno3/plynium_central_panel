import { Op } from "sequelize";
import { PublicationSlotDbModel } from "../../database/models.js";
import "../../database/models.js";

/**
 * Before inserting a `regular_page` at integer `insertionPage`, bumps every
 * `regular_page` and `end` row with `publication_page >= insertionPage` by +1
 * (descending order so keys stay unique). Keeps `slot_ordinal = publication_page + 1`.
 *
 * @param {string} publicationId
 * @param {number} insertionPage
 * @param {{ transaction: import("sequelize").Transaction }} options
 */
export async function shiftPublicationSlotsForRegularInsert(publicationId, insertionPage, options = {}) {
    const { transaction } = options;
    const pid = String(publicationId ?? "").trim();
    const P = Number(insertionPage);
    if (!pid) throw new Error("publicationId required");
    if (!Number.isFinite(P)) throw new Error("insertionPage must be a finite number");

    const rows = await PublicationSlotDbModel.findAll({
        where: {
            publication_id: pid,
            slot_key: { [Op.in]: ["regular_page", "end"] },
            publication_page: { [Op.gte]: P },
        },
        order: [
            ["publication_page", "DESC"],
            ["publication_slot_id", "DESC"],
        ],
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    for (const row of rows) {
        const oldP = Number(row.get("publication_page"));
        const newP = oldP + 1;
        await row.update(
            {
                publication_page: newP,
                slot_ordinal: newP + 1,
            },
            { transaction }
        );
    }
}
