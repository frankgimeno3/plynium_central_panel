import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { setCategoryPortals } from "../../../../../../server/features/company_category/CompanyCategoryService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/company-categories\/([^/]+)\/portals/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_category not found in URL");
}

const patchSchema = Joi.object({
  portal_ids: Joi.array().items(Joi.number().integer().min(0)).required(),
}).unknown(true);

export const PATCH = createEndpoint(
  async (request, body) => {
    const id_category = getIdFromRequest(request);
    const updated = await setCategoryPortals(id_category, body.portal_ids);
    return NextResponse.json(updated);
  },
  patchSchema,
  true
);

