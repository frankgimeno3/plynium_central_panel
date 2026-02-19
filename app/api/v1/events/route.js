import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllEvents, createEvent } from "../../../../server/features/event/EventService.js";
import Joi from "joi";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const events = await getAllEvents();
    return NextResponse.json(events);
  },
  null,
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
  }),
  true
);
