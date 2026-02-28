import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getEventById } from "../../../../../../server/features/event/EventService.js";
import {
  getPortalsByEventId,
  addEventToPortal,
} from "../../../../../../server/features/event/EventPortalService.js";
import Joi from "joi";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/events\/([^/]+)\/portals/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("Event ID not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id = getIdFromRequest(request);
    const list = await getPortalsByEventId(id);
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
    const event = await getEventById(id);
    const list = await addEventToPortal(id, body.portalId, event?.event_name ?? "");
    return NextResponse.json(list);
  },
  postSchema,
  true
);
