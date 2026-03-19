import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  getOrderByCode,
  updateOrderByCode,
} from "../../../../../server/features/billing_db/BillingDbService.js";
import { getContractById } from "../../../../../server/features/contract_db/ContractDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/orders\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_order not found in URL");
}

const putOrderSchema = Joi.object({
  collection_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amount_eur: Joi.number().min(0).optional(),
  payment_status: Joi.string().valid("paid", "pending").optional(),
}).or("collection_date", "amount_eur", "payment_status");

export const GET = createEndpoint(
  async (request) => {
    const id_order = getIdFromRequest(request);
    const order = await getOrderByCode(id_order);
    let id_proposal = "";
    try {
      if (order?.id_contract) {
        const c = await getContractById(order.id_contract);
        id_proposal = c?.id_proposal ?? "";
      }
    } catch {
      id_proposal = "";
    }
    return NextResponse.json({ ...order, id_proposal });
  },
  null,
  true
);

export const PUT = createEndpoint(
  async (request, body) => {
    const id_order = getIdFromRequest(request);
    const order = await updateOrderByCode(id_order, body);
    let id_proposal = "";
    try {
      if (order?.id_contract) {
        const c = await getContractById(order.id_contract);
        id_proposal = c?.id_proposal ?? "";
      }
    } catch {
      id_proposal = "";
    }
    return NextResponse.json({ ...order, id_proposal });
  },
  putOrderSchema,
  true
);

