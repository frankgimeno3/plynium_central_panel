import { PublicationModel, PublicationSlotDbModel } from "../../database/models.js";
import "../../database/models.js";
import { regeneratePublicationSummaryPdf } from "./PublicationIndexSummaryService.js";
import { buildArticleSummaryHtml } from "./articleSummaryHtml.js";
import { collectArticleSlotsForSummary } from "./collectArticleSlotsForSummary.js";
import { compactPublicationEditorialPages } from "./compactPublicationSlotsAfterDelete.js";
import { footerPageNumberForSlot } from "./magazinePageFooter.js";

/**
 * Rebuild article-summary HTML from every article slot and persist on the
 * summary slot's `magazine_page_layout`.
 *
 * @param {string} publicationId
 * @param {number} summarySlotId
 */
export async function rebuildArticleSummaryHtml(publicationId, summarySlotId) {
    const pid = String(publicationId ?? "").trim();
    const sid = Number(summarySlotId);
    if (!pid || !Number.isInteger(sid) || sid <= 0) {
        const err = new Error("Invalid publication or summary slot id");
        err.statusCode = 400;
        throw err;
    }

    const summarySlot = await PublicationSlotDbModel.findByPk(sid);
    if (!summarySlot) {
        const err = new Error("Summary slot not found");
        err.statusCode = 404;
        throw err;
    }
    if (String(summarySlot.get("publication_id") ?? "").trim() !== pid) {
        const err = new Error("Summary slot does not belong to this publication");
        err.statusCode = 400;
        throw err;
    }
    const contentType = String(summarySlot.get("slot_content_type") ?? "")
        .trim()
        .toLowerCase();
    if (contentType !== "summary") {
        const err = new Error("Slot is not a summary slot");
        err.statusCode = 400;
        throw err;
    }

    const publication = await PublicationModel.findByPk(pid);
    const editionName = publication?.get("publication_edition_name") ?? "";
    const isSpecial = Boolean(publication?.get("is_special_edition"));

    await compactPublicationEditorialPages(pid);
    await summarySlot.reload();

    const summaryPage = Number(summarySlot.get("publication_page"));
    const summarySlotKey = String(summarySlot.get("slot_key") ?? "");

    const articleRows = await collectArticleSlotsForSummary(pid);
    const html = buildArticleSummaryHtml(
        articleRows.map((r) => ({
            articleTitle: r.articleTitle,
            page: r.page,
            slotKey: r.slotKey,
            slotId: r.slotId,
            summaryEntryId: r.summaryEntryId,
            pages: r.pages,
        })),
        {
            editionName: String(editionName),
            headerDomain: String(publication?.get("publication_header_domain") ?? ""),
            publicationTheme: String(publication?.get("publication_theme") ?? ""),
            specialEditionSubtitle: isSpecial
                ? String(publication?.get("special_edition_subtitle") ?? "")
                : "",
            magazineFooterPageNumber: footerPageNumberForSlot({
                slot_key: summarySlotKey,
                publication_page: summaryPage,
            }),
        }
    );

    await summarySlot.update({ magazine_page_layout: html });
    await summarySlot.reload();

    if (publication) {
        try {
            await regeneratePublicationSummaryPdf(publication);
        } catch (err) {
            console.warn(
                "[PublicationArticleSummary] PDF regeneration failed:",
                err?.message ?? err
            );
        }
    }

    return {
        summary_slot: summarySlot,
        article_count: articleRows.length,
        magazine_page_layout: html,
        article_rows: articleRows.map((r) => ({
            summary_entry_id: r.summaryEntryId,
            publication_slot_id: r.slotId,
            publication_slot_ids: r.slotIds,
            publication_pages: r.pages,
            publication_page: r.page,
            article_title: r.articleTitle || null,
            article_id: r.articleId,
            publication_article_id: r.publicationArticleId,
            slot_key: r.slotKey,
        })),
    };
}
