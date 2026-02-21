import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllPortals } from "../../../../server/features/portal/PortalService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
    async () => {
        const portals = await getAllPortals();
        return NextResponse.json(portals);
    },
    null,
    true
);
