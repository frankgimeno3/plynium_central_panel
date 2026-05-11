import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
    getPublicationArticleWithChunks,
    updatePublicationArticle,
    removePublicationArticle,
} from "../../../../../server/features/publication_workflow/PublicationArticleService.js";

export const runtime = "nodejs";

function getPublicationArticleIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publication-articles\/([^/]+)(?:\/|$)/
    );
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication_article_id not found in URL");
}

const patchSchema = Joi.object({
    desired_page_count: Joi.number().integer().min(1).optional(),
    publication_slots_id_array: Joi.array().items(Joi.number().integer()).optional(),
});

/** Returns publication_article + ordered chunks list. */
export const GET = createEndpoint(
    async (request) => {
        const id = getPublicationArticleIdFromRequest(request);
        const data = await getPublicationArticleWithChunks(id);
        if (!data) {
            return NextResponse.json(
                { message: "publication_article not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(data);
    },
    null,
    true
);

/**
 * Patches `desired_page_count` and / or `publication_slots_id_array`. Slot
 * provisioning (creating/destroying regular_page slots) is handled by a
 * dedicated endpoint that lives next to the article-builder logic.
 */
export const PATCH = createEndpoint(
    async (request, body) => {
        const id = getPublicationArticleIdFromRequest(request);
        try {
            const updated = await updatePublicationArticle(id, body ?? {});
            if (!updated) {
                return NextResponse.json(
                    { message: "publication_article not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(updated);
        } catch (error) {
            const status = Number.isFinite(Number(error?.statusCode))
                ? Number(error.statusCode)
                : 500;
            return NextResponse.json(
                { message: error?.message ?? "Failed to update publication_article" },
                { status }
            );
        }
    },
    patchSchema,
    true
);

/** Removes the publication_article row + every chunk attached to it. */
export const DELETE = createEndpoint(
    async (request) => {
        const id = getPublicationArticleIdFromRequest(request);
        try {
            const result = await removePublicationArticle(id);
            return NextResponse.json(result);
        } catch (error) {
            const status = Number.isFinite(Number(error?.statusCode))
                ? Number(error.statusCode)
                : 500;
            return NextResponse.json(
                { message: error?.message ?? "Failed to delete publication_article" },
                { status }
            );
        }
    },
    null,
    true
);
