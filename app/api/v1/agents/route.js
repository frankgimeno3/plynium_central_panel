import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllAgents } from "../../../../server/features/agent_db/AgentDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllAgents();
    return NextResponse.json(list);
  },
  null,
  true
);
