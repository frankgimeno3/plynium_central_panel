import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getCompaniesByPortalId } from "../../../../../../server/features/company/CompanyPortalService.js";

export const runtime = "nodejs";

function getPortalIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/portals\/(\d+)\/companies/);
    if (match && match[1]) return parseInt(match[1], 10);
    throw new Error("Portal ID not found");
}

export const GET = createEndpoint(
    async (request) => {
        const portalId = getPortalIdFromRequest(request);
        const companies = await getCompaniesByPortalId(portalId);
        return NextResponse.json(companies);
    },
    null,
    true
);
