import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllEvents, createEvent } from "../../../../server/features/event/EventService.js";
import Joi from "joi";

export const runtime = "nodejs";

const getSchema = Joi.object({
  name: Joi.string().optional().allow(""),
  region: Joi.string().optional().allow(""),
  dateFrom: Joi.string().optional().allow(""),
  dateTo: Joi.string().optional().allow(""),
  portalNames: Joi.string().optional().allow(""),
});

export const GET = createEndpoint(
  async (request, body) => {
    const name = body?.name ?? "";
    const region = body?.region ?? "";
    const dateFrom = body?.dateFrom ?? "";
    const dateTo = body?.dateTo ?? "";
    const portalNames = body?.portalNames
      ? String(body.portalNames).split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const events = await getAllEvents({
      name: name || undefined,
      region: region || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      portalNames: portalNames.length > 0 ? portalNames : undefined,
    });
    return NextResponse.json(events);
  },
  getSchema,
  true
);

export const POST = createEndpoint(
  async (request, body) => {
    const event = await createEvent(body);
    return NextResponse.json(event);
  },
  Joi.object({
    id_fair: Joi.string().required(),
    event_name: Joi.string().required(),
    country: Joi.string().allow("").optional(),
    main_description: Joi.string().allow("").optional(),
    region: Joi.string().allow("").optional(),
    start_date: Joi.string().required(),
    end_date: Joi.string().required(),
    location: Joi.string().allow("").optional(),
    event_main_image: Joi.string().allow("").optional(),
    portalIds: Joi.array().items(Joi.number().integer().min(1)).optional(),
  }),
  true
);
