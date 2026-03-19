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
  name: Joi.string().trim().min(1).optional(),
  service_type: Joi.string().valid("newsletter", "portal", "magazine", "other").optional(),
  service_description: Joi.string().allow("").optional(),
  tariff_price_eur: Joi.number().min(0).optional(),
  publication_date: Joi.alternatives()
    .try(Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/), Joi.valid(null))
    .optional(),

  // Optional DB fields kept for extensibility
  display_name: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional(),
  unit: Joi.string().allow("").optional(),
  delivery_days: Joi.number().integer().min(0).optional(),
}).unknown(false);

export const PATCH = createEndpoint(
  async (request, body) => {
    const id_service = getIdFromRequest(request);
    try {
      const normalized =
        body?.publication_date === "" ? { ...body, publication_date: null } : body;
      const updated = await updateService(id_service, normalized);
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
