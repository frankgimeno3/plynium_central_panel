import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
    listPublicationArticles,
    addPublicationArticle,
    addStandalonePublicationArticle,
} from "../../../../../../server/features/publication_workflow/PublicationArticleService.js";
import { triggerRegeneratePublicationIndexAndSummary } from "../../../../../../server/features/publication/PublicationIndexSummaryService.js";

export const runtime = "nodejs";

function getPublicationIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publications\/([^/]+)\/publication-articles(?:\/|$)/
    );
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication id not found in URL");
}

const postSchema = Joi.alternatives().try(
    Joi.object({
        article_id: Joi.string().min(1).required(),
    }),
    Joi.object({
        standalone: Joi.boolean().valid(true).required(),
        desired_page_count: Joi.number().integer().min(1).required(),
    })
);

/** Lists every `publication_articles` row attached to the publication. */
export const GET = createEndpoint(
    async (request) => {
        const publicationId = getPublicationIdFromRequest(request);
        const items = await listPublicationArticles(publicationId);
        return NextResponse.json({ items });
    },
    null,
    true
);

/**
 * Selects a source article (`articles_db.id_article`) for inclusion in this
 * publication. The pair (publication_id, article_id) is unique; a duplicate
 * yields HTTP 409.
 */
export const POST = createEndpoint(
    async (request, body) => {
        const publicationId = getPublicationIdFromRequest(request);
        try {
            if (body?.standalone === true) {
                const created = await addStandalonePublicationArticle({
                    publicationId,
                    desiredPageCount: body.desired_page_count,
                });
                triggerRegeneratePublicationIndexAndSummary(publicationId);
                return NextResponse.json(created, { status: 201 });
            }
            const created = await addPublicationArticle({
                publicationId,
                articleId: body.article_id,
            });
            triggerRegeneratePublicationIndexAndSummary(publicationId);
            return NextResponse.json(created, { status: 201 });
        } catch (error) {
            const status = Number.isFinite(Number(error?.statusCode))
                ? Number(error.statusCode)
                : 500;
            return NextResponse.json(
                { message: error?.message ?? "Failed to add publication article" },
                { status }
            );
        }
    },
    postSchema,
    true
);
