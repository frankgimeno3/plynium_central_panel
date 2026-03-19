import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllPmEvents, getPmEventsByProjectId, getPmEventsByCustomerId } from "../../../../server/features/pm_event_db/PmEventDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async (request) => {
    const url = request?.url ? new URL(request.url) : null;
    const id_project = url?.searchParams?.get("id_project") ?? null;
    const id_customer = url?.searchParams?.get("id_customer") ?? null;
    let list;
    if (id_project) {
      list = await getPmEventsByProjectId(id_project);
    } else if (id_customer) {
      list = await getPmEventsByCustomerId(id_customer);
    } else {
      list = await getAllPmEvents();
    }
    return NextResponse.json(list);
  },
  null,
  true
);
