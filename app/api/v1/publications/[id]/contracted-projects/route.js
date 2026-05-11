import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { listProjectsForPublication } from "../../../../../../server/features/publication_workflow/PublicationContentsManagerService.js";

export const runtime = "nodejs";

function getPublicationIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publications\/([^/]+)\/contracted-projects(?:\/|$)/
    );
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication id not found in URL");
}

/**
 * Returns every project tied to this publication (`projects_db.publication_id = :pid`)
 * enriched with contract / customer / service / slot details. Used by the
 * "Should be in magazine" panel of the Contents Manager tab.
 */
export const GET = createEndpoint(
    async (request) => {
        const publicationId = getPublicationIdFromRequest(request);
        const items = await listProjectsForPublication(publicationId);
        return NextResponse.json({ items });
    },
    null,
    true
);
