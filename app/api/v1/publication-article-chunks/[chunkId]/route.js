import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
    updateChunk,
    deleteChunk,
    PUBLICATION_ARTICLE_CHUNK_FORMATS,
} from "../../../../../server/features/publication_workflow/PublicationArticleService.js";

export const runtime = "nodejs";

function getChunkIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publication-article-chunks\/([^/]+)(?:\/|$)/
    );
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication_article_chunk_id not found in URL");
}

const patchSchema = Joi.object({
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
    chunk_area_array: Joi.array().items(Joi.string()).optional(),
});

export const PATCH = createEndpoint(
    async (request, body) => {
        const id = getChunkIdFromRequest(request);
        try {
            const updated = await updateChunk(id, body ?? {});
            return NextResponse.json(updated);
        } catch (error) {
            const status = Number.isFinite(Number(error?.statusCode))
                ? Number(error.statusCode)
                : 500;
            return NextResponse.json(
                { message: error?.message ?? "Failed to update chunk" },
                { status }
            );
        }
    },
    patchSchema,
    true
);

export const DELETE = createEndpoint(
    async (request) => {
        const id = getChunkIdFromRequest(request);
        const url = new URL(request.url);
        const deleteMediateca =
            url.searchParams.get("delete_mediateca") === "true" ||
            url.searchParams.get("delete_mediateca") === "1";
        try {
            const result = await deleteChunk(id, {
                deleteMediatecaMedia: deleteMediateca,
            });
            return NextResponse.json(result);
        } catch (error) {
            const status = Number.isFinite(Number(error?.statusCode))
                ? Number(error.statusCode)
                : 500;
            return NextResponse.json(
                { message: error?.message ?? "Failed to delete chunk" },
                { status }
            );
        }
    },
    null,
    true
);
