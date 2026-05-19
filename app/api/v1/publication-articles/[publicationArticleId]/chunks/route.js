import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
    listChunks,
    createChunk,
    PUBLICATION_ARTICLE_CHUNK_FORMATS,
} from "../../../../../../server/features/publication_workflow/PublicationArticleService.js";

export const runtime = "nodejs";

function getPublicationArticleIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publication-articles\/([^/]+)\/chunks(?:\/|$)/
    );
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication_article_id not found in URL");
}

const postSchema = Joi.object({
    publication_article_chunk_format: Joi.string()
        .valid(...PUBLICATION_ARTICLE_CHUNK_FORMATS)
        .optional(),
    chunk_html: Joi.string().allow("").optional(),
    chunk_position: Joi.number().integer().optional(),
    chunk_page_weight: Joi.number().integer().min(1).max(100).optional(),
    publication_slot_id: Joi.alternatives()
        .try(Joi.number().integer(), Joi.valid(null))
        .optional(),
    publication_slot_content_id: Joi.alternatives()
        .try(Joi.number().integer(), Joi.valid(null))
        .optional(),
    original_article_content_id: Joi.string().allow("").optional(),
});

/** Lists every chunk attached to the publication_article. */
export const GET = createEndpoint(
    async (request) => {
        const id = getPublicationArticleIdFromRequest(request);
        const items = await listChunks(id);
        return NextResponse.json({ items });
    },
    null,
    true
);

/** Creates a new chunk. Empty body creates a blank `only_text` chunk. */
export const POST = createEndpoint(
    async (request, body) => {
        const id = getPublicationArticleIdFromRequest(request);
        try {
            const created = await createChunk(id, body ?? {});
            return NextResponse.json(created, { status: 201 });
        } catch (error) {
            const status = Number.isFinite(Number(error?.statusCode))
                ? Number(error.statusCode)
                : 500;
            return NextResponse.json(
                { message: error?.message ?? "Failed to create chunk" },
                { status }
            );
        }
    },
    postSchema,
    true
);
