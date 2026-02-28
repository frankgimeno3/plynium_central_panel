import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getCompanyById } from "../../../../../../server/features/company/CompanyService.js";
import {
  getPortalsByCompanyId,
  addCompanyToPortal,
} from "../../../../../../server/features/company/CompanyPortalService.js";
import Joi from "joi";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/companies\/([^/]+)\/portals/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("Company ID not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id = getIdFromRequest(request);
    const list = await getPortalsByCompanyId(id);
    return NextResponse.json(list);
  },
  null,
  true
);

const postSchema = Joi.object({
  portalId: Joi.number().integer().min(1).required(),
});

export const POST = createEndpoint(
  async (request, body) => {
    const id = getIdFromRequest(request);
    const company = await getCompanyById(id);
    const list = await addCompanyToPortal(id, body.portalId, company?.commercialName ?? "");
    return NextResponse.json(list);
  },
  postSchema,
  true
);
