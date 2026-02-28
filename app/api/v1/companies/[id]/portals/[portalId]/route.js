import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { removeCompanyFromPortal } from "../../../../../../../server/features/company/CompanyPortalService.js";

export const runtime = "nodejs";

function getIdsFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/companies\/([^/]+)\/portals\/([^/]+)/);
  if (match && match[1] && match[2]) {
    return { companyId: decodeURIComponent(match[1]), portalId: parseInt(match[2], 10) };
  }
  throw new Error("Company ID or Portal ID not found in URL");
}

export const DELETE = createEndpoint(
  async (request) => {
    const { companyId, portalId } = getIdsFromRequest(request);
    if (!Number.isInteger(portalId) || portalId < 1) {
      return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });
    }
    const list = await removeCompanyFromPortal(companyId, portalId);
    return NextResponse.json(list);
  },
  null,
  true
);
