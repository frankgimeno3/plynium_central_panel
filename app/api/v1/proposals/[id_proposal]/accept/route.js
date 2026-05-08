import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { acceptProposalCreateContractAndProjects } from "../../../../../../server/features/proposal_db/ProposalDbService.js";

export const runtime = "nodejs";

const acceptBodySchema = Joi.object({
  contract_title: Joi.string().trim().min(1).max(255).required(),
}).unknown(true);

export const POST = createEndpoint(
  async (_request, body, routeParams) => {
    const id_proposal = decodeURIComponent(String(routeParams?.id_proposal ?? ""));
    if (!id_proposal) {
      return NextResponse.json({ message: "Missing proposal id" }, { status: 400 });
    }
    const result = await acceptProposalCreateContractAndProjects(id_proposal, {
      contract_title: body.contract_title,
    });
    return NextResponse.json(result, { status: 201 });
  },
  acceptBodySchema,
  true
);
