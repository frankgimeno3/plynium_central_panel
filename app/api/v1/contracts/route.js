import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllContracts } from "../../../../server/features/contract_db/ContractDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllContracts();
    return NextResponse.json(list);
  },
  null,
  true
);

