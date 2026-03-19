import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getIssuedInvoiceById } from "../../../../../server/features/billing_db/BillingDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/issued-invoices\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_issued_invoice not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const invoice_id = getIdFromRequest(request);
    const data = await getIssuedInvoiceById(invoice_id);
    return NextResponse.json(data);
  },
  null,
  true
);

