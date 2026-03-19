import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  getProviderInvoiceById,
  updateProviderInvoice,
} from "../../../../../server/features/provider_db/ProviderDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/provider-invoices\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_provider_invoice not found in URL");
}

const putProviderInvoiceSchema = Joi.object({
  amount_eur: Joi.number().min(0).optional(),
  payment_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  id_provider: Joi.string().max(64).optional(),
  provider_name: Joi.string().max(512).allow("").optional(),
  label: Joi.string().max(512).allow("").optional(),
}).or(
  "amount_eur",
  "payment_date",
  "id_provider",
  "provider_name",
  "label"
);

export const GET = createEndpoint(
  async (request) => {
    const id = getIdFromRequest(request);
    const invoice = await getProviderInvoiceById(id);
    return NextResponse.json(invoice);
  },
  null,
  true
);

export const PUT = createEndpoint(
  async (request, body) => {
    const id = getIdFromRequest(request);
    const updated = await updateProviderInvoice(id, body);
    return NextResponse.json(updated);
  },
  putProviderInvoiceSchema,
  true
);

