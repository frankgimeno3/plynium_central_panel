import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { getProposalById, updateProposal } from "../../../../../server/features/proposal_db/ProposalDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/proposals\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_proposal not found in URL");
}

const serviceLineSchema = Joi.object({
  lineId: Joi.string().optional(),
  id_service: Joi.string().trim().required(),
  description: Joi.string().allow("").optional(),
  specifications: Joi.string().allow("").optional(),
  units: Joi.number().optional(),
  discount_pct: Joi.number().optional(),
  price: Joi.number().optional(),
}).unknown(true);

const paymentSchema = Joi.object({
  paymentId: Joi.string().optional(),
  date: Joi.string().allow(""),
  paymentMethod: Joi.string().valid("recibo", "transferencia_bancaria").optional(),
  bank: Joi.string().allow("").optional(),
  amount: Joi.number().optional(),
}).unknown(true);

const patchProposalSchema = Joi.object({
  title: Joi.string().trim().min(1).max(512).optional(),
  date_created: Joi.string().optional(),
  expiration_date: Joi.string().allow("", null).optional(),
  proposal_date: Joi.string().allow("", null).optional(),
  amount_eur: Joi.number().optional(),
  general_discount_pct: Joi.number().optional(),
  serviceLines: Joi.array().items(serviceLineSchema).optional(),
  payments: Joi.array().items(paymentSchema).optional(),
}).unknown(true);

export const GET = createEndpoint(
  async (request) => {
    const id_proposal = getIdFromRequest(request);
    const proposal = await getProposalById(id_proposal);
    return NextResponse.json(proposal);
  },
  null,
  true
);

export const PATCH = createEndpoint(
  async (request, body, routeParams) => {
    const idFromUrl = getIdFromRequest(request);
    const idFromParams = routeParams?.id_proposal ? decodeURIComponent(String(routeParams.id_proposal)) : "";
    const id_proposal = idFromParams || idFromUrl;
    const updated = await updateProposal(id_proposal, body);
    return NextResponse.json(updated);
  },
  patchProposalSchema,
  true
);

