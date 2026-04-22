import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { getServiceById, updateService } from "../../../../../server/features/service_db/ServiceDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/services\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_service not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_service = getIdFromRequest(request);
    try {
      const service = await getServiceById(id_service);
      return NextResponse.json(service);
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Service not found" }, { status: 404 });
      }
      throw err;
    }
  },
  null,
  true
);

const patchSchema = Joi.object({
  service_full_name: Joi.string().trim().min(1).optional(),
  service_group_id: Joi.string().uuid().optional(),
  service_format: Joi.string().allow("").optional(),
  service_description: Joi.string().allow("").optional(),
  service_unit: Joi.string().allow("").optional(),
  service_unit_price: Joi.number().min(0).optional(),
  service_unit_specifications: Joi.string().allow("").optional(),
  // Legacy aliases (older logged UI)
  name: Joi.string().trim().min(1).optional(),
  service_type: Joi.string().valid("newsletter", "portal", "magazine", "other").optional(),
  tariff_price_eur: Joi.number().min(0).optional(),
}).unknown(false);

export const PATCH = createEndpoint(
  async (request, body) => {
    const id_service = getIdFromRequest(request);
    try {
      const updated = await updateService(id_service, body);
      return NextResponse.json(updated);
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Service not found" }, { status: 404 });
      }
      throw err;
    }
  },
  patchSchema,
  true
);
