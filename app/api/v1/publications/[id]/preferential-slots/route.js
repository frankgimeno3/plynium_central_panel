import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { listPreferentialSlotsForPublication } from "../../../../../../server/features/publication/PublicationPreferentialSlotReservationService.js";

export const runtime = "nodejs";

function getPublicationIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/publications\/([^/]+)\/preferential-slots(?:\/|$)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication id not found in URL");
}

export const GET = createEndpoint(
    async (request) => {
        const publication_id = getPublicationIdFromRequest(request);
        const data = await listPreferentialSlotsForPublication(publication_id);
        return NextResponse.json(data);
    },
    null,
    true
);
    