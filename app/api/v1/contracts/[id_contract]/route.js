import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getContractById } from "../../../../../server/features/contract_db/ContractDbService.js";
import { getProposalById } from "../../../../../server/features/proposal_db/ProposalDbService.js";
import { getProjectsByContract } from "../../../../../server/features/project_db/ProjectDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/contracts\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_contract not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_contract = getIdFromRequest(request);
    const contract = await getContractById(id_contract);
    let proposal = null;
    try {
      if (contract?.id_proposal) proposal = await getProposalById(contract.id_proposal);
    } catch {
      proposal = null;
    }
    const projects = await getProjectsByContract(id_contract);
    return NextResponse.json({ contract, proposal, projects });
  },
  null,
  true
);

