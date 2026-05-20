import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { removeEmptyPublicationArticlePage } from "../../../../../../../server/features/publication_workflow/PublicationArticleService.js";
import { PublicationArticleDbModel } from "../../../../../../../server/database/models.js";
import { triggerRegeneratePublicationIndexAndSummary } from "../../../../../../../server/features/publication/PublicationIndexSummaryService.js";

export const runtime = "nodejs";

function parseIdsFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publication-articles\/([^/]+)\/pages\/([^/]+)/
    );
    if (!match) {
        throw new Error("publication_article_id or publication_slot_id not found in URL");
    }
    const deleteChunksRaw = (url.searchParams.get("delete_chunks") ?? "")
        .trim()
        .toLowerCase();
    const deleteChunks =
        deleteChunksRaw === "1" || deleteChunksRaw === "true" || deleteChunksRaw === "yes";
    return {
        publicationArticleId: decodeURIComponent(match[1]),
        slotId: decodeURIComponent(match[2]),
        deleteChunks,
    };
}

/**
 * Deletes a specific article page from a publication_article.
 *
 * By default (no `?delete_chunks=1`), refuses if the slot still has content
 * chunks. When `?delete_chunks=1` is passed, all `publication_article_chunks`
 * rows attached to the slot are destroyed first inside the same transaction.
 *
 * In both modes, the slot is removed from `publication_slots_id_array`,
 * `desired_page_count` is decremented, the underlying `publication_slots_db`
 * row is destroyed when safe (regular_page with no project_id), and the
 * slot's mediateca folder is cleaned up.
 *
 * Refuses if it would leave the article with zero pages.
 */
export const DELETE = createEndpoint(
    async (request) => {
        const { publicationArticleId, slotId, deleteChunks } =
            parseIdsFromRequest(request);
        try {
            const result = await removeEmptyPublicationArticlePage(
                publicationArticleId,
                Number(slotId),
                { deleteChunks }
            );
            try {
                if (PublicationArticleDbModel?.sequelize) {
                    const ap = await PublicationArticleDbModel.findByPk(
                        publicationArticleId
                    );
                    const pid = String(ap?.get?.("publication_id") ?? "").trim();
                    if (pid) triggerRegeneratePublicationIndexAndSummary(pid);
                }
            } catch {
                /* best-effort */
            }
            return NextResponse.json(result);
        } catch (error) {
            const status = Number.isFinite(Number(error?.statusCode))
                ? Number(error.statusCode)
                : 500;
            return NextResponse.json(
                {
                    message:
                        error?.message ?? "Failed to delete publication article page",
                },
                { status }
            );
        }
    },
    null,
    true
);
