import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAgentById } from "../../../../../server/features/agent_db/AgentDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/agents\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_agent not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_agent = getIdFromRequest(request);
    try {
      const agent = await getAgentById(id_agent);
      return NextResponse.json(agent);
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Agent not found" }, { status: 404 });
      }
      throw err;
    }
  },
  null,
  true
);
