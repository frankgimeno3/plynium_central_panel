import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { initializePublicationArticleChunksFromSource } from "../../../../../../server/features/publication_workflow/PublicationArticleService.js";

export const runtime = "nodejs";

function getPublicationArticleIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publication-articles\/([^/]+)\/initialize-chunks-from-source/
    );
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication_article_id not found in URL");
}

/**
 * Imports the source `article_contents` rows of the underlying article into
 * publication_article_chunks. Idempotent: if chunks already exist for this
 * publication_article, the call is a no-op and returns `{ initialized: false }`.
 */
export const POST = createEndpoint(
    async (request) => {
        const id = getPublicationArticleIdFromRequest(request);
        try {
            const result = await initializePublicationArticleChunksFromSource(id);
            return NextResponse.json(result);
        } catch (error) {
            const status = Number.isFinite(Number(error?.statusCode))
                ? Number(error.statusCode)
                : 500;
            return NextResponse.json(
                { message: error?.message ?? "Failed to initialize chunks" },
                { status }
            );
        }
    },
    null,
    true
);
