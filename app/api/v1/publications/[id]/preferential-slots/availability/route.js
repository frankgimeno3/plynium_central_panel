import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getPreferentialSlotAvailabilityRow } from "../../../../../../../server/features/publication/PublicationPreferentialSlotReservationService.js";

export const runtime = "nodejs";

function getPublicationIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/publications\/([^/]+)\/preferential-slots\/availability/);
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication id not found in URL");
}

export const GET = createEndpoint(
    async (request) => {
        const publication_id = getPublicationIdFromRequest(request);
        const url = new URL(request.url);
        const service_group_id = String(url.searchParams.get("service_group_id") ?? "").trim();
        const position_in_magazine = String(url.searchParams.get("position_in_magazine") ?? "").trim();
        if (!service_group_id || !position_in_magazine) {
            return NextResponse.json(
                { message: "service_group_id and position_in_magazine query parameters are required." },
                { status: 400 }
            );
        }
        const row = await getPreferentialSlotAvailabilityRow(publication_id, service_group_id, position_in_magazine);
        return NextResponse.json(row);
    },
    null,
    true
);
