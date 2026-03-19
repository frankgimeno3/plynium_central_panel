import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getProjectById } from "../../../../../server/features/project_db/ProjectDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/projects\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_project not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_project = getIdFromRequest(request);
    const project = await getProjectById(id_project);
    return NextResponse.json(project);
  },
  null,
  true
);

