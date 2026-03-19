import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllServices } from "../../../../server/features/service_db/ServiceDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllServices();
    return NextResponse.json(list);
  },
  null,
  true
);
