import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllProposals } from "../../../../server/features/proposal_db/ProposalDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllProposals();
    return NextResponse.json(list);
  },
  null,
  true
);

