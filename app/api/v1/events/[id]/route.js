import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import {
  getEventById,
  updateEvent,
  deleteEvent,
} from "../../../../../server/features/event/EventService.js";
import Joi from "joi";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/events\/([^/]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  throw new Error("Event ID not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id = getIdFromRequest(request);
    const event = await getEventById(id);
    return NextResponse.json(event);
  },
  null,
  true
);

export const PUT = createEndpoint(
  async (request, body) => {
    const id = getIdFromRequest(request);
    const event = await updateEvent(id, body);
    return NextResponse.json(event);
  },
  Joi.object({
    event_name: Joi.string().optional(),
    country: Joi.string().allow("").optional(),
    main_description: Joi.string().allow("").optional(),
    region: Joi.string().allow("").optional(),
    start_date: Joi.string().optional(),
    end_date: Joi.string().optional(),
    location: Joi.string().allow("").optional(),
    event_main_image: Joi.string().allow("").optional(),
  }),
  true
);

export const DELETE = createEndpoint(
  async (request) => {
    const id = getIdFromRequest(request);
    const event = await deleteEvent(id);
    return NextResponse.json(event);
  },
  null,
  true
);
