import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { getCustomerById, updateCustomer } from "../../../../../server/features/customer_db/CustomerDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/customers\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_customer not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_customer = getIdFromRequest(request);
    try {
      const customer = await getCustomerById(id_customer);
      return NextResponse.json(customer);
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Customer not found" }, { status: 404 });
      }
      throw err;
    }
  },
  null,
  true
);

const patchSchema = Joi.object({
  company_categories_array: Joi.array().items(Joi.string().trim()).optional(),
  name: Joi.string().trim().optional(),
  cif: Joi.string().allow("").optional(),
  country: Joi.string().allow("").optional(),
  address: Joi.string().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  email: Joi.string().allow("").optional(),
  website: Joi.string().allow("").optional(),
  industry: Joi.string().allow("").optional(),
  segment: Joi.string().allow("").optional(),
  owner: Joi.string().allow("").optional(),
  source: Joi.string().allow("").optional(),
  status: Joi.string().allow("").optional(),
  revenue_eur: Joi.number().optional(),
  next_activity: Joi.string().allow("").optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  contact: Joi.object().optional(),
  contacts: Joi.array().optional(),
  comments: Joi.array().optional(),
  proposals: Joi.array().items(Joi.string()).optional(),
  contracts: Joi.array().items(Joi.string()).optional(),
  projects: Joi.array().items(Joi.string()).optional(),
  related_accounts: Joi.array().items(Joi.string()).optional(),
  portal_products: Joi.object().optional(),
});

export const PATCH = createEndpoint(
  async (request, body) => {
    const id_customer = getIdFromRequest(request);
    try {
      const customer = await updateCustomer(id_customer, body);
      return NextResponse.json(customer);
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Customer not found" }, { status: 404 });
      }
      throw err;
    }
  },
  patchSchema,
  true
);
