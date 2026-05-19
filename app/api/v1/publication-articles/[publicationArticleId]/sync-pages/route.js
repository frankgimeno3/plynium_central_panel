import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { syncPublicationArticlePages } from "../../../../../../server/features/publication_workflow/PublicationArticleService.js";
import { PublicationArticleDbModel } from "../../../../../../server/database/models.js";
import { triggerRegeneratePublicationIndexAndSummary } from "../../../../../../server/features/publication/PublicationIndexSummaryService.js";

export const runtime = "nodejs";

function getPublicationArticleIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publication-articles\/([^/]+)\/sync-pages/
    );
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication_article_id not found in URL");
}

const postSchema = Joi.object({
    desired_page_count: Joi.number().integer().min(1).required(),
});

/**
 * Aligns the regular_page slots attached to this publication_article so the
 * length of `publication_slots_id_array` equals `desired_page_count`. Creates
 * missing slots + matching publication_slot_content rows when growing; deletes
 * trailing safe-to-remove slots when shrinking.
 */
export const POST = createEndpoint(
    async (request, body) => {
        const id = getPublicationArticleIdFromRequest(request);
        try {
            const result = await syncPublicationArticlePages(
                id,
                Number(body.desired_page_count)
            );
            try {
                if (PublicationArticleDbModel?.sequelize) {
                    const ap = await PublicationArticleDbModel.findByPk(id);
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
                { message: error?.message ?? "Failed to sync publication article pages" },
                { status }
            );
        }
    },
    postSchema,
    true
);
