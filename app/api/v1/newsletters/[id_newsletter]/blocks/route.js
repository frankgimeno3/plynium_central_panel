import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getNewsletterBlocks } from "../../../../../../server/features/newsletter/NewsletterDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async (request, body, params) => {
    const blocks = await getNewsletterBlocks(params.id_newsletter);
    return NextResponse.json(blocks);
  },
  null,
  true,
  []
);

