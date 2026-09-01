import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getMagazineServiceAvailabilityForPublication } from "../../../../../../server/features/proposal_db/ProposalPublicationServiceAvailability.js";
import "../../../../../../server/database/models.js";

export const runtime = "nodejs";

function getPublicationIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/publications\/([^/]+)\/magazine-service-availability(?:\/|$)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication id not found in URL");
}

export const GET = createEndpoint(
    async (request) => {
        const publication_id = getPublicationIdFromRequest(request);
        const data = await getMagazineServiceAvailabilityForPublication(publication_id);
        return NextResponse.json(data);
    },
    null,
    true
);
