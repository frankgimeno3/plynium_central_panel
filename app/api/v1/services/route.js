import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { createService, getAllServices } from "../../../../server/features/service_db/ServiceDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllServices();
    return NextResponse.json(list);
  },
  null,
  true
);

const postSchema = Joi.object({
  id_service: Joi.string().trim().allow("").optional(),
  mint_catalog_service_id: Joi.boolean().optional(),
  service_id_year: Joi.number().integer().min(2000).max(2100).optional(),
  name: Joi.string().trim().min(1).required(),
  service_group_id: Joi.string().uuid().required(),
  service_portal: Joi.number().integer().min(0).optional(),
  service_format: Joi.string().allow("").optional(),
  service_description: Joi.string().allow("").optional(),
  service_unit: Joi.string().allow("").optional(),
  service_unit_specifications: Joi.string().allow("").optional(),
  service_unit_price: Joi.number().min(0).optional(),
  tariff_price_eur: Joi.number().min(0).optional(),
}).unknown(false);

export const POST = createEndpoint(
  async (_request, body) => {
    try {
      const created = await createService({
        id_service: body.id_service,
        mint_catalog_service_id: body.mint_catalog_service_id,
        service_id_year: body.service_id_year,
        name: body.name,
        service_group_id: body.service_group_id,
        service_portal: body.service_portal,
        service_format: body.service_format,
        service_description: body.service_description,
        service_unit: body.service_unit,
        service_unit_specifications: body.service_unit_specifications,
        service_unit_price: body.service_unit_price,
        tariff_price_eur: body.tariff_price_eur,
      });
      return NextResponse.json(created, { status: 201 });
    } catch (err) {
      const msg = err?.message ?? "";
      if (msg.includes("already exists")) {
        return NextResponse.json({ message: msg }, { status: 409 });
      }
      if (msg.includes("required") || msg.includes("not found")) {
        return NextResponse.json({ message: msg }, { status: 400 });
      }
      throw err;
    }
  },
  postSchema,
  true
);
