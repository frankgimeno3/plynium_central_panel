import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllIssuedInvoices } from "../../../../server/features/billing_db/BillingDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllIssuedInvoices();
    return NextResponse.json(list);
  },
  null,
  true
);

