import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { getAllProposals, createProposal } from "../../../../server/features/proposal_db/ProposalDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllProposals();
    return NextResponse.json(list);
  },
  null,
  true
);

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

const postProposalSchema = Joi.object({
  id_proposal: Joi.string().trim().max(128).optional(),
  id_customer: Joi.string().trim().when("status", {
    is: "draft",
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim().required(),
  }),
  id_contact: Joi.string().trim().allow("").optional(),
  additionalContactIds: Joi.array().items(Joi.string()).optional(),
  agent: Joi.string().allow("").optional(),
  title: Joi.string().trim().when("status", {
    is: "draft",
    then: Joi.string().trim().allow("").optional(),
    otherwise: Joi.string().trim().min(1).required(),
  }),
  status: Joi.string().trim().optional(),
  proposal_fase: Joi.string().trim().valid("1", "2", "3", "4", "created").optional(),
  proposal_date: Joi.string().optional(),
  date_created: Joi.string().optional(),
  expiration_date: Joi.string().optional(),
  amount_eur: Joi.number().when("status", {
    is: "draft",
    then: Joi.number().optional().default(0),
    otherwise: Joi.number().required(),
  }),
  general_discount_mode: Joi.string().valid("pct", "abs").optional(),
  general_discount_pct: Joi.number().optional(),
  general_discount_abs_eur: Joi.number().optional(),
  serviceLines: Joi.array()
    .items(serviceLineSchema)
    .when("status", {
      is: "draft",
      then: Joi.array().items(serviceLineSchema).optional().default([]),
      otherwise: Joi.array().items(serviceLineSchema).min(1).required(),
    }),
  payments: Joi.array().items(paymentSchema).optional().default([]),
  isExchange: Joi.boolean().optional(),
  exchangeHasFinalPrice: Joi.boolean().optional(),
  exchangeFinalPrice: Joi.number().optional(),
  exchangeHasBankTransfers: Joi.boolean().optional(),
  exchangePlyniumTransferDate: Joi.string().allow("").optional(),
  exchangeCounterpartDate: Joi.string().allow("").optional(),
  exchangeTransferredAmount: Joi.number().optional(),
  exchangeToBeReceivedHtml: Joi.string().allow("").optional(),
}).unknown(true);

export const POST = createEndpoint(
  async (_request, body) => {
    const created = await createProposal(body);
    return NextResponse.json(created, { status: 201 });
  },
  postProposalSchema,
  true
);

