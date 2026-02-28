import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getProductById } from "../../../../../../server/features/product/ProductService.js";
import {
  getPortalsByProductId,
  addProductToPortal,
} from "../../../../../../server/features/product/ProductPortalService.js";
import Joi from "joi";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/products\/([^/]+)\/portals/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("Product ID not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id = getIdFromRequest(request);
    const list = await getPortalsByProductId(id);
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
    const product = await getProductById(id);
    const list = await addProductToPortal(id, body.portalId, product?.productName ?? "");
    return NextResponse.json(list);
  },
  postSchema,
  true
);
