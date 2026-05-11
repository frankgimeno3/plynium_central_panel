import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { listAvailablePortalArticles } from "../../../../../../server/features/publication_workflow/PublicationContentsManagerService.js";

export const runtime = "nodejs";

function getPublicationIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publications\/([^/]+)\/available-portal-articles(?:\/|$)/
    );
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication id not found in URL");
}

const querySchema = Joi.object({
    q: Joi.string().allow("").optional(),
    portal_id: Joi.alternatives()
        .try(Joi.number().integer(), Joi.string().pattern(/^\d+$/))
        .optional(),
    limit: Joi.alternatives()
        .try(Joi.number().integer(), Joi.string().pattern(/^\d+$/))
        .optional(),
});

/**
 * Returns articles_db rows that:
 *   - are published in one of the portals attached to this publication's
 *     magazine,
 *   - have `article_published_at` strictly after the previous published
 *     publication's `real_publication_month_date` (no lower bound when there
 *     is no prior publication),
 *   - and are NOT already selected through `publication_articles` for this
 *     publication.
 *
 * Optional filters (query string):
 *   - q          : ILIKE on id_article OR article_title.
 *   - portal_id  : restricts to one of the magazine's portals.
 *   - limit      : caps the number of returned rows (1..200, default 100).
 */
export const GET = createEndpoint(
    async (request, query) => {
        const publicationId = getPublicationIdFromRequest(request);
        const data = await listAvailablePortalArticles(publicationId, query ?? {});
        return NextResponse.json(data);
    },
    querySchema,
    true
);
