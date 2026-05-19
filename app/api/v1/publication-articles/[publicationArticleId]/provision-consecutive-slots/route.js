import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { provisionPublicationArticleConsecutiveSlots } from "../../../../../../server/features/publication_workflow/PublicationArticleService.js";
import { PublicationArticleDbModel } from "../../../../../../server/database/models.js";
import { triggerRegeneratePublicationIndexAndSummary } from "../../../../../../server/features/publication/PublicationIndexSummaryService.js";

export const runtime = "nodejs";

function getPublicationArticleIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publication-articles\/([^/]+)\/provision-consecutive-slots/
    );
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication_article_id not found in URL");
}

const postSchema = Joi.object({
    start_publication_page: Joi.number().integer().required(),
});

export const POST = createEndpoint(
    async (request, body) => {
        const id = getPublicationArticleIdFromRequest(request);
        try {
            const result = await provisionPublicationArticleConsecutiveSlots(
                id,
                Number(body.start_publication_page)
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
                { message: error?.message ?? "Failed to provision consecutive slots" },
                { status }
            );
        }
    },
    postSchema,
    true
);
