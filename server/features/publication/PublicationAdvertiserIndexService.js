import { PublicationModel, PublicationSlotDbModel } from "../../database/models.js";
import "../../database/models.js";
import {
    collectAdvertRowsForIndex,
    regeneratePublicationIndexPdf,
} from "./PublicationIndexSummaryService.js";
import { buildAdvertiserIndexHtml } from "./advertiserIndexHtml.js";
import { compactPublicationEditorialPages } from "./compactPublicationSlotsAfterDelete.js";
import { footerPageNumberForSlot } from "./magazinePageFooter.js";

/**
 * Rebuild advertiser-index HTML from every advert slot in the publication and
 * persist it on the index slot's `magazine_page_layout`.
 *
 * @param {string} publicationId
 * @param {number} indexSlotId
 */
export async function rebuildAdvertiserIndexHtml(publicationId, indexSlotId) {
    const pid = String(publicationId ?? "").trim();
    const sid = Number(indexSlotId);
    if (!pid || !Number.isInteger(sid) || sid <= 0) {
        const err = new Error("Invalid publication or index slot id");
        err.statusCode = 400;
        throw err;
    }

    const indexSlot = await PublicationSlotDbModel.findByPk(sid);
    if (!indexSlot) {
        const err = new Error("Index slot not found");
        err.statusCode = 404;
        throw err;
    }
    if (String(indexSlot.get("publication_id") ?? "").trim() !== pid) {
        const err = new Error("Index slot does not belong to this publication");
        err.statusCode = 400;
        throw err;
    }
    const contentType = String(indexSlot.get("slot_content_type") ?? "")
        .trim()
        .toLowerCase();
    if (contentType !== "index") {
        const err = new Error("Slot is not an index slot");
        err.statusCode = 400;
        throw err;
    }

    const publication = await PublicationModel.findByPk(pid);
    const editionName = publication?.get("publication_edition_name") ?? "";
    const isSpecial = Boolean(publication?.get("is_special_edition"));

    await compactPublicationEditorialPages(pid);
    await indexSlot.reload();

    const indexPage = Number(indexSlot.get("publication_page"));
    const indexSlotKey = String(indexSlot.get("slot_key") ?? "");

    const advertRows = await collectAdvertRowsForIndex(pid);
    const html = buildAdvertiserIndexHtml(
        advertRows.map((r) => ({
            customerName: r.customerName,
            page: r.page,
            slotKey: r.slotKey,
            slotId: r.slotId,
        })),
        {
            editionName: String(editionName),
            headerDomain: String(publication?.get("publication_header_domain") ?? ""),
            publicationTheme: String(publication?.get("publication_theme") ?? ""),
            specialEditionSubtitle: isSpecial
                ? String(publication?.get("special_edition_subtitle") ?? "")
                : "",
            redBoxHeader: String(publication?.get("red_box_header") ?? ""),
            redBoxBody: String(publication?.get("red_box_body") ?? ""),
            magazineFooterPageNumber: footerPageNumberForSlot({
                slot_key: indexSlotKey,
                publication_page: indexPage,
            }),
        }
    );

    await indexSlot.update({ magazine_page_layout: html });
    await indexSlot.reload();

    if (publication) {
        try {
            await regeneratePublicationIndexPdf(publication);
        } catch (err) {
            console.warn(
                "[PublicationAdvertiserIndex] PDF regeneration failed:",
                err?.message ?? err
            );
        }
    }

    return {
        index_slot: indexSlot,
        advert_count: advertRows.length,
        magazine_page_layout: html,
        advert_rows: advertRows.map((r) => ({
            publication_slot_id: r.slotId,
            publication_page: r.page,
            company_shown_name: r.customerName || null,
            slot_key: r.slotKey,
        })),
    };
}
