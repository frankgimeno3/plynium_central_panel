import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllCustomers, createCustomer } from "../../../../server/features/customer_db/CustomerDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllCustomers();
    return NextResponse.json(list);
  },
  null,
  true
);

export const POST = createEndpoint(
  async (request, body) => {
    const customer = await createCustomer(body);
    return NextResponse.json(customer);
  },
  null,
  false
);
