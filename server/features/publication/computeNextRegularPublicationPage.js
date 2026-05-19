import { PublicationSlotDbModel } from "../../database/models.js";
import "../../database/models.js";

/** First `publication_page` for editorial `regular_page` slots (after preferential 1–9). */
export const FIRST_REGULAR_PUBLICATION_PAGE = 10;

/**
 * Target integer `publication_page` for a new `regular_page` when the caller
 * does not specify one: the page **after** the last existing regular slot, i.e.
 * immediately before `end` once the issue is compact. Defaults to
 * {@link FIRST_REGULAR_PUBLICATION_PAGE} when no regular rows exist yet.
 *
 * @param {string} publicationId
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 */
export async function computeNextRegularPublicationPage(publicationId, options = {}) {
    const { transaction } = options;
    const pid = String(publicationId ?? "").trim();
    if (!pid) throw new Error("publicationId required");

    const rows = await PublicationSlotDbModel.findAll({
        where: { publication_id: pid },
        attributes: ["slot_key", "publication_page"],
        order: [
            ["slot_ordinal", "ASC"],
            ["publication_slot_id", "ASC"],
        ],
        transaction,
    });

    let maxRegularPage = FIRST_REGULAR_PUBLICATION_PAGE - 1;
    for (const r of rows) {
        const key = String(r.get("slot_key") ?? "").trim().toLowerCase();
        const pp = Number(r.get("publication_page"));
        if (key !== "regular_page" || !Number.isFinite(pp)) continue;
        maxRegularPage = Math.max(maxRegularPage, Math.round(pp));
    }

    if (maxRegularPage >= FIRST_REGULAR_PUBLICATION_PAGE) {
        return maxRegularPage + 1;
    }
    return FIRST_REGULAR_PUBLICATION_PAGE;
}
