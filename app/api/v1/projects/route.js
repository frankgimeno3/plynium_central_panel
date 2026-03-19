import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllProjects } from "../../../../server/features/project_db/ProjectDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllProjects();
    return NextResponse.json(list);
  },
  null,
  true
);

