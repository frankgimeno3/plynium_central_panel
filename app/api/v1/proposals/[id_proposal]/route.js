import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getProposalById } from "../../../../../server/features/proposal_db/ProposalDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/proposals\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_proposal not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_proposal = getIdFromRequest(request);
    const proposal = await getProposalById(id_proposal);
    return NextResponse.json(proposal);
  },
  null,
  true
);

