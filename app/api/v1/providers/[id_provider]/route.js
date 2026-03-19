import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getProviderById, getProviderInvoicesByProvider } from "../../../../../server/features/provider_db/ProviderDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/providers\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_provider not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_provider = getIdFromRequest(request);
    const provider = await getProviderById(id_provider);
    const invoices = await getProviderInvoicesByProvider(id_provider);
    return NextResponse.json({ provider, invoices });
  },
  null,
  true
);

