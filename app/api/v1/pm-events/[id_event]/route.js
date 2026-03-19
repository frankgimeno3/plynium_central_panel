import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getPmEventById } from "../../../../../server/features/pm_event_db/PmEventDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/pm-events\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_event not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_event = getIdFromRequest(request);
    const event = await getPmEventById(id_event);
    return NextResponse.json(event);
  },
  null,
  true
);
