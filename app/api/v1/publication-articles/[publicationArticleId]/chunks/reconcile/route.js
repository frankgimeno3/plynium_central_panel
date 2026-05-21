import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { reconcilePublicationArticleChunks } from "../../../../../../../server/features/publication_workflow/PublicationArticleService.js";

export const runtime = "nodejs";

function getPublicationArticleIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publication-articles\/([^/]+)\/chunks\/reconcile/
    );
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication_article_id not found in URL");
}

const postSchema = Joi.object({
    prefer_keep_chunk_ids: Joi.array().items(Joi.string()).optional(),
}).default({});

/**
 * Dedupes grid text chunks (newest updated_at per area) and renumbers chunk_position
 * per magazine page slot after an explicit save.
 */
export const POST = createEndpoint(
    async (request, body) => {
        const id = getPublicationArticleIdFromRequest(request);
        try {
            const result = await reconcilePublicationArticleChunks(id, {
                preferKeepChunkIds: body?.prefer_keep_chunk_ids,
            });
            return NextResponse.json(result);
        } catch (error) {
            const status = Number.isFinite(Number(error?.statusCode))
                ? Number(error.statusCode)
                : 500;
            return NextResponse.json(
                { message: error?.message ?? "Failed to reconcile chunks" },
                { status }
            );
        }
    },
    postSchema,
    true
);
