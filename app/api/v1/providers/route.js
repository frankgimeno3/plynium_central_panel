import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllProviders } from "../../../../server/features/provider_db/ProviderDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllProviders();
    return NextResponse.json(list);
  },
  null,
  true
);

